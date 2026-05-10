"use client";

import { useState } from "react";

export default function AnalyzePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <div className="flex min-h-screen">
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
              onClick={() => setSidebarOpen((prev) => !prev)}
              type="button"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "<" : ">"}
            </button>
          </div>

          <nav className="mt-10 space-y-2 text-sm font-medium text-slate-700">
            {[
              "Analyze Store",
              "Reports",
              "Toolkit",
              "Resources",
              "Settings",
            ].map((item) => (
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

        <main className="flex-1 px-6 py-6 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                Track 5 (Advanced)
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                AI Representation Optimizer
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Build a diagnostic layer that helps Shopify merchants see how AI shopping
                agents perceive their store, where representation breaks down, and what to
                fix first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Brief
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                History
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Export Report
              </button>
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                New Analysis
              </button>
            </div>
          </header>

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

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center gap-6 text-sm font-semibold text-slate-700">
                <button className="border-b-2 border-orange-500 pb-2 text-orange-600">
                  Product Description
                </button>
                <button className="pb-2 text-slate-500">Store URL</button>
              </div>
              <button className="mt-4 w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 text-left text-sm text-slate-500">
                Paste your product description here...
              </button>
              <div className="mt-3 text-xs text-slate-500">0/5000 characters</div>
              <div className="mt-5 flex items-center justify-between">
                <button className="text-xs font-semibold text-orange-600">
                  Upload data
                </button>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Analyze with AI
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    AI Readiness Score
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Current readiness
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Good
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-orange-200 text-2xl font-semibold text-slate-900">
                  72
                  <span className="absolute -bottom-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    /100
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Your store is fairly well understood by AI agents but has gaps in coverage
                  and trust signals.
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      +12% potential lift
                    </span>
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      6 issues flagged
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Trust signals rising
                </div>
                <button className="text-sm font-semibold text-orange-600">
                  Open score details
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              <button className="rounded-full bg-orange-100 px-4 py-2 text-orange-700">
                Overview
              </button>
              <button className="rounded-full px-4 py-2 text-slate-500 hover:text-orange-600">
                Issues
              </button>
              <button className="rounded-full px-4 py-2 text-slate-500 hover:text-orange-600">
                Recommendation
              </button>
              <button className="rounded-full px-4 py-2 text-slate-500 hover:text-orange-600">
                AI View
              </button>
              <button className="rounded-full px-4 py-2 text-slate-500 hover:text-orange-600">
                Comparison
              </button>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>
                <span className="text-xs font-semibold text-slate-400">API</span>
              </div>
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-3 w-28 rounded-full bg-orange-100" />
                <div className="h-3 w-44 rounded-full bg-orange-100" />
                <div className="h-3 w-36 rounded-full bg-orange-100" />
                <div className="h-3 w-40 rounded-full bg-orange-100" />
              </div>
              <button className="mt-5 text-sm font-semibold text-orange-600">
                View breakdown
              </button>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Top Issues</p>
                <span className="text-xs font-semibold text-slate-400">API</span>
              </div>
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-12 rounded-2xl bg-orange-100" />
                <div className="h-12 rounded-2xl bg-orange-100" />
                <div className="h-12 rounded-2xl bg-orange-100" />
              </div>
              <button className="mt-5 text-sm font-semibold text-orange-600">
                Review issues
              </button>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Top Recommendations</p>
                <span className="text-xs font-semibold text-slate-400">API</span>
              </div>
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-12 rounded-2xl bg-orange-100" />
                <div className="h-12 rounded-2xl bg-orange-100" />
                <div className="h-12 rounded-2xl bg-orange-100" />
              </div>
              <button className="mt-5 text-sm font-semibold text-orange-600">
                See recommendations
              </button>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  AI Understanding Snapshot
                </p>
                <span className="text-xs font-semibold text-slate-400">API</span>
              </div>
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-20 rounded-2xl bg-orange-100" />
                <div className="h-10 rounded-2xl bg-orange-100" />
              </div>
              <button className="mt-5 text-sm font-semibold text-orange-600">
                Compare perception
              </button>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">See how to fix it</p>
                <span className="text-xs font-semibold text-slate-400">API</span>
              </div>
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-10 rounded-2xl bg-orange-100" />
                <div className="h-10 rounded-2xl bg-orange-100" />
                <div className="h-10 rounded-2xl bg-orange-100" />
              </div>
              <button className="mt-5 text-sm font-semibold text-orange-600">
                Open playbook
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
