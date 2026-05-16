// app/analyze/components/ScoreCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The right column of the input row. Shows two stacked cards:
//   1. AI Readiness Score — the overall ring + potential lift text.
//   2. Score Breakdown — a bar chart across the five scoring dimensions.
//
// Both cards handle three states: loading (skeleton), result, and empty.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../../api/analyze/route";
import { SCORE_LABELS, scoreColor, statusChipClass } from "../utils";
import { Skeleton } from "./ui";
import type { Tab } from "../types";

interface ScoreCardProps {
  result: AnalysisResult | null;
  loading: boolean;
  /** Derived confidence value (62–96) computed in the page */
  aiConfidence: number | null;
  /** Chip items for the breakdown category row */
  trustSignals: { label: string; score: number }[];
  onSetTab: (tab: Tab) => void;
}

export function ScoreCard({
  result,
  loading,
  aiConfidence,
  trustSignals,
  onSetTab,
}: ScoreCardProps) {
  return (
    <div className="flex h-full flex-col gap-3">

      {/* ── Card 1: AI Readiness Score ── */}
      <div className="flex-1 rounded-3xl border border-orange-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              AI Readiness Score
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">Current readiness</p>
          </div>

          {/* Overall label badge */}
          {result && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result.overall_label === "Excellent" || result.overall_label === "Good"
                  ? "bg-emerald-100 text-emerald-700"
                  : result.overall_label === "Fair"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result.overall_label}
            </span>
          )}
        </div>

        {/* AI confidence bar (only when we have a result) */}
        {aiConfidence !== null && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
              AI Confidence
            </span>
            <div className="h-1.5 w-28 rounded-full bg-orange-50">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${aiConfidence}%` }}
              />
            </div>
            <span className="font-semibold text-slate-700">{aiConfidence}%</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-3 space-y-2">
            <Skeleton h="h-20" w="w-20" />
            <Skeleton h="h-4" w="w-3/4" />
            <Skeleton h="h-4" w="w-1/2" />
          </div>
        )}

        {/* Result state: score ring + potential lift */}
        {result && !loading && (
          <div className="mt-3 flex items-center gap-4">
            {/* Colored ring showing the numeric score */}
            <div
              className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[6px] ${
                result.overall_score >= 75
                  ? "border-emerald-400"
                  : result.overall_score >= 50
                  ? "border-orange-400"
                  : "border-red-400"
              }`}
            >
              <span className="text-xl font-bold text-slate-900">{result.overall_score}</span>
              <span className="absolute -bottom-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                /100
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Potential lift</p>
              <p className="text-lg font-bold text-emerald-600">{result.potential_lift}</p>
              <p className="mt-1 text-xs text-slate-400">{result.ai_snapshot}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[7px] border-orange-100">
              <span className="text-2xl font-bold text-orange-200">—</span>
            </div>
            <p className="text-sm text-slate-400">
              Run an analysis to see your AI readiness score.
            </p>
          </div>
        )}
      </div>

      {/* ── Card 2: Score Breakdown ── */}
      <div className="flex-1 rounded-3xl border border-orange-100 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>

        {/* Category chips row */}
        {trustSignals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {trustSignals.map((item) => (
              <span
                key={item.label}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusChipClass(item.score)}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {item.label}
              </span>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-3 space-y-2">
            {["w-28", "w-44", "w-36", "w-40"].map((w, i) => (
              <Skeleton key={i} h="h-3" w={w} />
            ))}
          </div>
        )}

        {/* Result state: bar chart */}
        {result && !loading && (
          <div className="mt-3 space-y-2">
            {Object.entries(result.score_breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[11px] text-slate-500">
                  {SCORE_LABELS[key]}
                </span>
                <div className="flex-1 rounded-full bg-orange-50" style={{ height: 6 }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: scoreColor(val) }}
                  />
                </div>
                <span className="w-7 text-right text-[11px] font-semibold text-slate-700">
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="mt-3 animate-pulse space-y-3">
            {["w-28", "w-44", "w-36", "w-40"].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded-full bg-orange-100`} />
            ))}
          </div>
        )}

        {/* Link to the issues tab for more detail */}
        <button
          className="mt-4 text-sm font-semibold text-orange-600"
          onClick={() => onSetTab("issues")}
        >
          View breakdown
        </button>
      </div>
    </div>
  );
}