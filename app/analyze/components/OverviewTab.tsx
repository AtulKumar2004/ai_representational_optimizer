// app/analyze/components/OverviewTab.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Overview" tab content — four summary cards shown after an analysis:
//   1. Top Recommendations
//   2. Top Issues
//   3. Trust Signal Analysis
//   4. AI Understanding Snapshot
//   5. Fix Playbook preview
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../../api/analyze/route";
import { scoreColor, trustStatus } from "../utils";
import { Skeleton, IssueCard, RecCard } from "./ui";
import type { Tab } from "../types";

interface OverviewTabProps {
  result: AnalysisResult | null;
  loading: boolean;
  trustSignalRows: { label: string; score: number }[];
  trustConfidence: number | null;
  aiSnapshotShort: string;
  onSetTab: (tab: Tab) => void;
}

export function OverviewTab({
  result,
  loading,
  trustSignalRows,
  trustConfidence,
  aiSnapshotShort,
  onSetTab,
}: OverviewTabProps) {
  return (
    <>
      {/* ── Row 1: Top Recommendations + Top Issues ── */}
      <section className="mt-2 grid items-stretch gap-3 lg:grid-cols-2">

        {/* Top Recommendations card */}
        <div className="flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Top Recommendations</p>
          {loading && (
            <div className="mt-2 space-y-2">
              <Skeleton /><Skeleton /><Skeleton />
            </div>
          )}
          {result && !loading && (
            <div className="mt-2 space-y-1">
              {result.top_recommendations.map((rec, i) => (
                <RecCard key={i} rec={rec} rank={i + 1} />
              ))}
            </div>
          )}
          {!result && !loading && (
            <div className="mt-2 animate-pulse space-y-2">
              <Skeleton /><Skeleton /><Skeleton />
            </div>
          )}
          <button
            className="mt-3 text-sm font-semibold text-orange-600"
            onClick={() => onSetTab("recommendation")}
          >
            See recommendations
          </button>
        </div>

        {/* Top Issues card */}
        <div className="flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Top Issues</p>

          {/* Small issue title chips at the top */}
          {result && !loading && result.top_issues.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.top_issues.slice(0, 3).map((issue) => (
                <span
                  key={issue.title}
                  className="rounded-full border border-orange-100 bg-[#fffaf5] px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                >
                  {issue.title}
                </span>
              ))}
            </div>
          )}

          {loading && (
            <div className="mt-2 space-y-2">
              <Skeleton /><Skeleton /><Skeleton />
            </div>
          )}
          {result && !loading && (
            <div className="mt-2 space-y-1">
              {result.top_issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          )}
          {!result && !loading && (
            <div className="mt-2 animate-pulse space-y-2">
              <Skeleton /><Skeleton /><Skeleton />
            </div>
          )}
          <button
            className="mt-3 text-sm font-semibold text-orange-600"
            onClick={() => onSetTab("issues")}
          >
            Review issues
          </button>
        </div>

        {/* Trust Signal Analysis card */}
        <div className="flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Trust Signal Analysis</p>
            {trustConfidence !== null && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                AI Trust Confidence {trustConfidence}%
              </span>
            )}
          </div>

          {result && !loading && (
            <div className="mt-2 space-y-1.5">
              {trustSignalRows.map((item) => {
                const status = trustStatus(item.score);
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-[10px] text-slate-600"
                  >
                    <span className="w-28 shrink-0 text-slate-600">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <div className="h-1 flex-1 rounded-full bg-orange-50">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.score}%`, background: scoreColor(item.score) }}
                      />
                    </div>
                    <span className="w-6 text-right text-[9px] font-semibold text-slate-600">
                      {item.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!result && !loading && (
            <div className="mt-2 animate-pulse space-y-2">
              <Skeleton h="h-3" w="w-2/3" />
              <Skeleton h="h-3" w="w-3/4" />
              <Skeleton h="h-3" w="w-1/2" />
            </div>
          )}
        </div>

        {/* AI Understanding Snapshot card */}
        <div className="flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-sm font-semibold text-slate-700">AI Understanding Snapshot</p>

          {loading && (
            <div className="mt-2 space-y-2">
              <Skeleton h="h-20" />
              <Skeleton h="h-10" />
            </div>
          )}

          {result && !loading && (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-orange-50 p-3 text-[12px] leading-5 text-slate-700">
                {aiSnapshotShort}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Strengths
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.perceived_strengths.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Weaknesses
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.perceived_weaknesses.map((w, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="mt-2 animate-pulse space-y-2">
              <Skeleton h="h-20" />
              <Skeleton h="h-10" />
            </div>
          )}

          <button
            className="mt-3 text-sm font-semibold text-orange-600"
            onClick={() => onSetTab("aiview")}
          >
            Compare perception
          </button>
        </div>
      </section>

      {/* ── Fix Playbook preview ── */}
      <section className="mt-3 rounded-3xl border border-orange-100 bg-white p-3 transition hover:shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">See how to fix it</p>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
            Action playbook
          </span>
        </div>

        {loading && (
          <div className="mt-2 space-y-2">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        )}

        {result && !loading && (
          <div>
            {/* Show first 4 steps in a 2-column grid */}
            <ol className="mt-2 grid gap-2 lg:grid-cols-2">
              {result.fix_playbook.slice(0, 4).map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-2xl border border-orange-100 bg-[#fffaf5] p-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[10px] leading-4 text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
            {result.fix_playbook.length > 4 && (
              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                +{result.fix_playbook.length - 4} more steps in Action Plan
              </p>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="mt-2 animate-pulse space-y-2">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        )}

        <button
          className="mt-3 text-sm font-semibold text-orange-600"
          onClick={() => onSetTab("recommendation")}
        >
          Open playbook
        </button>
      </section>
    </>
  );
}