"use client";

import { useState } from "react";
import type { AnalysisResult, Issue, Recommendation } from "../api/analyze/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<string, string> = {
  product_clarity: "Product clarity",
  faq_coverage: "FAQ coverage",
  trust_signals: "Trust signals",
  policy_completeness: "Policy completeness",
  structured_data: "Structured data",
};

function scoreColor(v: number) {
  if (v >= 75) return "#10b981"; // emerald
  if (v >= 50) return "#f97316"; // orange
  return "#ef4444"; // red
}

function severityClass(s: Issue["severity"]) {
  return s === "High"
    ? "bg-red-50 text-red-700 border-red-200"
    : s === "Med"
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function priorityDot(p: Recommendation["priority"]) {
  return p === "High" ? "bg-red-400" : p === "Medium" ? "bg-orange-400" : "bg-emerald-400";
}

function effortBadge(e: Recommendation["effort"]) {
  return e === "Low"
    ? "bg-emerald-100 text-emerald-700"
    : e === "Medium"
    ? "bg-orange-100 text-orange-700"
    : "bg-red-100 text-red-700";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "border-emerald-400" : score >= 50 ? "border-orange-400" : "border-red-400";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] ${color}`}
      >
        <span className="text-xl font-semibold text-slate-900">{score}</span>
        <span className="absolute -bottom-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          /100
        </span>
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function Skeleton({ h = "h-10", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} animate-pulse rounded-2xl bg-orange-100`} />;
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${severityClass(issue.severity)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{issue.title}</p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(issue.severity)}`}
        >
          {issue.severity}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-5 opacity-80">{issue.description}</p>
    </div>
  );
}

function RecCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-orange-100 bg-white p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
        {rank}
      </span>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-900">{rec.title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-slate-600">{rec.detail}</p>
        <div className="mt-1.5 flex gap-2">
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(rec.priority)}`} />
            {rec.priority} priority
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${effortBadge(rec.effort)}`}>
            {rec.effort} effort
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "issues" | "recommendation" | "aiview" | "comparison";
type InputMode = "description" | "url";

export default function AnalyzePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [inputMode, setInputMode] = useState<InputMode>("description");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── API call ────────────────────────────────────────────────────────────────
  async function runAnalysis() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, mode: inputMode }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed. Please retry.");
      }

      setResult(data as AnalysisResult);
      setTab("overview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const navItems = ["Analyze Store", "Reports", "Toolkit", "Resources", "Settings"];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside
          className={`hidden flex-col border-r border-orange-100 bg-white/80 px-6 py-6 transition-all duration-300 lg:flex ${
            sidebarOpen ? "w-64" : "w-20 px-3"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-semibold text-orange-700">
                AI
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
                    Kasparro Lab
                  </p>
                  <p className="text-sm font-semibold text-slate-900">Sisyphus</p>
                </div>
              )}
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "<" : ">"}
            </button>
          </div>

          <nav className="mt-10 space-y-2 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <button
                key={item}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-orange-50 ${
                  sidebarOpen ? "" : "justify-center"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-orange-200" />
                {sidebarOpen && item}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className="mt-auto rounded-2xl border border-orange-100 bg-white px-4 py-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Need help?</p>
              <p className="mt-2">Read the docs or book a quick demo.</p>
              <button className="mt-4 w-full rounded-full border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">
                Go to resources
              </button>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 px-6 py-6 lg:px-10">

          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {(["Brief", "History", "Export Report"] as const).map((label) => (
                <button
                  key={label}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {label}
                </button>
              ))}
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => { setResult(null); setError(null); setInput(""); }}
              >
                New Analysis
              </button>
            </div>
          </header>

          {/* Criteria banner */}
          <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  What a strong submission shows
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-600 lg:grid-cols-2">
                  <li>Identifies gaps in AI readiness across content and trust signals.</li>
                  <li>Prioritizes improvements with a ranked action plan.</li>
                  <li>Shows how agents perceive the store vs. desired positioning.</li>
                  <li>Delivers actionable fixes that improve conversion confidence.</li>
                </ul>
              </div>
              <button className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700">
                View criteria
              </button>
            </div>
          </section>

          {/* Input + Score row */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">

            {/* Input card */}
            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center gap-6 text-sm font-semibold text-slate-700">
                <button
                  className={`pb-2 transition ${inputMode === "description" ? "border-b-2 border-orange-500 text-orange-600" : "text-slate-500"}`}
                  onClick={() => setInputMode("description")}
                >
                  Product Description
                </button>
                <button
                  className={`pb-2 transition ${inputMode === "url" ? "border-b-2 border-orange-500 text-orange-600" : "text-slate-500"}`}
                  onClick={() => setInputMode("url")}
                >
                  Store URL
                </button>
              </div>

              {inputMode === "description" ? (
                <>
                  <textarea
                    className="mt-4 w-full resize-none rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
                    rows={5}
                    maxLength={5000}
                    placeholder="Paste your product description here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <div className="mt-1 text-xs text-slate-400">{input.length}/5000 characters</div>
                </>
              ) : (
                <input
                  type="url"
                  className="mt-4 w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
                  placeholder="https://yourstore.myshopify.com"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              )}

              {error && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <button className="text-xs font-semibold text-orange-600">Upload data</button>
                <button
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={runAnalysis}
                  disabled={loading || !input.trim()}
                >
                  {loading ? "Analyzing…" : "Analyze with AI"}
                </button>
              </div>
            </div>

            {/* Score card */}
            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    AI Readiness Score
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Current readiness</p>
                </div>
                {result && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.overall_label === "Excellent"
                      ? "bg-emerald-100 text-emerald-700"
                      : result.overall_label === "Good"
                      ? "bg-emerald-100 text-emerald-700"
                      : result.overall_label === "Fair"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {result.overall_label}
                  </span>
                )}
              </div>

              {loading && (
                <div className="mt-6 space-y-3">
                  <Skeleton h="h-20" w="w-20" />
                  <Skeleton h="h-4" w="w-3/4" />
                  <Skeleton h="h-4" w="w-1/2" />
                </div>
              )}

              {result && !loading && (
                <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div
                    className={`relative flex h-24 w-24 items-center justify-center rounded-full border-[6px] ${
                      result.overall_score >= 75
                        ? "border-emerald-400"
                        : result.overall_score >= 50
                        ? "border-orange-400"
                        : "border-red-400"
                    }`}
                  >
                    <span className="text-2xl font-semibold text-slate-900">
                      {result.overall_score}
                    </span>
                    <span className="absolute -bottom-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      /100
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {result.ai_snapshot}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {result.potential_lift} potential lift
                      </span>
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        {result.all_issues.length} issues flagged
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!result && !loading && (
                <div className="mt-6 flex h-24 items-center justify-center rounded-2xl border border-dashed border-orange-200">
                  <p className="text-sm text-slate-400">Run analysis to see your score</p>
                </div>
              )}

              {result && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Trust signals analysis complete
                  </div>
                  <button
                    className="text-sm font-semibold text-orange-600"
                    onClick={() => setTab("overview")}
                  >
                    Open score details
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Tab navigation */}
          <section className="mt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              {(["overview", "issues", "recommendation", "aiview", "comparison"] as Tab[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-4 py-2 capitalize transition ${
                      tab === t
                        ? "bg-orange-100 text-orange-700"
                        : "text-slate-500 hover:text-orange-600"
                    }`}
                  >
                    {t === "aiview"
                      ? "AI View"
                      : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                )
              )}
            </div>
          </section>

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <>
              <section className="mt-8 grid gap-6 lg:grid-cols-3">

                {/* Score Breakdown */}
                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>
                    <span className="text-xs font-semibold text-slate-400">API</span>
                  </div>
                  {loading && (
                    <div className="mt-4 space-y-3">
                      {[..."xxxx"].map((_, i) => <Skeleton key={i} h="h-3" w={["w-28","w-44","w-36","w-40"][i]} />)}
                    </div>
                  )}
                  {result && !loading && (
                    <div className="mt-4 space-y-3">
                      {Object.entries(result.score_breakdown).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-[11px] text-slate-500">
                            {SCORE_LABELS[key]}
                          </span>
                          <div className="flex-1 rounded-full bg-orange-50" style={{ height: 7 }}>
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
                  {!result && !loading && (
                    <div className="mt-4 space-y-3 animate-pulse">
                      {["w-28","w-44","w-36","w-40"].map((w, i) => (
                        <div key={i} className={`h-3 ${w} rounded-full bg-orange-100`} />
                      ))}
                    </div>
                  )}
                  <button
                    className="mt-5 text-sm font-semibold text-orange-600"
                    onClick={() => setTab("issues")}
                  >
                    View breakdown
                  </button>
                </div>

                {/* Top Issues */}
                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Top Issues</p>
                    <span className="text-xs font-semibold text-slate-400">API</span>
                  </div>
                  {loading && (
                    <div className="mt-4 space-y-3">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  {result && !loading && (
                    <div className="mt-4 space-y-2">
                      {result.top_issues.map((issue, i) => (
                        <IssueCard key={i} issue={issue} />
                      ))}
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-4 space-y-3 animate-pulse">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  <button
                    className="mt-5 text-sm font-semibold text-orange-600"
                    onClick={() => setTab("issues")}
                  >
                    Review issues
                  </button>
                </div>

                {/* Top Recommendations */}
                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Top Recommendations</p>
                    <span className="text-xs font-semibold text-slate-400">API</span>
                  </div>
                  {loading && (
                    <div className="mt-4 space-y-3">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  {result && !loading && (
                    <div className="mt-4 space-y-2">
                      {result.top_recommendations.map((rec, i) => (
                        <RecCard key={i} rec={rec} rank={i + 1} />
                      ))}
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-4 space-y-3 animate-pulse">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  <button
                    className="mt-5 text-sm font-semibold text-orange-600"
                    onClick={() => setTab("recommendation")}
                  >
                    See recommendations
                  </button>
                </div>
              </section>

              <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

                {/* AI Understanding Snapshot */}
                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">AI Understanding Snapshot</p>
                    <span className="text-xs font-semibold text-slate-400">API</span>
                  </div>
                  {loading && (
                    <div className="mt-4 space-y-3">
                      <Skeleton h="h-20" /><Skeleton h="h-10" />
                    </div>
                  )}
                  {result && !loading && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-slate-700">
                        {result.ai_perception_full}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Strengths</p>
                          <ul className="mt-1 space-y-1">
                            {result.perceived_strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Weaknesses</p>
                          <ul className="mt-1 space-y-1">
                            {result.perceived_weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-4 space-y-3 animate-pulse">
                      <Skeleton h="h-20" /><Skeleton h="h-10" />
                    </div>
                  )}
                  <button
                    className="mt-5 text-sm font-semibold text-orange-600"
                    onClick={() => setTab("aiview")}
                  >
                    Compare perception
                  </button>
                </div>

                {/* Fix Playbook */}
                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">See how to fix it</p>
                    <span className="text-xs font-semibold text-slate-400">API</span>
                  </div>
                  {loading && (
                    <div className="mt-4 space-y-3">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  {result && !loading && (
                    <ol className="mt-4 space-y-2">
                      {result.fix_playbook.map((step, i) => (
                        <li key={i} className="flex gap-3 rounded-2xl border border-orange-100 bg-[#fffaf5] p-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="text-[11px] leading-5 text-slate-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {!result && !loading && (
                    <div className="mt-4 space-y-3 animate-pulse">
                      <Skeleton /><Skeleton /><Skeleton />
                    </div>
                  )}
                  <button
                    className="mt-5 text-sm font-semibold text-orange-600"
                    onClick={() => setTab("recommendation")}
                  >
                    Open playbook
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ── Issues tab ── */}
          {tab === "issues" && (
            <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">All Issues</p>
                {result && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    {result.all_issues.length} total
                  </span>
                )}
              </div>
              {loading && <div className="mt-4 space-y-3"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {result.all_issues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                  {/* Score mini-rings */}
                  <div className="mt-8">
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
              {!result && !loading && (
                <p className="mt-6 text-sm text-slate-400">Run an analysis to see issues.</p>
              )}
            </section>
          )}

          {/* ── Recommendations tab ── */}
          {tab === "recommendation" && (
            <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">Ranked Action Plan</p>
              {loading && <div className="mt-4 space-y-3"><Skeleton /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <div className="mt-4 space-y-3">
                  {result.ranked_action_plan.map((rec, i) => (
                    <RecCard key={i} rec={rec} rank={i + 1} />
                  ))}
                </div>
              )}
              {!result && !loading && (
                <p className="mt-6 text-sm text-slate-400">Run an analysis to see recommendations.</p>
              )}
            </section>
          )}

          {/* ── AI View tab ── */}
          {tab === "aiview" && (
            <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">How AI Agents Perceive This Store</p>
              {loading && <div className="mt-4 space-y-3"><Skeleton h="h-32" /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <>
                  <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-slate-700">
                    {result.ai_perception_full}
                  </div>
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Perceived Strengths</p>
                      <ul className="mt-3 space-y-2">
                        {result.perceived_strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Perceived Weaknesses</p>
                      <ul className="mt-3 space-y-2">
                        {result.perceived_weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
              {!result && !loading && (
                <p className="mt-6 text-sm text-slate-400">Run an analysis to see AI perception.</p>
              )}
            </section>
          )}

          {/* ── Comparison tab ── */}
          {tab === "comparison" && (
            <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">AI Perception vs. Merchant Intent</p>
              {loading && <div className="mt-4 space-y-3"><Skeleton /><Skeleton h="h-32" /></div>}
              {result && !loading && (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-orange-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">AI currently perceives</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{result.comparison.ai_perceives}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Merchant wants to be seen as</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{result.comparison.merchant_intent}</p>
                    </div>
                  </div>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">Gap Analysis</p>
                  <div className="mt-3 space-y-3">
                    {result.comparison.gaps.map((gap, i) => (
                      <div key={i} className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
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
                <p className="mt-6 text-sm text-slate-400">Run an analysis to see the comparison.</p>
              )}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}