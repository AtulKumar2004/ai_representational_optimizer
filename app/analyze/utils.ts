// app/analyze/utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utility functions and constants shared across the Analyze feature.
// ─────────────────────────────────────────────────────────────────────────────

import type { Issue, Recommendation } from "../api/analyze/route";

/** Maps score_breakdown keys to human-readable labels */
export const SCORE_LABELS: Record<string, string> = {
  product_clarity: "Product clarity",
  faq_coverage: "FAQ coverage",
  trust_signals: "Trust signals",
  policy_completeness: "Policy completeness",
  structured_data: "Structured data",
};

/** Returns a CSS color string based on a 0–100 score */
export function scoreColor(v: number): string {
  if (v >= 75) return "#10b981";
  if (v >= 50) return "#f97316";
  return "#ef4444";
}

/** Returns Tailwind classes for a severity badge on an Issue */
export function severityClass(s: Issue["severity"]): string {
  return s === "High"
    ? "bg-red-50 text-red-700 border-red-200"
    : s === "Med"
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

/** Returns a Tailwind bg class for the colored dot next to a priority label */
export function priorityDot(p: Recommendation["priority"]): string {
  return p === "High"
    ? "bg-red-400"
    : p === "Medium"
    ? "bg-orange-400"
    : "bg-emerald-400";
}

/** Returns Tailwind classes for the effort badge on a Recommendation */
export function effortBadge(e: Recommendation["effort"]): string {
  return e === "Low"
    ? "bg-emerald-100 text-emerald-700"
    : e === "Medium"
    ? "bg-orange-100 text-orange-700"
    : "bg-red-100 text-red-700";
}

/** Returns Tailwind classes for a score status chip */
export function statusChipClass(v: number): string {
  return v >= 70
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : v >= 50
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : "border-red-200 bg-red-50 text-red-700";
}

/** Returns a label and Tailwind classes based on a trust score */
export function trustStatus(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Strong", className: "bg-emerald-100 text-emerald-700" };
  if (score >= 60) return { label: "Partial", className: "bg-orange-100 text-orange-700" };
  if (score >= 40) return { label: "Weak", className: "bg-red-100 text-red-700" };
  return { label: "Missing", className: "bg-red-200 text-red-800" };
}

/** Formats a Date object to a short, readable string */
export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}