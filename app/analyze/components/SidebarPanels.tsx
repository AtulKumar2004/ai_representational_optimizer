// app/analyze/components/SidebarPanels.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The four sidebar content panels: Reports, Toolkit, Resources, Settings.
// Each panel is shown when the user clicks its nav icon in the sidebar.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { HistoryEntry } from "../types";
import { formatDate } from "../utils";
import ToolkitFeatures from "../toolkit";

// ─── ReportsPanel ─────────────────────────────────────────────────────────────
// Lists all past analyses so the user can re-open one.

interface ReportsPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  isDark: boolean;
}

export function ReportsPanel({ history, onSelect, isDark }: ReportsPanelProps) {
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        Reports
      </p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
        Saved Reports
      </p>

      {history.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-orange-200 p-6 text-center">
          <p className={`text-sm ${isDark ? "text-slate-100" : "text-slate-700"}`}>
            No reports yet
          </p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Analyses are saved automatically.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {history
            .slice()
            .reverse()
            .map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="w-full rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-orange-300"
              >
                <div className="flex justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {entry.input.slice(0, 40)}
                    {entry.input.length > 40 ? "…" : ""}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      entry.result.overall_score >= 75
                        ? "bg-emerald-100 text-emerald-700"
                        : entry.result.overall_score >= 50
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {entry.result.overall_score}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatDate(entry.timestamp)}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── ToolkitPanel ─────────────────────────────────────────────────────────────
// Wrapper around the external ToolkitFeatures component.

export function ToolkitPanel({ isDark }: { isDark: boolean }) {
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        Toolkit
      </p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
        Optimization Tools
      </p>
      <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        AI optimization utilities for merchant readiness.
      </p>
      <ToolkitFeatures isDark={isDark} />
    </div>
  );
}

// ─── ResourcesPanel ───────────────────────────────────────────────────────────
// A curated list of links: guides, tools, and reading material.

export function ResourcesPanel({ isDark }: { isDark: boolean }) {
  const resources = [
    {
      category: "Guides",
      items: [
        {
          title: "How AI Shopping Agents Work",
          url: "https://openai.com/blog",
          desc: "Understand the systems evaluating your store",
        },
        {
          title: "Structured Data for E-commerce",
          url: "https://schema.org/Product",
          desc: "Official schema.org product markup reference",
        },
        {
          title: "Shopify SEO & AI Guide",
          url: "https://shopify.com/blog/topics/seo",
          desc: "Optimize your Shopify store for AI visibility",
        },
      ],
    },
    {
      category: "Tools",
      items: [
        {
          title: "Google Rich Results Test",
          url: "https://search.google.com/test/rich-results",
          desc: "Test your structured data markup",
        },
        {
          title: "Perplexity AI",
          url: "https://perplexity.ai",
          desc: "See how Perplexity represents your store",
        },
        {
          title: "Schema Markup Validator",
          url: "https://validator.schema.org",
          desc: "Validate your product schema",
        },
      ],
    },
    {
      category: "Reading",
      items: [
        {
          title: "Kasparro Blog",
          url: "https://kasparro.com",
          desc: "Insights on AI commerce and merchant tools",
        },
        {
          title: "AI Commerce Report 2024",
          url: "https://kasparro.com",
          desc: "How AI is reshaping online shopping",
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        Resources
      </p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
        Learning Center
      </p>
      <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        Guides, tools, and reading to improve your AI readiness.
      </p>

      <div className="mt-6 space-y-6">
        {resources.map((group) => (
          <div key={group.category}>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {group.category}
            </p>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white p-3 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <span className="mt-0.5 text-base">
                    <Link2 className="h-4 w-4 text-slate-600" />
                  </span>
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

// ─── SettingsPanel ────────────────────────────────────────────────────────────
// Lets the user configure their API key, model, theme, and clear history.

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

export function SettingsPanel({
  apiKey,
  setApiKey,
  model,
  setModel,
  theme,
  setTheme,
  onClearHistory,
  isDark,
}: SettingsPanelProps) {
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  function handleSave() {
    localStorage.setItem("sisyphus_api_key", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Two-tap confirmation before clearing all history
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        Settings
      </p>
      <p className={`mt-1 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
        Preferences
      </p>

      <div className="mt-6 space-y-6">
        {/* API Configuration */}
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
                {apiKey
                  ? "✓ Custom key set — will be used for analysis."
                  : "Leave blank to use the server's default key."}
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
              <p className="mt-1 text-[10px] text-slate-400">
                Selected model will be used for the next analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Appearance / Theme */}
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
                    theme === t
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {theme === "system"
                ? "Follows your OS preference."
                : theme === "dark"
                ? "Dark mode active."
                : "Light mode active."}
            </p>
          </div>
        </div>

        {/* Notifications toggle */}
        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Notifications</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-700">Analysis complete alerts</p>
              <p className="text-[10px] text-slate-400">Get notified when long analyses finish</p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => setNotifications((p) => !p)}
              className={`relative h-5 w-10 rounded-full transition ${
                notifications ? "bg-orange-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  notifications ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Data &amp; Privacy</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Analysis history is stored locally in your browser. No data is sent to external
            servers beyond the AI API call.
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

        {/* Save button */}
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