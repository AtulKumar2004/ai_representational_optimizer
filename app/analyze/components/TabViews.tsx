// app/analyze/components/TabViews.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Four simple tab-content components that don't warrant their own file:
//   - IssuesTab          → "Issues" tab
//   - ActionPlanTab      → "Action Plan" tab
//   - AIViewTab          → "AI View" tab
//   - GapAnalysisTab     → "Gap Analysis" tab
//
// Each handles three states: loading (skeleton), result, and empty.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../../api/analyze/route";
import { SCORE_LABELS } from "../utils";
import { Skeleton, IssueCard, RecCard, ScoreRing } from "./ui";
import type { Tab } from "../types";

// ─── Shared empty-state message ───────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return <p className="mt-6 text-sm text-slate-400">{message}</p>;
}

// ─── IssuesTab ────────────────────────────────────────────────────────────────

interface IssuesTabProps {
  result: AnalysisResult | null;
  loading: boolean;
}

export function IssuesTab({ result, loading }: IssuesTabProps) {
  return (
    <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">All Issues</p>
        {result && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {result.top_issues.length} total
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
      )}

      {result && !loading && (
        <>
          {/* Issue cards in a 2-column grid */}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {result.top_issues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
          </div>

          {/* Score breakdown rings below the issue list */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Score breakdown detail
            </p>
            <div className="mt-4 flex flex-wrap gap-6">
              {Object.entries(result.score_breakdown).map(([key, val]) => (
                <ScoreRing key={key} score={val} label={SCORE_LABELS[key]} />
              ))}
            </div>
          </div>
        </>
      )}

      {!result && !loading && <EmptyState message="Run an analysis to see issues." />}
    </section>
  );
}

// ─── ActionPlanTab ────────────────────────────────────────────────────────────

interface ActionPlanTabProps {
  result: AnalysisResult | null;
  loading: boolean;
}

export function ActionPlanTab({ result, loading }: ActionPlanTabProps) {
  return (
    <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">Ranked Action Plan</p>

      {loading && (
        <div className="mt-4 space-y-3">
          <Skeleton /><Skeleton /><Skeleton />
        </div>
      )}

      {result && !loading && (
        <div className="mt-4 space-y-3">
          {result.ranked_action_plan.map((rec, i) => (
            <RecCard key={i} rec={rec} rank={i + 1} />
          ))}

          {/* AI-optimised rewrite (optional) */}
          {result.rewritten_description && (
            <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <span>✨</span>
                <p className="text-[11px] font-bold text-orange-700">AI-Optimised Rewrite</p>
              </div>
              <p className="text-[11px] leading-6 text-slate-700">
                {result.rewritten_description}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(result.rewritten_description!)}
                className="mt-2 rounded-lg border border-orange-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-orange-700 hover:bg-orange-50"
              >
                📋 Copy rewrite
              </button>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState message="Run an analysis to see recommendations." />
      )}
    </section>
  );
}

// ─── AIViewTab ────────────────────────────────────────────────────────────────

interface AIViewTabProps {
  result: AnalysisResult | null;
  loading: boolean;
}

export function AIViewTab({ result, loading }: AIViewTabProps) {
  return (
    <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">
        How AI Agents Perceive This Store
      </p>

      {loading && (
        <div className="mt-4 space-y-3">
          <Skeleton h="h-32" /><Skeleton /><Skeleton />
        </div>
      )}

      {result && !loading && (
        <>
          {/* AI snapshot paragraph */}
          <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-slate-700">
            {result.ai_snapshot}
          </div>

          {/* Strengths + Weaknesses side by side */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                Perceived Strengths
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500">
                Perceived Weaknesses
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
        </>
      )}

      {!result && !loading && <EmptyState message="Run an analysis to see AI perception." />}
    </section>
  );
}

// ─── GapAnalysisTab ───────────────────────────────────────────────────────────

interface GapAnalysisTabProps {
  result: AnalysisResult | null;
  loading: boolean;
}

export function GapAnalysisTab({ result, loading }: GapAnalysisTabProps) {
  return (
    <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">
        AI Perception vs. Merchant Intent
      </p>

      {loading && (
        <div className="mt-4 space-y-3">
          <Skeleton /><Skeleton h="h-32" />
        </div>
      )}

      {result && !loading && (
        <>
          {/* Summary row: what AI sees vs what merchant wants */}
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

          {/* Per-dimension gap list */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Gap Analysis
          </p>
          <div className="mt-3 space-y-3">
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
        </>
      )}

      {!result && !loading && (
        <EmptyState message="Run an analysis to see the comparison." />
      )}
    </section>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
// The row of tab buttons shown above the tab content.

interface TabBarProps {
  tabs: { id: Tab; label: string }[];
  activeTab: Tab;
  isDark: boolean;
  onSetTab: (tab: Tab) => void;
}

export function TabBar({ tabs, activeTab, isDark, onSetTab }: TabBarProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-b border-orange-100 pb-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onSetTab(t.id)}
          className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === t.id
              ? "border border-b-0 border-orange-100 bg-white text-orange-700"
              : isDark
              ? "text-slate-200 hover:text-orange-200"
              : "text-slate-500 hover:text-orange-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}