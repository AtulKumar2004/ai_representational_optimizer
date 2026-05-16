// app/analyze/components/FullReportSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Full Report" tab view — a long-form read-only summary of every analysis
// dimension: score breakdown, AI perception, issues, action plan, gap analysis,
// fix playbook, and (optionally) the AI-rewritten description.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../../api/analyze/route";
import { SCORE_LABELS, scoreColor } from "../utils";
import { ScoreRing, IssueCard, RecCard } from "./ui";

interface FullReportSectionProps {
  result: AnalysisResult;
  context: string; // URL or description used as the analysis input
}

export function FullReportSection({ result, context }: FullReportSectionProps) {
  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
              Full Report
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">AI Readiness Analysis</h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {context.slice(0, 120)}
              {context.length > 120 ? "…" : ""}
            </p>
          </div>
          <div className="text-right">
            {/* Overall score badge */}
            <div
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
                result.overall_score >= 75
                  ? "bg-emerald-100 text-emerald-800"
                  : result.overall_score >= 50
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {result.overall_score}/100 — {result.overall_label}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Potential lift:{" "}
              <span className="font-semibold text-emerald-600">{result.potential_lift}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Score Breakdown ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>

        {/* Ring chart row */}
        <div className="mt-6 flex flex-wrap justify-around gap-6">
          {Object.entries(result.score_breakdown).map(([key, val]) => (
            <ScoreRing key={key} score={val} label={SCORE_LABELS[key]} />
          ))}
        </div>

        {/* Bar chart rows */}
        <div className="mt-6 space-y-3">
          {Object.entries(result.score_breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-[11px] text-slate-500">
                {SCORE_LABELS[key]}
              </span>
              <div className="flex-1 rounded-full bg-orange-50" style={{ height: 8 }}>
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
      </div>

      {/* ── AI Perception Analysis ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">AI Perception Analysis</p>
        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-slate-700">
          {result.ai_snapshot}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Strengths */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Strengths
            </p>
            <ul className="mt-3 space-y-2">
              {result.perceived_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {/* Weaknesses */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500">
              Weaknesses
            </p>
            <ul className="mt-3 space-y-2">
              {result.perceived_weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Top Issues ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">
          Top Issues ({result.top_issues.length})
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.top_issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
      </div>

      {/* ── Complete Action Plan ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Complete Action Plan</p>
        <div className="mt-4 space-y-3">
          {result.ranked_action_plan.map((rec, i) => (
            <RecCard key={i} rec={rec} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* ── Gap Analysis ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">
          Perception vs. Intent Gap Analysis
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              AI currently perceives
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {result.comparison.ai_perceives}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Merchant wants to be seen as
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {result.comparison.merchant_intent}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {result.comparison.gaps.map((gap, i) => (
            <div
              key={i}
              className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4"
            >
              <p className="text-xs font-semibold text-orange-700">{gap.dimension}</p>
              <div className="mt-2 grid gap-2 text-[11px] lg:grid-cols-3">
                <div>
                  <span className="font-semibold text-slate-500">AI sees: </span>
                  <span className="text-slate-700">{gap.ai_perceives}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">You want: </span>
                  <span className="text-slate-700">{gap.merchant_intent}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Gap: </span>
                  <span className="text-slate-700">{gap.gap_explanation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fix Playbook ── */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Complete Fix Playbook</p>
        <ol className="mt-4 space-y-2">
          {result.fix_playbook.map((step, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border border-orange-100 bg-[#fffaf5] p-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[11px] leading-5 text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── AI-Optimised Rewrite (only shown when available) ── */}
      {result.rewritten_description && (
        <div className="rounded-3xl border-2 border-orange-300 bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">✨</span>
            <p className="text-sm font-bold text-orange-700">AI-Optimised Rewrite</p>
          </div>
          <p className="mb-4 text-[11px] text-slate-500">
            How your product description should read to score higher with AI shopping agents:
          </p>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm leading-7 text-slate-800">{result.rewritten_description}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.rewritten_description!)}
            className="mt-3 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-50"
          >
            📋 Copy rewritten description
          </button>
        </div>
      )}
    </div>
  );
}