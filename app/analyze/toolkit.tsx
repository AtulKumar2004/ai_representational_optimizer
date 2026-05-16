"use client";

import { downloadPdf } from "./pdfReport";

import {
  useMemo,
  useState,
  useEffect,
} from "react";

import type { AnalysisResult } from "../api/analyze/route";

import {
  Copy,
  Download,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  CircleHelp,
  Code2,
  FileJson,
  FileDown,
  Loader2,
  History,
} from "lucide-react";

interface ToolkitProps {
  isDark: boolean;
}

interface HistoryItem {
  input: string;
  result: AnalysisResult;
  timestamp: number;
}

const HISTORY_KEY = "toolkit_history";

export default function ToolkitFeatures({ isDark }: ToolkitProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <>
      <div className="mt-6 grid gap-4">
        <ToolCard title="Schema.org Generator" icon={<Code2 className="h-5 w-5" />} isDark={isDark} onClick={() => setActiveTool("schema")} />
        <ToolCard title="FAQ Builder" icon={<CircleHelp className="h-5 w-5" />} isDark={isDark} onClick={() => setActiveTool("faq")} />
        <ToolCard title="Trust Signal Checker" icon={<ShieldCheck className="h-5 w-5" />} isDark={isDark} onClick={() => setActiveTool("trust")} />
        <ToolCard title="Policy Analyzer" icon={<FileCheck2 className="h-5 w-5" />} isDark={isDark} onClick={() => setActiveTool("policy")} />
        <ToolCard title="Description Enhancer" icon={<Sparkles className="h-5 w-5" />} isDark={isDark} onClick={() => setActiveTool("rewrite")} />
      </div>

      {activeTool === "schema"  && <SchemaGenerator       onClose={() => setActiveTool(null)} isDark={isDark} />}
      {activeTool === "faq"    && <FaqBuilder             onClose={() => setActiveTool(null)} isDark={isDark} />}
      {activeTool === "trust"  && <TrustChecker           onClose={() => setActiveTool(null)} isDark={isDark} />}
      {activeTool === "policy" && <PolicyAnalyzer         onClose={() => setActiveTool(null)} isDark={isDark} />}
      {activeTool === "rewrite"&& <DescriptionEnhancer    onClose={() => setActiveTool(null)} isDark={isDark} />}
    </>
  );
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCard({ title, icon, isDark, onClick }: {
  title: string;
  icon: React.ReactNode;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition hover:scale-[1.01] ${
        isDark
          ? "border-orange-200 bg-[#fff3e6] text-slate-900"
          : "glass-card text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="font-semibold">{title}</span>
      </div>
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose, isDark = false }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isDark?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 ${isDark ? "bg-slate-900 border border-slate-700" : "glass-card"}`}>
        <button
          onClick={onClose}
          className={`absolute right-5 top-5 text-sm font-semibold ${isDark ? "text-slate-300 hover:text-white" : "text-slate-900 hover:text-slate-700"}`}
        >
          Close
        </button>
        <h2 className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          {title}
        </h2>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

// ─── OutputBox ────────────────────────────────────────────────────────────────

function OutputBox({ value, isDark = false }: { value: string; isDark?: boolean }) {
  const [showToast, setShowToast] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  function download() {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tool-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4">
      <textarea
        value={value}
        readOnly
        className="tool-output h-72 w-full rounded-2xl border border-orange-100 p-4 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={copy}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Copy className="mr-2 inline h-4 w-4" />
          Copy
        </button>
        <button
          onClick={download}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-orange-400 text-orange-300 hover:bg-orange-500/20" : "border-orange-200 text-orange-700 hover:bg-orange-100"}`}
        >
          <Download className="mr-2 inline h-4 w-4" />
          Download
        </button>
      </div>
      {showToast && <div className="toast">✓ Copied to clipboard</div>}
    </div>
  );
}

// ─── downloadJson ─────────────────────────────────────────────────────────────

function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "analysis.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 animate-pulse rounded-xl bg-orange-100" />
      <div className="h-6 animate-pulse rounded-xl bg-orange-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-orange-100" />
    </div>
  );
}

// ─── StatusCard ───────────────────────────────────────────────────────────────
// Shared card used by both TrustChecker and PolicyAnalyzer.
// Solves the dark mode visibility problem: dark mode gets dark card backgrounds
// with light text; light mode keeps the pastel backgrounds.

function StatusCard({
  label,
  detail,
  status,
  isDark,
}: {
  label: string;
  detail?: string;
  status: "Present" | "Missing" | "Partial";
  isDark: boolean;
}) {
  // In dark mode: use solid dark backgrounds so white text is legible.
  // In light mode: use the original pastel backgrounds.
  const cardClass = isDark
    ? status === "Present"
      ? "border border-emerald-700 bg-emerald-950"
      : status === "Partial"
      ? "border border-orange-600 bg-orange-950"
      : "border border-red-700 bg-red-950"
    : status === "Present"
    ? "border border-emerald-200 bg-emerald-50"
    : status === "Partial"
    ? "border border-orange-200 bg-orange-50"
    : "border border-red-200 bg-red-50";

  const badgeClass = isDark
    ? status === "Present"
      ? "bg-emerald-800 text-emerald-200"
      : status === "Partial"
      ? "bg-orange-800 text-orange-200"
      : "bg-red-800 text-red-200"
    : status === "Present"
    ? "bg-emerald-100 text-emerald-700"
    : status === "Partial"
    ? "bg-orange-100 text-orange-700"
    : "bg-red-100 text-red-700";

  // Label color: slightly muted but clearly readable in both modes
  const labelClass = isDark ? "text-slate-100" : "text-slate-800";
  const detailClass = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <div className={`rounded-2xl p-4 ${cardClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${labelClass}`}>{label}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
          {status}
        </span>
      </div>
      {detail && (
        <p className={`mt-1.5 text-[11px] leading-5 ${detailClass}`}>{detail}</p>
      )}
    </div>
  );
}

// ─── ScoreBadge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score, isDark }: { score: number; isDark: boolean }) {
  const cls = isDark
    ? score >= 75 ? "bg-emerald-800 text-emerald-200"
      : score >= 50 ? "bg-orange-800 text-orange-200"
      : "bg-red-800 text-red-200"
    : score >= 75 ? "bg-emerald-100 text-emerald-700"
      : score >= 50 ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      Score: {score}/100
    </span>
  );
}

// ─── SummaryBox ───────────────────────────────────────────────────────────────

function SummaryBox({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-xs leading-5 ${
      isDark ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-orange-50 text-slate-700"
    }`}>
      {text}
    </div>
  );
}

// ─── SchemaGenerator ──────────────────────────────────────────────────────────

function SchemaGenerator({ onClose, isDark = false }: { onClose: () => void; isDark?: boolean }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState("");

  async function generateSchema() {
    if (!input.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      setSchema(data.schema);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="AI Schema Generator" onClose={onClose} isDark={isDark}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste product description"
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4"
      />
      <button
        onClick={generateSchema}
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-white hover:bg-orange-600 transition font-semibold"
      >
        {loading ? "Generating..." : "Generate Schema"}
      </button>
      {schema && <OutputBox value={schema} isDark={isDark} />}
    </Modal>
  );
}

// ─── FaqBuilder ───────────────────────────────────────────────────────────────

function FaqBuilder({ onClose, isDark = false }: { onClose: () => void; isDark?: boolean }) {
  const [input, setInput] = useState("");

  const faqs = useMemo(() => {
    if (!input) return "";
    return `
Q: What problem does this solve?
A: ${input.slice(0, 80)}...

Q: Is it beginner friendly?
A: Yes, it is designed for ease of use.

Q: What makes this different?
A: It focuses on reliability, quality, and usability.

Q: Is there customer support?
A: Yes, support is available for customer assistance.

Q: Is there a refund policy?
A: Yes, standard return and refund policies apply.
`;
  }, [input]);

  return (
    <Modal title="FAQ Builder" onClose={onClose} isDark={isDark}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste product description"
        className="tool-input h-44 w-full rounded-2xl border border-orange-100 p-4"
      />
      <OutputBox value={faqs} isDark={isDark} />
    </Modal>
  );
}

// ─── TrustChecker ─────────────────────────────────────────────────────────────

function TrustChecker({ onClose, isDark = false }: { onClose: () => void; isDark?: boolean }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<null | {
    checks: { label: string; status: "Present" | "Missing" | "Partial"; detail: string }[];
    summary: string;
    overallScore: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/trust_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed.");
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Trust Signal Checker" onClose={onClose} isDark={isDark}>
      <p className={`mb-4 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Enter your store URL — the AI will fetch and analyze it for trust signals automatically.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="https://yourstore.myshopify.com"
          className="tool-input flex-1 rounded-2xl border border-orange-100 px-4 py-2.5 text-sm"
        />
        <button
          onClick={analyze}
          disabled={loading || !url.trim()}
          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {error && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${isDark ? "border-red-600 bg-red-950 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}

      {results && !loading && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              Trust Signal Analysis
            </p>
            <ScoreBadge score={results.overallScore} isDark={isDark} />
          </div>

          <SummaryBox text={results.summary} isDark={isDark} />

          {results.checks.map((c) => (
            <StatusCard
              key={c.label}
              label={c.label}
              detail={c.detail}
              status={c.status}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── PolicyAnalyzer ───────────────────────────────────────────────────────────

function PolicyAnalyzer({ onClose, isDark = false }: { onClose: () => void; isDark?: boolean }) {
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<null | {
    sections: { label: string; status: "Present" | "Missing" | "Partial"; detail: string }[];
    summary: string;
    missingCount: number;
    presentCount: number;
    score: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const trimmed = policy.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/policy_analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed.");
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Policy Analyzer" onClose={onClose} isDark={isDark}>
      <p className={`mb-4 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Paste your refund, shipping, privacy, or store policy text — the AI will analyze policy
        completeness, transparency, and customer trust readiness.
      </p>

      <textarea
        value={policy}
        onChange={(e) => setPolicy(e.target.value)}
        placeholder="Paste your policy text here..."
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4 text-sm"
      />

      <button
        onClick={analyze}
        disabled={loading || !policy.trim()}
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze Policy"}
      </button>

      {error && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${isDark ? "border-red-600 bg-red-950 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}

      {results && !loading && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              {results.presentCount} of {results.sections.length} sections detected
            </p>
            <ScoreBadge score={results.score} isDark={isDark} />
          </div>

          <SummaryBox text={results.summary} isDark={isDark} />

          <div className="mt-3 space-y-3">
            {results.sections.map((s) => (
              <StatusCard
                key={s.label}
                label={s.label}
                detail={s.detail}
                status={s.status}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── DescriptionEnhancer ──────────────────────────────────────────────────────

function DescriptionEnhancer({ onClose, isDark = false }: { onClose: () => void; isDark?: boolean }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try { setHistory(JSON.parse(raw)); } catch { console.error("Failed to restore history"); }
  }, []);

  async function generate() {
    if (!input.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode: "description" }),
      });
      const data = (await res.json()) as AnalysisResult;
      if (!res.ok) throw new Error("Generation failed");
      setResult(data);
      const updated: HistoryItem[] = [{ input, result: data, timestamp: Date.now() }, ...history];
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI rewrite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Description Enhancer" onClose={onClose} isDark={isDark}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste product description"
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4"
      />

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="mr-2 inline h-4 w-4" />Generate AI Rewrite</>
        )}
      </button>

      {loading && <div className="mt-6"><Skeleton /></div>}

      {result && (
        <div className="mt-6">
          <OutputBox value={result.rewritten_description || ""} isDark={isDark} />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => downloadPdf(result, input)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-orange-400 text-orange-300 hover:bg-orange-500/20" : "border-orange-200 text-orange-700 hover:bg-orange-100"}`}
            >
              <FileDown className="mr-2 inline h-4 w-4" />Export PDF
            </button>
            <button
              onClick={() => downloadJson(result)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-orange-400 text-orange-300 hover:bg-orange-500/20" : "border-orange-200 text-orange-700 hover:bg-orange-100"}`}
            >
              <FileJson className="mr-2 inline h-4 w-4" />Export JSON
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <History className={`h-4 w-4 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
            <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-900"}`}>
              Previous Generations
            </p>
          </div>
          <div className="space-y-3">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => { setInput(h.input); setResult(h.result); }}
                className={`tool-history-card w-full rounded-2xl border p-4 text-left transition ${isDark ? "border-slate-700 bg-slate-800 hover:border-orange-400 text-slate-200" : "border-orange-100 bg-[#fffaf5] hover:border-orange-300 text-slate-900"}`}
              >
                <p className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {h.input.slice(0, 120)}
                </p>
                <p className={`mt-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {new Date(h.timestamp).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}