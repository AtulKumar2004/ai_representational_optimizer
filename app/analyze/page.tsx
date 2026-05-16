// app/analyze/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Main page for the Analyze feature.
//
// This file handles ONLY:
//   1. All useState / useEffect hooks (application state)
//   2. Business logic: runAnalysis(), loadHistoryEntry(), clearHistory()
//   3. Derived values computed from state
//   4. High-level layout: <Sidebar> + <main>
//   5. Routing between tabs and sidebar sections
//
// Every piece of visible UI lives in components/. Import from there.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, BookOpen, Search, Settings, Wrench } from "lucide-react";

import type { AnalysisResult } from "../api/analyze/route";
import type { HistoryEntry, Tab, InputMode, SidebarSection } from "./types";

// ── UI components ─────────────────────────────────────────────────────────────
import { HistoryPanel }                    from "./components/HistoryPanel";
import { ExportModal }                     from "./components/ExportModal";
import { FullReportSection }               from "./components/FullReportSection";
import { Sidebar }                         from "./components/Sidebar";
import { AnalyzeHeader }                   from "./components/AnalyzeHeader";
import { InputCard }                       from "./components/InputCard";
import { ScoreCard }                       from "./components/ScoreCard";
import { OverviewTab }                     from "./components/OverviewTab";
import { IssuesTab, ActionPlanTab, AIViewTab, GapAnalysisTab, TabBar } from "./components/TabViews";
import { ReportsPanel, ToolkitPanel, ResourcesPanel, SettingsPanel } from "./components/SidebarPanels";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = [
  "pdf", "docx", "txt", "csv", "xlsx", "json",
  "png", "jpg", "jpeg", "webp",
];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── AnalyzePage ──────────────────────────────────────────────────────────────

export default function AnalyzePage() {

  // ── UI state ────────────────────────────────────────────────────────────────
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("analyze");
  const [tab,            setTab]            = useState<Tab>("overview");

  // ── Input state ─────────────────────────────────────────────────────────────
  const [input,           setInput]           = useState("");
  const [inputUrl,        setInputUrl]        = useState("");
  const [uploadFile,      setUploadFile]      = useState<File | null>(null);
  const [fileError,       setFileError]       = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showUrl,         setShowUrl]         = useState(true);

  // ── Analysis state ──────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [result,          setResult]          = useState<AnalysisResult | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [analysisContext, setAnalysisContext] = useState("");

  // ── History / modals ────────────────────────────────────────────────────────
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport,  setShowExport]  = useState(false);

  // ── Persisted settings ──────────────────────────────────────────────────────
  const [apiKey, setApiKeyState] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sisyphus_api_key") ?? "" : ""
  );
  const [model, setModelState] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("sisyphus_model") ?? "llama-3.3-70b-versatile"
      : "llama-3.3-70b-versatile"
  );
  const [themeState, setThemeState] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sisyphus_theme") ?? "light" : "light"
  );
  const [systemDark, setSystemDark] = useState(false);

  // ── Theme helpers ────────────────────────────────────────────────────────────

  /** Applies the chosen theme to the <html> element and persists the choice. */
  const setTheme = (t: string) => {
    setThemeState(t);
    localStorage.setItem("sisyphus_theme", t);
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? root.classList.add("dark")
        : root.classList.remove("dark");
    }
  };

  const setApiKey = (v: string) => setApiKeyState(v);
  const setModel  = (v: string) => { setModelState(v); localStorage.setItem("sisyphus_model", v); };

  // Track OS dark-mode changes when theme is "system"
  useEffect(() => {
    if (themeState !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [themeState]);

  const isDark = themeState === "dark" || (themeState === "system" && systemDark);

  // ── File handling ────────────────────────────────────────────────────────────

  function handleFile(file: File | null) {
    if (!file) { setUploadFile(null); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setFileError("Unsupported file type."); setUploadFile(null); return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File exceeds 10 MB limit."); setUploadFile(null); return;
    }
    setFileError(null);
    setUploadFile(file);
  }

  /** OCR an image file with Tesseract.js and return the extracted text. */
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

  // ── Analysis API call ────────────────────────────────────────────────────────

  /** Builds the short context label stored in history for this analysis. */
  function buildAnalysisLabel(description: string, url: string, fileName?: string): string {
    const parts: string[] = [];
    if (description) {
      const snippet = description.length > 160 ? `${description.slice(0, 160)}…` : description;
      parts.push(`Description: ${snippet}`);
    }
    if (url)      parts.push(`URL: ${url}`);
    if (fileName) parts.push(`File: ${fileName}`);
    return parts.join("\n");
  }

  async function runAnalysis() {
    const description = input.trim();
    const url         = inputUrl.trim();
    const file        = uploadFile;
    const hasDescription = description.length > 0;
    const hasUrl         = url.length > 0;
    const hasFile        = !!file;

    if (!hasDescription && !hasUrl && !hasFile) {
      setError("Please provide a description, URL, or file to analyze.");
      return;
    }

    setLoading(true);
    setError(null);
    setFileError(null);
    setResult(null);

    try {
      // Step 1: Extract text from an uploaded file (if any)
      let fileText = "";
      if (hasFile && file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (IMAGE_EXTENSIONS.includes(ext)) {
          fileText = await extractImageText(file);
          if (!fileText.trim()) throw new Error("No readable text found in this image.");
        } else {
          const form = new FormData();
          form.append("file", file);
          form.append("model", model);
          form.append("returnText", "1");
          if (apiKey) form.append("apiKey", apiKey);
          const extractRes  = await fetch("/api/analyze-file", { method: "POST", body: form });
          const extractData = await extractRes.json();
          if (!extractRes.ok || extractData.error) {
            throw new Error(extractData.error || "Failed to read the uploaded file.");
          }
          fileText = (extractData.text ?? "").toString();
        }
      }

      // Step 2: Combine all inputs into a single string
      const combinedParts: string[] = [];
      if (hasDescription) combinedParts.push(`Product description:\n${description}`);
      if (hasUrl)         combinedParts.push(`Store URL:\n${url}`);
      if (fileText)       combinedParts.push(`File content${file ? ` (${file.name})` : ""}:\n${fileText}`);
      const combinedInput = combinedParts.join("\n\n");
      const requestMode: InputMode = hasDescription || fileText ? "description" : "url";

      // Step 3: Send to the analysis API
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

      // Step 4: Store result and save to history
      const newResult = data as AnalysisResult;
      setResult(newResult);
      setTab("overview");

      const label = buildAnalysisLabel(description, url, file?.name);
      setAnalysisContext(label);

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        input: label.split("\n")[0] || "Analysis",
        mode: hasDescription && hasUrl && hasFile ? "mixed"
              : hasFile        ? "file"
              : hasDescription ? "description"
              : "url",
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

  // ── History helpers ──────────────────────────────────────────────────────────

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

  // ── Derived values ───────────────────────────────────────────────────────────

  const aiConfidence = result
    ? Math.min(96, Math.max(62, Math.round(result.overall_score * 0.9 + 8)))
    : null;

  // Used by the score breakdown chips in the ScoreCard
  const trustSignals = result
    ? [
        { label: "Reviews",         score: result.score_breakdown.trust_signals },
        { label: "FAQ",             score: result.score_breakdown.faq_coverage },
        { label: "Warranty",        score: result.score_breakdown.policy_completeness },
        { label: "Policies",        score: result.score_breakdown.policy_completeness },
        { label: "Structured Data", score: result.score_breakdown.structured_data },
      ]
    : [];

  // Used by the Trust Signal Analysis card in the OverviewTab
  const trustSignalRows = result
    ? [
        { label: "Reviews",                  score: result.score_breakdown.trust_signals },
        { label: "Warranty coverage",         score: result.score_breakdown.policy_completeness },
        { label: "Return policy clarity",     score: result.score_breakdown.policy_completeness },
        { label: "Shipping transparency",     score: result.score_breakdown.policy_completeness },
        { label: "FAQ completeness",          score: result.score_breakdown.faq_coverage },
        { label: "Structured data presence",  score: result.score_breakdown.structured_data },
      ]
    : [];

  const trustConfidence = result
    ? Math.round(trustSignalRows.reduce((s, i) => s + i.score, 0) / Math.max(1, trustSignalRows.length))
    : null;

  const aiSnapshotShort = result
    ? result.ai_snapshot.length > 200
      ? `${result.ai_snapshot.slice(0, 200)}…`
      : result.ai_snapshot
    : "";

  // ── Sidebar nav items ────────────────────────────────────────────────────────

  const navItems: { section: SidebarSection; label: string; icon: ReactNode }[] = [
    { section: "analyze",   label: "Analyze Store", icon: <Search  className="h-4 w-4" /> },
    { section: "reports",   label: "Reports",        icon: <BarChart3 className="h-4 w-4" /> },
    { section: "toolkit",   label: "Toolkit",        icon: <Wrench  className="h-4 w-4" /> },
    { section: "resources", label: "Resources",      icon: <BookOpen className="h-4 w-4" /> },
    { section: "settings",  label: "Settings",       icon: <Settings className="h-4 w-4" /> },
  ];

  // ── Result tabs ──────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview",        label: "Overview"     },
    { id: "issues",          label: "Issues"       },
    { id: "recommendation",  label: "Action Plan"  },
    { id: "aiview",          label: "AI View"      },
    { id: "comparison",      label: "Gap Analysis" },
    { id: "report",          label: "Full Report"  },
  ];

  const modelLabel = model
    .replace("llama-3.3-70b-versatile", "Llama 3.3 70B")
    .replace("llama-3.1-8b-instant",    "Llama 3.1 8B")
    .replace("mixtral-8x7b-32768",      "Mixtral 8x7B");

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      suppressHydrationWarning
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-[#fbf6f0] text-slate-900"
      }`}
    >
      {/* ── Modals ── */}
      {showHistory && (
        <HistoryPanel
          history={history}
          onSelect={loadHistoryEntry}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showExport && (
        <ExportModal
          result={result}
          context={analysisContext || input || inputUrl}
          onClose={() => setShowExport(false)}
        />
      )}

      <div className="flex min-h-screen">

        {/* ── Collapsible sidebar ── */}
        <Sidebar
          isOpen={sidebarOpen}
          isDark={isDark}
          activeSection={sidebarSection}
          navItems={navItems}
          onToggle={() => setSidebarOpen((o) => !o)}
          onSelectSection={setSidebarSection}
          onGoToResources={() => setSidebarSection("resources")}
        />

        {/* ── Main content area ── */}
        <main className="flex-1 overflow-auto px-6 py-4 lg:px-10">

          {/* Non-analyze sidebar panels */}
          {sidebarSection === "reports" && (
            <div className="mx-auto max-w-3xl">
              <ReportsPanel history={history} onSelect={loadHistoryEntry} isDark={isDark} />
            </div>
          )}
          {sidebarSection === "toolkit" && (
            <div className="mx-auto max-w-3xl">
              <ToolkitPanel isDark={isDark} />
            </div>
          )}
          {sidebarSection === "resources" && (
            <div className="mx-auto max-w-3xl">
              <ResourcesPanel isDark={isDark} />
            </div>
          )}
          {sidebarSection === "settings" && (
            <div className="mx-auto max-w-3xl">
              <SettingsPanel
                apiKey={apiKey}
                setApiKey={setApiKey}
                model={model}
                setModel={setModel}
                theme={themeState}
                setTheme={setTheme}
                onClearHistory={clearHistory}
                isDark={isDark}
              />
            </div>
          )}

          {/* ── Analyze section ── */}
          {sidebarSection === "analyze" && (
            <>
              {/* Top action buttons */}
              <AnalyzeHeader
                result={result}
                historyCount={history.length}
                onNewAnalysis={() => { setResult(null); setError(null); setInput(""); setTab("overview"); }}
                onShowHistory={() => setShowHistory(true)}
                onShowExport={() => setShowExport(true)}
                onSetTab={setTab}
              />

              {/* Input card + Score card side by side */}
              <section className="mt-3 grid items-stretch gap-3 lg:grid-cols-[1.4fr_1fr]">
                <InputCard
                  input={input}
                  setInput={setInput}
                  inputUrl={inputUrl}
                  setInputUrl={setInputUrl}
                  uploadFile={uploadFile}
                  onFileSelected={handleFile}
                  showDescription={showDescription}
                  setShowDescription={setShowDescription}
                  showUrl={showUrl}
                  setShowUrl={setShowUrl}
                  loading={loading}
                  error={error}
                  fileError={fileError}
                  result={result}
                  modelLabel={modelLabel}
                  onRunAnalysis={runAnalysis}
                />
                <ScoreCard
                  result={result}
                  loading={loading}
                  aiConfidence={aiConfidence}
                  trustSignals={trustSignals}
                  onSetTab={setTab}
                />
              </section>

              {/* Tab navigation bar */}
              <TabBar tabs={tabs} activeTab={tab} isDark={isDark} onSetTab={setTab} />

              {/* Tab content */}
              {tab === "overview" && (
                <OverviewTab
                  result={result}
                  loading={loading}
                  trustSignalRows={trustSignalRows}
                  trustConfidence={trustConfidence}
                  aiSnapshotShort={aiSnapshotShort}
                  onSetTab={setTab}
                />
              )}
              {tab === "issues"         && <IssuesTab     result={result} loading={loading} />}
              {tab === "recommendation" && <ActionPlanTab result={result} loading={loading} />}
              {tab === "aiview"         && <AIViewTab     result={result} loading={loading} />}
              {tab === "comparison"     && <GapAnalysisTab result={result} loading={loading} />}

              {/* Full Report tab */}
              {tab === "report" && (
                <div className="mt-4">
                  {result ? (
                    <FullReportSection
                      result={result}
                      context={analysisContext || input || inputUrl}
                    />
                  ) : (
                    <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-12 text-center">
                      <p className="text-sm font-semibold text-slate-500">No report yet</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Run an analysis to generate a full report.
                      </p>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}