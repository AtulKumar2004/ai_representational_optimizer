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

// ─── URL validation ───────────────────────────────────────────────────────────

/**
 * Returns true only if the string is a well-formed http/https URL.
 * Catches typos like "htp://", missing TLD, bare words, etc.
 */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Scrape helper ────────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 15000);

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Schema validation + safe fallbacks ──────────────────────────────────────

/**
 * Checks that all required top-level fields exist on the parsed object.
 * Fills in safe defaults for any missing optional or array fields so the
 * UI never crashes on undefined access even if the LLM omitted something.
 */
function validateAndHeal(raw: Record<string, unknown>): AnalysisResult {
  const SCORE_KEYS: (keyof ScoreBreakdown)[] = [
    "product_clarity",
    "faq_coverage",
    "trust_signals",
    "policy_completeness",
    "structured_data",
  ];

  // overall_score must be a 0-100 integer
  if (
    typeof raw.overall_score !== "number" ||
    raw.overall_score < 0 ||
    raw.overall_score > 100
  ) {
    throw new Error("Invalid or missing overall_score.");
  }

  // overall_label must be one of the four allowed values
  const validLabels = ["Poor", "Fair", "Good", "Excellent"];
  if (!validLabels.includes(raw.overall_label as string)) {
    throw new Error("Invalid or missing overall_label.");
  }

  // score_breakdown must exist and all five keys must be 0-100 integers
  const sb = raw.score_breakdown as Record<string, unknown> | undefined;
  if (!sb || typeof sb !== "object") {
    throw new Error("Missing score_breakdown.");
  }
  for (const key of SCORE_KEYS) {
    if (typeof sb[key] !== "number" || (sb[key] as number) < 0 || (sb[key] as number) > 100) {
      throw new Error(`Invalid score_breakdown.${key}.`);
    }
  }

  // comparison block must exist
  const cmp = raw.comparison as Record<string, unknown> | undefined;
  if (!cmp || typeof cmp !== "object") {
    throw new Error("Missing comparison block.");
  }

  // ── Safe fallbacks for array / optional fields ────────────────────────────
  // These won't throw — they just ensure the UI always receives arrays,
  // even if the LLM truncated its response mid-way.

  const ensureArray = (v: unknown): unknown[] =>
    Array.isArray(v) ? v : [];

  const ensureString = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

  return {
    overall_score:        raw.overall_score as number,
    overall_label:        raw.overall_label as AnalysisResult["overall_label"],
    potential_lift:       ensureString(raw.potential_lift, "+0%"),
    score_breakdown: sb as unknown as ScoreBreakdown,
    top_issues:           ensureArray(raw.top_issues) as Issue[],
    top_recommendations:  ensureArray(raw.top_recommendations) as Recommendation[],
    ranked_action_plan:   ensureArray(raw.ranked_action_plan) as Recommendation[],
    ai_snapshot:          ensureString(raw.ai_snapshot, "No snapshot available."),
    perceived_strengths:  ensureArray(raw.perceived_strengths) as string[],
    perceived_weaknesses: ensureArray(raw.perceived_weaknesses) as string[],
    fix_playbook:         ensureArray(raw.fix_playbook) as string[],
    rewritten_description: typeof raw.rewritten_description === "string"
      ? raw.rewritten_description
      : undefined,
    input_consistency: raw.input_consistency as AnalysisResult["input_consistency"],
    comparison: {
      ai_perceives:   ensureString(cmp.ai_perceives, "Unknown"),
      merchant_intent: ensureString(cmp.merchant_intent, "Unknown"),
      gaps:           ensureArray(cmp.gaps) as ComparisonGap[],
    },
  };
}

// ─── Input pre-validation ─────────────────────────────────────────────────────

/**
 * Returns a user-facing error string if the input looks like gibberish,
 * or null if the input is acceptable to pass to the LLM.
 *
 * Checks applied:
 *  - Minimum meaningful length (10 chars after trimming)
 *  - Not purely numeric / punctuation
 *  - Not a repeating-character spam string (e.g. "aaaaaaaaaa")
 */
function preValidateInput(input: string, mode: "url" | "description"): string | null {
  const trimmed = input.trim();

  if (trimmed.length < 10) {
    return mode === "url"
      ? "Please enter a complete store URL (e.g. https://yourstore.com)."
      : "Please enter a product description of at least 10 characters.";
  }

  // For description mode: catch obvious gibberish
  if (mode === "description") {
    // Purely numeric
    if (/^\d+$/.test(trimmed)) {
      return "That doesn't look like a product description. Please paste your store or product content.";
    }

    // Single repeated character (e.g. "aaaaaaa", ".........")
    if (/^(.)\1{9,}$/.test(trimmed)) {
      return "Please enter a meaningful product description, not repeated characters.";
    }

    // Very high ratio of non-alphabetic characters (likely code/binary paste)
    const alphaCount = (trimmed.match(/[a-zA-Z]/g) ?? []).length;
    if (alphaCount / trimmed.length < 0.2 && trimmed.length > 30) {
      return "The input doesn't appear to contain readable text. Please paste a product description or store content.";
    }
  }

  return null; // input looks fine
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { input, mode, model, apiKey } = await req.json() as {
      input: string;
      mode: "url" | "description";
      model?: string;
      apiKey?: string;
    };

    // ── 1. Basic presence check ───────────────────────────────────────────────
    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a store URL or product description." },
        { status: 400 }
      );
    }

    // ── 2. URL format check (before attempting any network fetch) ─────────────
    if (mode === "url" && !isValidUrl(input.trim())) {
      return NextResponse.json(
        { error: "That doesn't look like a valid URL. Please include https:// and a full domain (e.g. https://yourstore.com)." },
        { status: 400 }
      );
    }

    // ── 3. Input content pre-validation ───────────────────────────────────────
    const preValidationError = preValidateInput(input, mode);
    if (preValidationError) {
      return NextResponse.json({ error: preValidationError }, { status: 400 });
    }

    // ── 4. Build user message ─────────────────────────────────────────────────
    let userMessage = "";

    if (mode === "url") {
      let scrapedText = "";

      try {
        scrapedText = await fetchPageText(input.trim());
      } catch (err) {
        const reason = err instanceof Error ? err.message : "unknown";
        // Distinguish timeout from other fetch failures
        if (reason.toLowerCase().includes("abort")) {
          return NextResponse.json(
            { error: "The store URL took too long to respond (>12s). Try again or paste the content manually." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `Could not fetch the store page (${reason}). Check the URL or paste the content manually.` },
          { status: 400 }
        );
      }

      // ── 5. Empty scrape check ───────────────────────────────────────────────
      // Some pages (Cloudflare-protected, JS-only SPAs, paywalls) return
      // almost no readable text after stripping HTML. Catch this early
      // rather than sending a near-empty prompt to the LLM.
      if (scrapedText.trim().length < 100) {
        return NextResponse.json(
          {
            error:
              "Not enough readable content could be extracted from that URL. The page may be JavaScript-only, Cloudflare-protected, or require login. Try pasting the product description instead.",
          },
          { status: 400 }
        );
      }

      userMessage = `
Analyze this ecommerce store for AI representation quality and readiness.

Store URL:
${input.trim()}

Extracted Website Content:
${scrapedText}
`;
    } else {
      userMessage = `
Analyze this product description for AI representation quality and readiness:

${input.trim()}
`;
    }

    // ── 6. Groq API call ──────────────────────────────────────────────────────
    const resolvedGroq   = apiKey ? new Groq({ apiKey }) : groq;
    const resolvedModel  = model ?? "llama-3.3-70b-versatile";

    const completion = await resolvedGroq.chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "The AI model returned an empty response. Please retry." },
        { status: 500 }
      );
    }

 // ── 7. Extract JSON + retry once if malformed ─────────────────────────
    const tryParseJson = (text: string): Record<string, unknown> | null => {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try { return JSON.parse(match[0]); } catch { return null; }
    };

    let rawParsed = tryParseJson(rawText);

    if (!rawParsed) {
      console.warn("First response malformed — retrying with explicit JSON prompt.");
      const retryCompletion = await resolvedGroq.chat.completions.create({
        model: resolvedModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
          { role: "assistant", content: rawText },
          { role: "user", content: "Your response was not valid JSON. Return ONLY the raw JSON object — no markdown, no backticks, no explanation. Start with { and end with }." },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });
      const retryText = retryCompletion.choices[0]?.message?.content ?? "";
      rawParsed = tryParseJson(retryText);

      if (!rawParsed) {
        console.error("Retry also failed:", retryText.slice(0, 300));
        return NextResponse.json(
          { error: "The model did not return a structured response after retry. Please try again." },
          { status: 500 }
        );
      }
    }

    // ── 8. Schema validation + healing ────────────────────────────────────
    // Throws if critical fields are missing/wrong; fills safe defaults for
    // optional/array fields so the UI never crashes on undefined access.
    let result: AnalysisResult;
    try {
      result = validateAndHeal(rawParsed);
    } catch (validationErr) {
      const reason = validationErr instanceof Error ? validationErr.message : "schema mismatch";
      console.error("Schema validation failed:", reason, "\nRaw:", rawParsed);
      return NextResponse.json(
        { error: "The model response was incomplete. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("Route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}