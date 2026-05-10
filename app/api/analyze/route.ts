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

Analyze the provided store URL or product description and return ONLY a valid JSON object — no markdown, no backticks, no preamble.

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
    // 5-7 items total, sorted by severity desc
  ],
  "top_recommendations": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> },
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
  ],
  "ranked_action_plan": [
    { "title": <string>, "detail": <string>, "priority": <"High"|"Medium"|"Low">, "effort": <"Low"|"Medium"|"High"> }
    // 5-6 items, sorted by impact/effort ratio
  ],
  "ai_snapshot": <string: 2-3 sentence summary of how AI agents currently perceive this store>,
  "ai_perception_full": <string: 4-5 sentence detailed narrative of AI agent understanding>,
  "perceived_strengths": [<string>, <string>, <string>],
  "perceived_weaknesses": [<string>, <string>, <string>],
  "fix_playbook": [<string: concrete action>, <string>, <string>],
  "comparison": {
    "ai_perceives": <short phrase: how AI sees the brand>,
    "merchant_intent": <short phrase: what the brand wants to be>,
    "gaps": [
      {
        "dimension": <string: e.g. "Sustainability claims">,
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

Be specific and realistic. Scores must be integers. Severity must be exact strings. Keep descriptions concise and actionable.`;

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

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      return NextResponse.json(
        { error: "Claude API request failed. Check your API key and quota." },
        { status: claudeRes.status }
      );
    }

    const claudeData = await claudeRes.json();

    // Extract text blocks from response
    const rawText: string = claudeData.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/gi, "").trim();

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