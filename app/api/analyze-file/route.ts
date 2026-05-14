//app/api/analyze-file/route.ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import path from "path";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert AI readiness analyst for how AI shopping agents perceive and represent e-commerce stores.

Return ONLY a valid JSON object (no markdown, no backticks, no preamble). Keep outputs concise, structured, and deterministic.

Do not invent policies, features, reviews, certifications, or trust signals not implied by the input.
If information is missing or uncertain, be conservative and reduce scores accordingly.

The JSON must follow this exact schema:
{
  "overall_score": <integer 0-100>,
  "overall_label": <"Poor" | "Fair" | "Good" | "Excellent">,
  "potential_lift": <string like "+12%">,
  "score_breakdown": {
    "product_clarity": <integer 0-100>,
    "faq_coverage": <integer 0-100>,
    "trust_signals": <integer 0-100>,
    "policy_completeness": <integer 0-100>,
    "structured_data": <integer 0-100>
  },
  "top_issues": [
    { "title": <string>, "description": <string>, "severity": <"High"|"Med"|"Low"> },
    { "title": <string>, "description": <string>, "severity": <"High"|"Med"|"Low"> },
    { "title": <string>, "description": <string>, "severity": <"High"|"Med"|"Low"> }
  ],
  "top_recommendations": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
  ],
  "ranked_action_plan": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
  ],
  "ai_snapshot": <string: 1-2 sentences>,
  "perceived_strengths": [<string>, <string>, <string>],
  "perceived_weaknesses": [<string>, <string>, <string>],
  "fix_playbook": [<string>, <string>, <string>],
  "rewritten_description": <string: only when analyzing a product description (not a URL) — provide a fully rewritten, AI-optimized version of the input product description that would score higher across all dimensions. Make it specific, trust-building, FAQ-rich, policy-clear, and structured for AI parsing. 3-5 sentences minimum. Omit this field or set to "" when analyzing a URL.>,
  "input_consistency": {
    "consistencyLevel": <"HIGH" | "MEDIUM" | "LOW">,
    "canGenerateUnifiedReport": <true|false>,
    "warning": <string>,
    "mismatches": [<string>, <string>]
  },
  "comparison": {
    "ai_perceives": <short phrase>,
    "merchant_intent": <short phrase>,
    "gaps": [
      { "dimension": <string>, "ai_perceives": <string>, "merchant_intent": <string>, "gap_explanation": <string> },
      { "dimension": <string>, "ai_perceives": <string>, "merchant_intent": <string>, "gap_explanation": <string> },
      { "dimension": <string>, "ai_perceives": <string>, "merchant_intent": <string>, "gap_explanation": <string> }
    ]
  }
}

Rules:
- Keep strings short and factual. Avoid long paragraphs.
- All scores must be integers 0-100
- severity must be exactly "High", "Med", or "Low"
- priority must be exactly "High", "Medium", or "Low"
- effort must be exactly "Low", "Medium", or "High"
- Return ONLY the JSON object, nothing else. No backticks. No markdown.`;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 12000;
const SUPPORTED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "csv",
  "xlsx",
  "json",
]);

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  return ext;
}

function normalizeText(text: string): string {
  return text.replace(/\s+$/g, "").trim();
}

async function extractText(filePath: string, buffer: Buffer, ext: string): Promise<string> {
  if (ext === "txt" || ext === "csv" || ext === "json") {
    const raw = buffer.toString("utf-8");
    if (ext === "json") {
      try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return raw;
      }
    }
    return raw;
  }

  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "xlsx") {
    const xlsx = await import("xlsx");
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      return `# ${name}\n${csv}`;
    });
    return sheets.join("\n\n");
  }

  throw new Error("Unsupported file type.");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const model = form.get("model")?.toString();
    const apiKey = form.get("apiKey")?.toString();
    const returnText = form.get("returnText")?.toString() === "1";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a valid file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 413 });
    }

    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sisyphus-"));
    const tempPath = path.join(tempDir, file.name.replace(/[^a-zA-Z0-9._-]/g, "_"));

    let extracted = "";
    try {
      await fs.writeFile(tempPath, buffer);
      extracted = await extractText(tempPath, buffer, ext);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    const cleaned = normalizeText(extracted);
    if (!cleaned) {
      return NextResponse.json({ error: "No readable text found in this file." }, { status: 400 });
    }

    const clipped = cleaned.length > MAX_TEXT_CHARS ? cleaned.slice(0, MAX_TEXT_CHARS) : cleaned;

    if (returnText) {
      return NextResponse.json({ text: clipped }, { status: 200 });
    }

    const userMessage = `Analyze the following file content for AI representation quality. Use the content as the primary source of truth. If the content includes a product description, provide rewritten_description; otherwise omit it.\n\nFile name: ${file.name}\nFile type: ${file.type || ext}\n\nExtracted content:\n${clipped}`;

    const resolvedGroq = apiKey ? new Groq({ apiKey }) : groq;
    const resolvedModel = model ?? "llama-3.3-70b-versatile";

    const completion = await resolvedGroq.chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";
    if (!rawText) {
      return NextResponse.json({ error: "Groq returned an empty response. Please retry." }, { status: 500 });
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No JSON found in response. Please retry." }, { status: 500 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Model returned malformed JSON. Please retry." }, { status: 500 });
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
