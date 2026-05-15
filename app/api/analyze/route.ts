// app/api/analyze/route.ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  product_clarity: number;
  faq_coverage: number;
  trust_signals: number;
  policy_completeness: number;
  structured_data: number;
}

export interface Issue {
  title: string;
  description: string;
  severity: "High" | "Med" | "Low";
}

export interface Recommendation {
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
  effort: "Low" | "Medium" | "High";
}

export interface ComparisonGap {
  dimension: string;
  ai_perceives: string;
  merchant_intent: string;
  gap_explanation: string;
}

export interface AnalysisResult {
  overall_score: number;
  overall_label: "Poor" | "Fair" | "Good" | "Excellent";
  potential_lift: string;
  score_breakdown: ScoreBreakdown;
  top_issues: Issue[];
  top_recommendations: Recommendation[];
  ranked_action_plan: Recommendation[];
  ai_snapshot: string;
  perceived_strengths: string[];
  perceived_weaknesses: string[];
  fix_playbook: string[];
  rewritten_description?: string;
  input_consistency?: {
    consistencyLevel: "HIGH" | "MEDIUM" | "LOW";
    canGenerateUnifiedReport: boolean;
    warning: string;
    mismatches: string[];
  };
  comparison: {
    ai_perceives: string;
    merchant_intent: string;
    gaps: ComparisonGap[];
  };
}

// ─── Groq client ──────────────────────────────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// ─── System prompt ────────────────────────────────────────────────────────────

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

// ─── Route handler ────────────────────────────────────────────────────────────

async function fetchPageText(
  url: string
): Promise<string> {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    12000
  );

  try {
    const res = await fetch(
      url,
      {
        signal:
          controller.signal,

        headers: {
          "User-Agent":
            "Mozilla/5.0",
        },

        redirect: "follow",
      }
    );

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status}`
      );
    }

    const html =
      await res.text();

    const text = html
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(
        /<!--[\s\S]*?-->/g,
        " "
      )
      .replace(
        /<[^>]+>/g,
        " "
      )
      .replace(
        /\s{2,}/g,
        " "
      )
      .trim()
      .slice(0, 15000);

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const { input, mode, model, apiKey } = await req.json() as {
      input: string;
      mode: "url" | "description";
      model?: string;
      apiKey?: string;
    };

    if (!input || input.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a valid store URL or product description." },
        { status: 400 }
      );
    }

    let userMessage = "";

if (mode === "url") {
  let scrapedText = "";

  try {
    scrapedText =
      await fetchPageText(
        input
      );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Failed to scrape website.",
      },
      {
        status: 400,
      }
    );
  }

  userMessage = `
Analyze this ecommerce store for AI representation quality and readiness.

Store URL:
${input}

Extracted Website Content:
${scrapedText}
`;
} else {
  userMessage = `
Analyze this product description for AI representation quality and readiness:

${input}
`;
}
    // Use caller-supplied key/model if provided, otherwise fall back to env defaults
    const resolvedGroq = apiKey
      ? new Groq({ apiKey })
      : groq;

    const resolvedModel = model ?? "llama-3.3-70b-versatile";

    // ── Groq API call ─────────────────────────────────────────────────────────
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
      return NextResponse.json(
        { error: "Groq returned an empty response. Please retry." },
        { status: 500 }
      );
    }

    // ── Extract JSON robustly ─────────────────────────────────────────────────
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found. Raw output:", rawText);
      return NextResponse.json(
        { error: "No JSON found in response. Please retry." },
        { status: 500 }
      );
    }

    // ── Parse JSON ────────────────────────────────────────────────────────────
    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("JSON parse failed. Raw output:", jsonMatch[0]);
      return NextResponse.json(
        { error: "Model returned malformed JSON. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("Route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}