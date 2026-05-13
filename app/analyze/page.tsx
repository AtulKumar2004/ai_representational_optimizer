//app/analyze/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { BarChart3, BookOpen, CircleHelp, Code2, FileCheck2, FileText, Link2, Search, Settings, ShieldCheck, Sparkles, TrendingUp, Wrench } from "lucide-react";
import type { AnalysisResult, Issue, Recommendation } from "../api/analyze/route";
import { downloadPdf } from "./pdfReport";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  input: string;
  mode: "url" | "description" | "file" | "mixed";
  result: AnalysisResult;
  timestamp: Date;
  description?: string;
  url?: string;
  fileName?: string;
  consistency?: AnalysisResult["input_consistency"];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<string, string> = {
  product_clarity: "Product clarity",
  faq_coverage: "FAQ coverage",
  trust_signals: "Trust signals",
  policy_completeness: "Policy completeness",
  structured_data: "Structured data",
};

function scoreColor(v: number) {
  if (v >= 75) return "#10b981";
  if (v >= 50) return "#f97316";
  return "#ef4444";
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

function statusChipClass(v: number) {
  return v >= 70
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : v >= 50
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function trustStatus(score: number) {
  if (score >= 80) return { label: "Strong", className: "bg-emerald-100 text-emerald-700" };
  if (score >= 60) return { label: "Partial", className: "bg-orange-100 text-orange-700" };
  if (score >= 40) return { label: "Weak", className: "bg-red-100 text-red-700" };
  return { label: "Missing", className: "bg-red-200 text-red-800" };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "border-emerald-400" : score >= 50 ? "border-orange-400" : "border-red-400";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] ${color}`}>
        <span className="text-xl font-semibold text-slate-900">{score}</span>
        <span className="absolute -bottom-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">/100</span>
      </div>
      <p className="text-xs font-medium text-slate-500 text-center">{label}</p>
    </div>
  );
}

function Skeleton({ h = "h-10", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} animate-pulse rounded-2xl bg-orange-100`} />;
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div className={`rounded-2xl border p-3 ${severityClass(issue.severity)}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{issue.title}</p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(issue.severity)}`}>
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

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onSelect,
  onClose,
}: {
  history: HistoryEntry[];
  onSelect: (e: HistoryEntry) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-orange-100 bg-white p-8 shadow-xl">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Close
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Analysis History</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Past Analyses</h2>

        {history.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-orange-200 p-8 text-center">
            <p className="text-sm text-slate-500">No analyses run yet.</p>
            <p className="mt-1 text-xs text-slate-400">Run your first analysis to see history here.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {history.slice().reverse().map((entry) => (
              <button
                key={entry.id}
                onClick={() => { onSelect(entry); onClose(); }}
                className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {(entry.url || entry.fileName) && (
                        <span className="mr-1 inline-flex translate-y-0.5">
                          {entry.url ? <Link2 className="h-3.5 w-3.5 text-slate-500" /> : <FileText className="h-3.5 w-3.5 text-slate-500" />}
                        </span>
                      )}
                      {entry.input.slice(0, 60)}{entry.input.length > 60 ? "…" : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(entry.timestamp)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      entry.result.overall_score >= 75 ? "bg-emerald-100 text-emerald-700" :
                      entry.result.overall_score >= 50 ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {entry.result.overall_score}/100
                    </span>
                    <span className="text-[10px] text-slate-400">{entry.result.overall_label}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Export Report Modal ──────────────────────────────────────────────────────

function ExportModal({
  result,
  context,
  onClose,
}: {
  result: AnalysisResult | null;
  context: string;
  onClose: () => void;
}) {
  const [exported, setExported] = useState(false);

  function buildMarkdown() {
    if (!result) return "";
    const now = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
    return `# AI Readiness Report
Generated: ${now}
  Input: ${context.slice(0, 200)}${context.length > 200 ? "…" : ""}

---

## Overall Score: ${result.overall_score}/100 — ${result.overall_label}
Potential lift: ${result.potential_lift}

## Score Breakdown
${Object.entries(result.score_breakdown).map(([k, v]) => `- ${SCORE_LABELS[k]}: ${v}/100`).join("\n")}

## AI Snapshot
${result.ai_snapshot}

## AI Full Perception
${result.ai_perception_full}

## Perceived Strengths
${result.perceived_strengths.map((s) => `- ${s}`).join("\n")}

## Perceived Weaknesses
${result.perceived_weaknesses.map((w) => `- ${w}`).join("\n")}

## Top Issues
${result.top_issues.map((i) => `### [${i.severity}] ${i.title}\n${i.description}`).join("\n\n")}

## All Issues
${result.all_issues.map((i) => `### [${i.severity}] ${i.title}\n${i.description}`).join("\n\n")}

## Top Recommendations
${result.top_recommendations.map((r, i) => `### ${i + 1}. ${r.title} [${r.priority} priority, ${r.effort} effort]\n${r.detail}`).join("\n\n")}

## Ranked Action Plan
${result.ranked_action_plan.map((r, i) => `### ${i + 1}. ${r.title} [${r.priority} priority, ${r.effort} effort]\n${r.detail}`).join("\n\n")}

## Fix Playbook
${result.fix_playbook.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Perception vs. Intent Gap Analysis
**AI perceives:** ${result.comparison.ai_perceives}
**Merchant intent:** ${result.comparison.merchant_intent}

${result.comparison.gaps.map((g) => `### ${g.dimension}\n- AI sees: ${g.ai_perceives}\n- You want: ${g.merchant_intent}\n- Gap: ${g.gap_explanation}`).join("\n\n")}
`;
  }

  function downloadMarkdown() {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-readiness-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  function downloadJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-readiness-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  function copyMarkdown() {
    navigator.clipboard.writeText(buildMarkdown());
    setExported(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-8 shadow-xl">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Close
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Export</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Export Report</h2>

        {!result ? (
          <div className="mt-6 rounded-2xl border border-dashed border-orange-200 p-8 text-center">
            <p className="text-sm text-slate-500">No analysis to export yet.</p>
            <p className="mt-1 text-xs text-slate-400">Run an analysis first.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-semibold text-slate-700">Report includes</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• Overall score & label ({result.overall_score}/100 — {result.overall_label})</li>
                <li>• Full score breakdown across 5 dimensions</li>
                <li>• {result.all_issues.length} identified issues</li>
                <li>• {result.ranked_action_plan.length}-step ranked action plan</li>
                <li>• AI perception analysis + gap report</li>
                <li>• Fix playbook ({result.fix_playbook.length} steps)</li>
              </ul>
            </div>

            {exported && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
                ✓ Exported successfully
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={downloadMarkdown}
                className="flex flex-col items-center gap-2 rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="text-2xl">📄</span>
                <p className="text-xs font-semibold text-slate-900">Markdown</p>
                <p className="text-[10px] text-slate-500">Download .md</p>
              </button>
              <button
                onClick={() => { downloadPdf(result, context); setExported(true); }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-left transition hover:border-orange-400 hover:bg-orange-100"
              >
                <span className="text-2xl">🖨️</span>
                <p className="text-xs font-semibold text-orange-700">PDF Report</p>
                <p className="text-[10px] text-orange-500">Print / Save as PDF</p>
              </button>
              <button
                onClick={downloadJSON}
                className="flex flex-col items-center gap-2 rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="text-2xl">⚙️</span>
                <p className="text-xs font-semibold text-slate-900">JSON</p>
                <p className="text-[10px] text-slate-500">Download .json</p>
              </button>
              <button
                onClick={copyMarkdown}
                className="flex flex-col items-center gap-2 rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="text-2xl">📋</span>
                <p className="text-xs font-semibold text-slate-900">Copy</p>
                <p className="text-[10px] text-slate-500">Copy to clipboard</p>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Panels ───────────────────────────────────────────────────────────

function ReportsPanel({ history, onSelect, isDark }: { history: HistoryEntry[]; onSelect: (e: HistoryEntry) => void; isDark: boolean }) {
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Reports</p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Saved Reports</p>
      {history.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-orange-200 p-6 text-center">
          <p className={`text-sm ${isDark ? "text-slate-100" : "text-slate-700"}`}>No reports yet</p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Analyses are saved automatically.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {history.slice().reverse().map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              className="w-full rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-orange-300"
            >
              <div className="flex justify-between gap-2">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {entry.input.slice(0, 40)}{entry.input.length > 40 ? "…" : ""}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  entry.result.overall_score >= 75 ? "bg-emerald-100 text-emerald-700" :
                  entry.result.overall_score >= 50 ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                }`}>{entry.result.overall_score}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">{formatDate(entry.timestamp)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import ToolkitFeatures from "./toolkit";

function ToolkitPanel({ isDark }: { isDark: boolean }) {
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        Toolkit
      </p>

      <p
        className={`mt-1 text-lg font-bold ${
          isDark ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Optimization Tools
      </p>

      <p
        className={`mt-2 text-sm ${
          isDark ? "text-slate-300" : "text-slate-700"
        }`}
      >
        AI optimization utilities for merchant readiness.
      </p>

      <ToolkitFeatures isDark={isDark} />
    </div>
  );
}

function ResourcesPanel({ isDark }: { isDark: boolean }) {
  const resources = [
    {
      category: "Guides",
      items: [
        { title: "How AI Shopping Agents Work", url: "https://openai.com/blog", desc: "Understand the systems evaluating your store" },
        { title: "Structured Data for E-commerce", url: "https://schema.org/Product", desc: "Official schema.org product markup reference" },
        { title: "Shopify SEO & AI Guide", url: "https://shopify.com/blog/topics/seo", desc: "Optimize your Shopify store for AI visibility" },
      ],
    },
    {
      category: "Tools",
      items: [
        { title: "Google Rich Results Test", url: "https://search.google.com/test/rich-results", desc: "Test your structured data markup" },
        { title: "Perplexity AI", url: "https://perplexity.ai", desc: "See how Perplexity represents your store" },
        { title: "Schema Markup Validator", url: "https://validator.schema.org", desc: "Validate your product schema" },
      ],
    },
    {
      category: "Reading",
      items: [
        { title: "Kasparro Blog", url: "https://kasparro.com", desc: "Insights on AI commerce and merchant tools" },
        { title: "AI Commerce Report 2024", url: "https://kasparro.com", desc: "How AI is reshaping online shopping" },
      ],
    },
  ];

  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Resources</p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Learning Center</p>
      <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>Guides, tools, and reading to improve your AI readiness.</p>
      <div className="mt-6 space-y-6">
        {resources.map((group) => (
          <div key={group.category}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-600"}`}>{group.category}</p>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white p-3 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <span className="mt-0.5 text-base"><Link2 className="h-4 w-4 text-slate-600" /></span>
                  <div>
                    <p className="text-xs font-semibold text-orange-700">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  theme: string;
  setTheme: (v: string) => void;
  onClearHistory: () => void;
  isDark: boolean;
}

function SettingsPanel({ apiKey, setApiKey, model, setModel, theme, setTheme, onClearHistory, isDark }: SettingsPanelProps) {
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  function handleSave() {
    localStorage.setItem("sisyphus_api_key", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClearHistory() {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
      return;
    }
    onClearHistory();
    setClearConfirm(false);
  }

  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Settings</p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Preferences</p>

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">API Configuration</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500">Groq API Key</label>
              <input
                type="password"
                placeholder="gsk_••••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 w-full rounded-xl border border-orange-100 bg-[#fffaf5] px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                {apiKey ? "✓ Custom key set — will be used for analysis." : "Leave blank to use the server's default key."}
              </p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-orange-100 bg-[#fffaf5] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-300"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-400">Selected model will be used for the next analysis.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Appearance</p>
          <div className="mt-3">
            <label className="text-[11px] font-medium text-slate-500">Theme</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["light", "dark", "system"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                    theme === t ? "border-orange-400 bg-orange-50 text-orange-700" : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {theme === "system" ? "Follows your OS preference." : theme === "dark" ? "Dark mode active." : "Light mode active."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Notifications</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-700">Analysis complete alerts</p>
              <p className="text-[10px] text-slate-400">Get notified when long analyses finish</p>
            </div>
            <button
              onClick={() => setNotifications((p) => !p)}
              className={`relative h-5 w-10 rounded-full transition ${notifications ? "bg-orange-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${notifications ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Data & Privacy</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Analysis history is stored locally in your browser. No data is sent to external servers beyond the AI API call.
          </p>
          <button
            onClick={handleClearHistory}
            className={`mt-3 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              clearConfirm
                ? "border-red-500 bg-red-500 text-white"
                : "border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            {clearConfirm ? "Tap again to confirm" : "Clear all history"}
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`w-full rounded-full py-2.5 text-sm font-semibold transition ${
            saved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
        >
          {saved ? "✓ Saved to browser" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

// ─── Report Section (Full Report View) ───────────────────────────────────────

function FullReportSection({ result, context }: { result: AnalysisResult; context: string }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">Full Report</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">AI Readiness Analysis</h2>
            <p className="mt-1 text-sm text-slate-500 break-all">{context.slice(0, 120)}{context.length > 120 ? "…" : ""}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
              result.overall_score >= 75 ? "bg-emerald-100 text-emerald-800" :
              result.overall_score >= 50 ? "bg-orange-100 text-orange-800" :
              "bg-red-100 text-red-800"
            }`}>
              {result.overall_score}/100 — {result.overall_label}
            </div>
            <p className="mt-1 text-xs text-slate-500">Potential lift: <span className="font-semibold text-emerald-600">{result.potential_lift}</span></p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>
        <div className="mt-6 flex flex-wrap justify-around gap-6">
          {Object.entries(result.score_breakdown).map(([key, val]) => (
            <ScoreRing key={key} score={val} label={SCORE_LABELS[key]} />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Object.entries(result.score_breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-[11px] text-slate-500">{SCORE_LABELS[key]}</span>
              <div className="flex-1 rounded-full bg-orange-50" style={{ height: 8 }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: scoreColor(val) }} />
              </div>
              <span className="w-7 text-right text-[11px] font-semibold text-slate-700">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Perception */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">AI Perception Analysis</p>
        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-slate-700">{result.ai_perception_full}</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Strengths</p>
            <ul className="mt-3 space-y-2">
              {result.perceived_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Weaknesses</p>
            <ul className="mt-3 space-y-2">
              {result.perceived_weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />{w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* All Issues */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">All Issues ({result.all_issues.length})</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.all_issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
        </div>
      </div>

      {/* Full Action Plan */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Complete Action Plan</p>
        <div className="mt-4 space-y-3">
          {result.ranked_action_plan.map((rec, i) => <RecCard key={i} rec={rec} rank={i + 1} />)}
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Perception vs. Intent Gap Analysis</p>
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
        <div className="mt-4 space-y-3">
          {result.comparison.gaps.map((gap, i) => (
            <div key={i} className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
              <p className="text-xs font-semibold text-orange-700">{gap.dimension}</p>
              <div className="mt-2 grid gap-2 text-[11px] lg:grid-cols-3">
                <div><span className="font-semibold text-slate-500">AI sees: </span><span className="text-slate-700">{gap.ai_perceives}</span></div>
                <div><span className="font-semibold text-slate-500">You want: </span><span className="text-slate-700">{gap.merchant_intent}</span></div>
                <div><span className="font-semibold text-slate-500">Gap: </span><span className="text-slate-700">{gap.gap_explanation}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fix Playbook */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Complete Fix Playbook</p>
        <ol className="mt-4 space-y-2">
          {result.fix_playbook.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-orange-100 bg-[#fffaf5] p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">{i + 1}</span>
              <span className="text-[11px] leading-5 text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Rewritten Description (description mode only) */}
      {result.rewritten_description && (
        <div className="rounded-3xl border-2 border-orange-300 bg-white p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✨</span>
            <p className="text-sm font-bold text-orange-700">AI-Optimised Rewrite</p>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
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

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "issues" | "recommendation" | "aiview" | "comparison" | "report";
type InputMode = "description" | "url" | "file" | "mixed";
type SidebarSection = "analyze" | "reports" | "toolkit" | "resources" | "settings";

export default function AnalyzePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("analyze");
  const [tab, setTab] = useState<Tab>("overview");
  const [input, setInput] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [analysisContext, setAnalysisContext] = useState("");
  const [showDescription, setShowDescription] = useState(true);
  const [showUrl, setShowUrl] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // ── Settings state (persisted) ──────────────────────────────────────────────
  const [apiKey, setApiKeyState] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sisyphus_api_key") ?? "" : ""
  );
  const [model, setModelState] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sisyphus_model") ?? "llama-3.3-70b-versatile" : "llama-3.3-70b-versatile"
  );
  const [theme, setThemeState] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sisyphus_theme") ?? "light" : "light"
  );

  // Apply theme to <html>
  const setTheme = (t: string) => {
    setThemeState(t);
    localStorage.setItem("sisyphus_theme", t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
  };

  const setApiKey = (v: string) => {
    setApiKeyState(v);
  };

  const setModel = (v: string) => {
    setModelState(v);
    localStorage.setItem("sisyphus_model", v);
  };

  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  // ── API call ────────────────────────────────────────────────────────────────
  function buildAnalysisLabel(description: string, url: string, fileName?: string) {
    const parts: string[] = [];
    if (description) {
      const snippet = description.length > 160 ? `${description.slice(0, 160)}…` : description;
      parts.push(`Description: ${snippet}`);
    }
    if (url) parts.push(`URL: ${url}`);
    if (fileName) parts.push(`File: ${fileName}`);
    return parts.join("\n");
  }

  async function runAnalysis() {
    const description = input.trim();
    const url = inputUrl.trim();
    const file = uploadFile;
    const hasDescription = description.length > 0;
    const hasUrl = url.length > 0;
    const hasFile = !!file;
    if (!hasDescription && !hasUrl && !hasFile) {
      setError("Please provide a description, URL, or file to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    setFileError(null);
    setResult(null);

    try {
      let fileText = "";
      if (hasFile && file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (imageExtensions.includes(ext)) {
          fileText = await extractImageText(file);
          if (!fileText.trim()) {
            throw new Error("No readable text found in this image.");
          }
        } else {
          const form = new FormData();
          form.append("file", file);
          form.append("model", model);
          form.append("returnText", "1");
          if (apiKey) form.append("apiKey", apiKey);
          const extractRes = await fetch("/api/analyze-file", {
            method: "POST",
            body: form,
          });
          const extractData = await extractRes.json();
          if (!extractRes.ok || extractData.error) {
            throw new Error(extractData.error || "Failed to read the uploaded file.");
          }
          fileText = (extractData.text ?? "").toString();
        }
      }

      const combinedParts: string[] = [];
      if (hasDescription) combinedParts.push(`Product description:\n${description}`);
      if (hasUrl) combinedParts.push(`Store URL:\n${url}`);
      if (fileText) combinedParts.push(`File content${file ? ` (${file.name})` : ""}:\n${fileText}`);
      const combinedInput = combinedParts.join("\n\n");
      const requestMode: InputMode = hasDescription || fileText ? "description" : "url";

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: requestMode === "url" ? url : combinedInput,
          mode: requestMode,
          model,
          ...(apiKey ? { apiKey } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed. Please retry.");
      const newResult = data as AnalysisResult;
      setResult(newResult);
      setTab("overview");
      const label = buildAnalysisLabel(description, url, file?.name);
      const historyLabel = label.split("\n")[0] || "Analysis";
      setAnalysisContext(label);
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        input: historyLabel,
        mode: hasDescription && hasUrl && hasFile ? "mixed" : hasFile ? "file" : hasDescription ? "description" : "url",
        result: newResult,
        timestamp: new Date(),
        description: description || undefined,
        url: url || undefined,
        fileName: file?.name,
        consistency: newResult.input_consistency,
      };
      setHistory((prev) => [...prev, entry]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function loadHistoryEntry(entry: HistoryEntry) {
    setInput(entry.description ?? "");
    setInputUrl(entry.url ?? "");
    setUploadFile(null);
    setAnalysisContext(entry.input);
    setResult(entry.result);
    if (entry.consistency && entry.result) {
      entry.result.input_consistency = entry.consistency;
    }
    setTab("overview");
    setSidebarSection("analyze");
  }

  function clearHistory() {
    setHistory([]);
    setResult(null);
    setInput("");
    setInputUrl("");
    setUploadFile(null);
    setAnalysisContext("");
    setTab("overview");
  }

  const supportedExtensions = ["pdf", "docx", "txt", "csv", "xlsx", "json", "png", "jpg", "jpeg", "webp"];
  const imageExtensions = ["png", "jpg", "jpeg", "webp"];
  const maxFileSize = 10 * 1024 * 1024;

  async function extractImageText(file: File): Promise<string> {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(file);
      return data.text ?? "";
    } finally {
      await worker.terminate();
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!supportedExtensions.includes(ext)) {
      setFileError("Unsupported file type.");
      setUploadFile(null);
      return;
    }
    if (file.size > maxFileSize) {
      setFileError("File exceeds 10 MB limit.");
      setUploadFile(null);
      return;
    }
    setFileError(null);
    setUploadFile(file);
  }

  // ── Sidebar nav items ───────────────────────────────────────────────────────
  const navItems: { section: SidebarSection; label: string; icon: ReactNode }[] = [
    { section: "analyze", label: "Analyze Store", icon: <Search className="h-4 w-4" /> },
    { section: "reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
    { section: "toolkit", label: "Toolkit", icon: <Wrench className="h-4 w-4" /> },
    { section: "resources", label: "Resources", icon: <BookOpen className="h-4 w-4" /> },
    { section: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  // ── Tabs for main area ──────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "issues", label: "Issues" },
    { id: "recommendation", label: "Action Plan" },
    { id: "aiview", label: "AI View" },
    { id: "comparison", label: "Gap Analysis" },
    { id: "report", label: "Full Report" },
  ];

  const aiConfidence = result ? Math.min(96, Math.max(62, Math.round(result.overall_score * 0.9 + 8))) : null;
  const trustSignals = result
    ? [
        { label: "Reviews", score: result.score_breakdown.trust_signals },
        { label: "FAQ", score: result.score_breakdown.faq_coverage },
        { label: "Warranty", score: result.score_breakdown.policy_completeness },
        { label: "Policies", score: result.score_breakdown.policy_completeness },
        { label: "Structured Data", score: result.score_breakdown.structured_data },
      ]
    : [];
  const trustSignalRows = result
    ? [
        { label: "Reviews", score: result.score_breakdown.trust_signals },
        { label: "Warranty coverage", score: result.score_breakdown.policy_completeness },
        { label: "Return policy clarity", score: result.score_breakdown.policy_completeness },
        { label: "Shipping transparency", score: result.score_breakdown.policy_completeness },
        { label: "FAQ completeness", score: result.score_breakdown.faq_coverage },
        { label: "Structured data presence", score: result.score_breakdown.structured_data },
      ]
    : [];
  const trustConfidence = result
    ? Math.round(
        trustSignalRows.reduce((sum, item) => sum + item.score, 0) / Math.max(1, trustSignalRows.length)
      )
    : null;
  const aiSnapshotShort = result
    ? result.ai_perception_full.length > 200
      ? `${result.ai_perception_full.slice(0, 200)}…`
      : result.ai_perception_full
    : "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-900 text-slate-100" : "bg-[#fbf6f0] text-slate-900"}`}>
      {showHistory && <HistoryPanel history={history} onSelect={loadHistoryEntry} onClose={() => setShowHistory(false)} />}
      {showExport && <ExportModal result={result} context={analysisContext || input || inputUrl} onClose={() => setShowExport(false)} />}

      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`hidden flex-col border-r transition-all duration-300 lg:flex ${sidebarOpen ? "w-64" : "w-16"} ${isDark ? "border-slate-700 bg-slate-800" : "border-orange-100 bg-white/80"}`}>

          {/* Logo */}
          <div className={`flex items-center justify-between gap-3 border-b border-orange-100 px-4 py-5 ${sidebarOpen ? "" : "px-3 justify-center"}`}>
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700">AI</div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-600">Kasparro Lab</p>
                    <p className="text-sm font-bold text-slate-900">Sisyphus</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 text-xs text-orange-700 hover:bg-orange-50"
                >‹</button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700"
              >AI</button>
            )}
          </div>

          {/* Nav */}
          <nav className="mt-4 flex-1 space-y-1 px-2">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => setSidebarSection(item.section)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  sidebarSection === item.section
                    ? isDark
                      ? "bg-slate-700 text-white"
                      : "bg-orange-100 text-orange-700"
                    : isDark
                      ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                      : "text-slate-800 hover:bg-orange-50 hover:text-slate-900"
                } ${sidebarOpen ? "" : "justify-center px-2"}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {sidebarOpen && item.label}
              </button>
            ))}
          </nav>

          {/* Footer help */}
          {sidebarOpen && sidebarSection === "analyze" && (
            <div className="border-t border-orange-100 p-4">
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Need help?</p>
                <p className="mt-2">Read the docs or book a quick demo.</p>
                <button
                  onClick={() => setSidebarSection("resources")}
                  className="mt-3 w-full rounded-full border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                >
                  Go to resources
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-auto px-6 py-4 lg:px-10">

          {/* ── Non-analyze sections ── */}
          {sidebarSection === "reports" && (
            <div className="max-w-3xl mx-auto">
              <ReportsPanel history={history} onSelect={loadHistoryEntry} isDark={isDark} />
            </div>
          )}
          {sidebarSection === "toolkit" && (
            <div className="max-w-3xl mx-auto">
              <ToolkitPanel isDark={isDark} />
            </div>
          )}
          {sidebarSection === "resources" && (
            <div className="max-w-3xl mx-auto">
              <ResourcesPanel isDark={isDark} />
            </div>
          )}
          {sidebarSection === "settings" && (
            <div className="max-w-3xl mx-auto">
              <SettingsPanel
                apiKey={apiKey}
                setApiKey={setApiKey}
                model={model}
                setModel={setModel}
                theme={theme}
                setTheme={setTheme}
                onClearHistory={clearHistory}
                isDark={isDark}
              />
            </div>
          )}

          {/* ── Analyze section ── */}
          {sidebarSection === "analyze" && <>

          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setResult(null); setError(null); setInput(""); setTab("overview"); }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                New Analysis
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:border-orange-200"
              >
                History {history.length > 0 && <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">{history.length}</span>}
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:border-orange-200"
              >
                Export Report
              </button>
              {result && (
                <button
                  onClick={() => setTab("report")}
                  className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                >
                  Full Report
                </button>
              )}
            </div>
          </header>

          {/* Input + Score row */}
          <section className="mt-3 grid items-stretch gap-3 lg:grid-cols-[1.4fr_1fr]">

            {/* Input card */}
            <div className="rounded-3xl border border-orange-100 bg-white p-4 h-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Input Sources</p>
                  <p className="mt-1 text-sm text-slate-600">Add any one, two, or all three inputs to generate a unified report.</p>
                </div>
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">Multi-input enabled</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowDescription((prev) => !prev)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    showDescription ? "border-orange-400 bg-orange-50 text-orange-700" : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  Product Description
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrl((prev) => !prev)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    showUrl ? "border-orange-400 bg-orange-50 text-orange-700" : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  Store URL
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    uploadFile ? "border-orange-400 bg-orange-50 text-orange-700" : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  Upload File
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.csv,.xlsx,.json,.png,.jpg,.jpeg,.webp"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {uploadFile && (
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-orange-100 bg-[#fffaf5] px-3 py-2 text-[11px]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{uploadFile.name}</p>
                    <p className="text-[10px] text-slate-500">{Math.ceil(uploadFile.size / 1024)} KB · OCR for images</p>
                  </div>
                  <button
                    onClick={() => setUploadFile(null)}
                    className="rounded-full border border-orange-200 px-2 py-1 text-[10px] font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className={`mt-3 grid gap-3 ${
                (Number(showDescription) + Number(showUrl)) === 2
                  ? "lg:grid-cols-2"
                  : "lg:grid-cols-1"
              }`}>
                {showDescription && (
                <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4 text-orange-600" />
                    Product Description
                    <span className="ml-auto text-[10px] text-slate-400">Optional</span>
                  </div>
                  <textarea
                    className="mt-3 w-full resize-none rounded-2xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
                    rows={4}
                    maxLength={5000}
                    placeholder="Paste your product description here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <div className="mt-2 text-[10px] text-slate-400">{input.length}/5000 characters</div>
                </div>
                )}

                {showUrl && (
                <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Link2 className="h-4 w-4 text-orange-600" />
                    Store URL
                    <span className="ml-auto text-[10px] text-slate-400">Optional</span>
                  </div>
                  <input
                    type="url"
                    className="mt-3 w-full rounded-2xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
                    placeholder="https://yourstore.myshopify.com"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <p className="mt-2 text-[10px] text-slate-400">Add your store link for live context.</p>
                </div>
                )}

              </div>

              {error && (
                <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
              )}
              {fileError && (
                <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{fileError}</div>
              )}
              {result?.input_consistency?.warning && (
                <div className={`mt-2 rounded-2xl border px-4 py-3 text-xs ${
                  result.input_consistency.consistencyLevel === "LOW"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : result.input_consistency.consistencyLevel === "MEDIUM"
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}>
                  {result.input_consistency.warning}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">Powered by Groq + {model.replace("llama-3.3-70b-versatile","Llama 3.3 70B").replace("llama-3.1-8b-instant","Llama 3.1 8B").replace("mixtral-8x7b-32768","Mixtral 8x7B")}</p>
                <button
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition hover:bg-slate-700"
                  onClick={runAnalysis}
                  disabled={loading || (!input.trim() && !inputUrl.trim() && !uploadFile)}
                >
                  {loading ? "Analyzing…" : "Analyze with AI"}
                </button>
              </div>
            </div>

            {/* Score column */}
            <div className="flex h-full flex-col gap-3">
              <div className="rounded-3xl border border-orange-100 bg-white p-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">AI Readiness Score</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">Current readiness</p>
                  </div>
                  {result && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      result.overall_label === "Excellent" || result.overall_label === "Good"
                        ? "bg-emerald-100 text-emerald-700"
                        : result.overall_label === "Fair"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {result.overall_label}
                    </span>
                  )}
                </div>

                {aiConfidence !== null && (
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">AI Confidence</span>
                    <div className="h-1.5 w-28 rounded-full bg-orange-50">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${aiConfidence}%` }} />
                    </div>
                    <span className="font-semibold text-slate-700">{aiConfidence}%</span>
                  </div>
                )}

                {loading && (
                  <div className="mt-3 space-y-2">
                    <Skeleton h="h-20" w="w-20" />
                    <Skeleton h="h-4" w="w-3/4" />
                    <Skeleton h="h-4" w="w-1/2" />
                  </div>
                )}
                {result && !loading && (
                  <div className="mt-3 flex items-center gap-4">
                    <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[6px] ${
                      result.overall_score >= 75 ? "border-emerald-400" : result.overall_score >= 50 ? "border-orange-400" : "border-red-400"
                    }`}>
                      <span className="text-xl font-bold text-slate-900">{result.overall_score}</span>
                      <span className="absolute -bottom-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">/100</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Potential lift</p>
                      <p className="text-lg font-bold text-emerald-600">{result.potential_lift}</p>
                      <p className="mt-1 text-xs text-slate-400">{result.ai_snapshot}</p>
                    </div>
                  </div>
                )}
                {!result && !loading && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[7px] border-orange-100">
                      <span className="text-2xl font-bold text-orange-200">—</span>
                    </div>
                    <p className="text-sm text-slate-400">Run an analysis to see your AI readiness score.</p>
                  </div>
                )}
              </div>

              {/* Score breakdown */}
              <div className="rounded-3xl border border-orange-100 bg-white p-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Score Breakdown</p>
                </div>
                {trustSignals.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trustSignals.map((item) => (
                      <span key={item.label} className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusChipClass(item.score)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}
                {loading && (
                  <div className="mt-3 space-y-2">
                    {[..."xxxx"].map((_, i) => <Skeleton key={i} h="h-3" w={["w-28","w-44","w-36","w-40"][i]} />)}
                  </div>
                )}
                {result && !loading && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(result.score_breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[11px] text-slate-500">{SCORE_LABELS[key]}</span>
                        <div className="flex-1 rounded-full bg-orange-50" style={{ height: 6 }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: scoreColor(val) }} />
                        </div>
                        <span className="w-7 text-right text-[11px] font-semibold text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!result && !loading && (
                  <div className="mt-3 space-y-3 animate-pulse">
                    {["w-28","w-44","w-36","w-40"].map((w, i) => (
                      <div key={i} className={`h-3 ${w} rounded-full bg-orange-100`} />
                    ))}
                  </div>
                )}
                <button className="mt-4 text-sm font-semibold text-orange-600" onClick={() => setTab("issues")}>
                  View breakdown
                </button>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="mt-3 flex flex-wrap gap-2 border-b border-orange-100 pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? "border border-b-0 border-orange-100 bg-white text-orange-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <>
              <section className="mt-2 grid items-stretch gap-3 lg:grid-cols-2">
                {/* Top Recommendations */}
                <div className="rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Top Recommendations</p>
                  </div>
                  {loading && <div className="mt-2 space-y-2"><Skeleton /><Skeleton /><Skeleton /></div>}
                  {result && !loading && (
                    <div className="mt-2 space-y-1">
                      {result.top_recommendations.map((rec, i) => <RecCard key={i} rec={rec} rank={i + 1} />)}
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-2 space-y-2 animate-pulse"><Skeleton /><Skeleton /><Skeleton /></div>
                  )}
                  <button className="mt-3 text-sm font-semibold text-orange-600" onClick={() => setTab("recommendation")}>
                    See recommendations
                  </button>
                </div>

                {/* Top Issues */}
                <div className="rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Top Issues</p>
                  </div>
                  {result && !loading && result.top_issues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.top_issues.slice(0, 3).map((issue) => (
                        <span key={issue.title} className="rounded-full border border-orange-100 bg-[#fffaf5] px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {issue.title}
                        </span>
                      ))}
                    </div>
                  )}
                  {loading && <div className="mt-2 space-y-2"><Skeleton /><Skeleton /><Skeleton /></div>}
                  {result && !loading && (
                    <div className="mt-2 space-y-1">
                      {result.top_issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-2 space-y-2 animate-pulse"><Skeleton /><Skeleton /><Skeleton /></div>
                  )}
                  <button className="mt-3 text-sm font-semibold text-orange-600" onClick={() => setTab("issues")}>
                    Review issues
                  </button>
                </div>

                {/* Trust Signal Analysis */}
                <div className="rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm h-full flex flex-col">
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
                          <div key={item.label} className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span className="w-28 shrink-0 text-slate-600">{item.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.className}`}>{status.label}</span>
                            <div className="h-1 flex-1 rounded-full bg-orange-50">
                              <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                            </div>
                            <span className="w-6 text-right text-[9px] font-semibold text-slate-600">{item.score}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!result && !loading && (
                    <div className="mt-2 space-y-2 animate-pulse">
                      <Skeleton h="h-3" w="w-2/3" />
                      <Skeleton h="h-3" w="w-3/4" />
                      <Skeleton h="h-3" w="w-1/2" />
                    </div>
                  )}
                </div>

                {/* AI Understanding Snapshot */}
                <div className="rounded-3xl border border-orange-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm h-full flex flex-col">
                  <p className="text-sm font-semibold text-slate-700">AI Understanding Snapshot</p>
                  {loading && <div className="mt-2 space-y-2"><Skeleton h="h-20" /><Skeleton h="h-10" /></div>}
                  {result && !loading && (
                    <div className="mt-2 space-y-3">
                      <div className="rounded-2xl bg-orange-50 p-3 text-[12px] leading-5 text-slate-700">{aiSnapshotShort}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Strengths</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {result.perceived_strengths.map((s, i) => (
                              <span key={i} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Weaknesses</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {result.perceived_weaknesses.map((w, i) => (
                              <span key={i} className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!result && !loading && <div className="mt-2 space-y-2 animate-pulse"><Skeleton h="h-20" /><Skeleton h="h-10" /></div>}
                  <button className="mt-3 text-sm font-semibold text-orange-600" onClick={() => setTab("aiview")}>
                    Compare perception
                  </button>
                </div>
              </section>

              <section className="mt-3 rounded-3xl border border-orange-100 bg-white p-3 transition hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">See how to fix it</p>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Action playbook</span>
                </div>
                {loading && <div className="mt-2 space-y-2"><Skeleton /><Skeleton /><Skeleton /></div>}
                {result && !loading && (
                  <div>
                    <ol className="mt-2 grid gap-2 lg:grid-cols-2">
                      {result.fix_playbook.slice(0, 4).map((step, i) => (
                        <li key={i} className="flex gap-2 rounded-2xl border border-orange-100 bg-[#fffaf5] p-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">{i + 1}</span>
                          <span className="text-[10px] leading-4 text-slate-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {result.fix_playbook.length > 4 && (
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">+{result.fix_playbook.length - 4} more steps in Action Plan</p>
                    )}
                  </div>
                )}
                {!result && !loading && <div className="mt-2 space-y-2 animate-pulse"><Skeleton /><Skeleton /><Skeleton /></div>}
                <button className="mt-3 text-sm font-semibold text-orange-600" onClick={() => setTab("recommendation")}>
                  Open playbook
                </button>
              </section>
            </>
          )}

          {/* ── Issues tab ── */}
          {tab === "issues" && (
            <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">All Issues</p>
                {result && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">{result.all_issues.length} total</span>
                )}
              </div>
              {loading && <div className="mt-4 space-y-3"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {result.all_issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
                  </div>
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Score breakdown detail</p>
                    <div className="mt-4 flex flex-wrap gap-6">
                      {Object.entries(result.score_breakdown).map(([key, val]) => (
                        <ScoreRing key={key} score={val} label={SCORE_LABELS[key]} />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {!result && !loading && <p className="mt-6 text-sm text-slate-400">Run an analysis to see issues.</p>}
            </section>
          )}

          {/* ── Recommendations tab ── */}
          {tab === "recommendation" && (
            <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">Ranked Action Plan</p>
              {loading && <div className="mt-4 space-y-3"><Skeleton /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <div className="mt-4 space-y-3">
                  {result.ranked_action_plan.map((rec, i) => <RecCard key={i} rec={rec} rank={i + 1} />)}
                  {result.rewritten_description && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span>✨</span>
                        <p className="text-[11px] font-bold text-orange-700">AI-Optimised Rewrite</p>
                      </div>
                      <p className="text-[11px] leading-6 text-slate-700">{result.rewritten_description}</p>
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
              {!result && !loading && <p className="mt-6 text-sm text-slate-400">Run an analysis to see recommendations.</p>}
            </section>
          )}

          {/* ── AI View tab ── */}
          {tab === "aiview" && (
            <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">How AI Agents Perceive This Store</p>
              {loading && <div className="mt-4 space-y-3"><Skeleton h="h-32" /><Skeleton /><Skeleton /></div>}
              {result && !loading && (
                <>
                  <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-slate-700">{result.ai_perception_full}</div>
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
              {!result && !loading && <p className="mt-6 text-sm text-slate-400">Run an analysis to see AI perception.</p>}
            </section>
          )}

          {/* ── Comparison tab ── */}
          {tab === "comparison" && (
            <section className="mt-4 rounded-3xl border border-orange-100 bg-white p-5">
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
                          <div><span className="font-semibold text-slate-500">AI sees: </span><span className="text-slate-700">{gap.ai_perceives}</span></div>
                          <div><span className="font-semibold text-slate-500">You want: </span><span className="text-slate-700">{gap.merchant_intent}</span></div>
                          <div><span className="font-semibold text-slate-500">Gap: </span><span className="text-slate-700">{gap.gap_explanation}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!result && !loading && <p className="mt-6 text-sm text-slate-400">Run an analysis to see the comparison.</p>}
            </section>
          )}

          {/* ── Full Report tab ── */}
          {tab === "report" && (
            <div className="mt-4">
              {result ? (
                <FullReportSection result={result} context={analysisContext || input || inputUrl} />
              ) : (
                <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-12 text-center">
                  <p className="text-sm font-semibold text-slate-500">No report yet</p>
                  <p className="mt-2 text-xs text-slate-400">Run an analysis to generate a full report.</p>
                  <button
                    onClick={() => setTab("overview")}
                    className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Go to analyzer
                  </button>
                </div>
              )}
            </div>
          )}

          </>}

        </main>
      </div>
    </div>
  );
}