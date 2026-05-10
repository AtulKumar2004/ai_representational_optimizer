// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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
  all_issues: Issue[];
  top_recommendations: Recommendation[];
  ranked_action_plan: Recommendation[];
  ai_snapshot: string;
  ai_perception_full: string;
  perceived_strengths: string[];
  perceived_weaknesses: string[];
  fix_playbook: string[];
  comparison: {
    ai_perceives: string;
    merchant_intent: string;
    gaps: ComparisonGap[];
  };
}

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert AI Readiness Analyst specializing in how AI shopping agents (like those used in ChatGPT Shopping, Perplexity, Google SGE) perceive and represent Shopify/e-commerce stores.

Analyze the provided store URL or product description and return ONLY a valid JSON object — no markdown, no backticks, no preamble, no explanation.

The JSON must follow this exact schema:
{
  "overall_score": <integer 0-100>,
  "overall_label": <"Poor" | "Fair" | "Good" | "Excellent">,
  "potential_lift": <string like "+12%" representing conversion improvement if issues are fixed>,
  "score_breakdown": {
    "product_clarity": <integer 0-100>,
    "faq_coverage": <integer 0-100>,
    "trust_signals": <integer 0-100>,
    "policy_completeness": <integer 0-100>,
    "structured_data": <integer 0-100>
  },
  "top_issues": [
    { "title": <string>, "description": <string 1-2 sentences>, "severity": <"High"|"Med"|"Low"> },
    { "title": <string>, "description": <string 1-2 sentences>, "severity": <"High"|"Med"|"Low"> },
    { "title": <string>, "description": <string 1-2 sentences>, "severity": <"High"|"Med"|"Low"> }
  ],
  "all_issues": [
    { "title": <string>, "description": <string 1-2 sentences>, "severity": <"High"|"Med"|"Low"> }
  ],
  "top_recommendations": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
  ],
  "ranked_action_plan": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
  ],
  "ai_snapshot": <string: 2-3 sentence summary of how AI agents currently perceive this store>,
  "ai_perception_full": <string: 4-5 sentence detailed narrative of AI agent understanding>,
  "perceived_strengths": [<string>, <string>, <string>],
  "perceived_weaknesses": [<string>, <string>, <string>],
  "fix_playbook": [<string>, <string>, <string>],
  "comparison": {
    "ai_perceives": <short phrase>,
    "merchant_intent": <short phrase>,
    "gaps": [
      {
        "dimension": <string>,
        "ai_perceives": <string>,
        "merchant_intent": <string>,
        "gap_explanation": <string>
      }
    ]
  }
}

Scoring rubric:
- product_clarity: Are product names, descriptions, materials, dimensions, and use cases unambiguous?
- faq_coverage: Does the store answer common buyer questions (shipping, returns, sizing, warranties)?
- trust_signals: Reviews, certifications, social proof, return guarantees, secure payment signals?
- policy_completeness: Shipping, returns, privacy, warranty policies — clear and findable?
- structured_data: Schema.org markup, Open Graph, structured metadata present and correct?

Be specific and realistic. All scores must be integers 0-100. Return ONLY the JSON object, nothing else.`;

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, mode } = body as { input: string; mode: "url" | "description" };

    if (!input || input.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a valid store URL or product description." },
        { status: 400 }
      );
    }

    const userMessage =
      mode === "url"
        ? `Analyze this e-commerce store for AI representation quality and readiness: ${input}`
        : `Analyze this product description for AI representation quality and readiness:\n\n${input}`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userMessage}`;

    // ── Gemini API call ──────────────────────────────────────────────────────
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Gemini API request failed. Check your API key." },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();

    // ── Extract text from Gemini response ────────────────────────────────────
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini returned an empty response. Please retry." },
        { status: 500 }
      );
    }

    // Strip accidental markdown fences
    const cleaned = rawText.replace(/```json|```/gi, "").trim();

    // ── Parse JSON ───────────────────────────────────────────────────────────
    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed. Raw output:", cleaned);
      return NextResponse.json(
        { error: "Model returned malformed JSON. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error. Please retry." },
      { status: 500 }
    );
  }
}