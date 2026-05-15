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

export default function ToolkitFeatures({
  isDark,
}: ToolkitProps) {
  const [activeTool, setActiveTool] =
    useState<string | null>(null);

  return (
    <>
      <div className="mt-6 grid gap-4">
        <ToolCard
          title="Schema.org Generator"
          icon={<Code2 className="h-5 w-5" />}
          isDark={isDark}
          onClick={() => setActiveTool("schema")}
        />

        <ToolCard
          title="FAQ Builder"
          icon={<CircleHelp className="h-5 w-5" />}
          isDark={isDark}
          onClick={() => setActiveTool("faq")}
        />

        <ToolCard
          title="Trust Signal Checker"
          icon={<ShieldCheck className="h-5 w-5" />}
          isDark={isDark}
          onClick={() => setActiveTool("trust")}
        />

        <ToolCard
          title="Policy Analyzer"
          icon={<FileCheck2 className="h-5 w-5" />}
          isDark={isDark}
          onClick={() => setActiveTool("policy")}
        />

        <ToolCard
          title="Description Enhancer"
          icon={<Sparkles className="h-5 w-5" />}
          isDark={isDark}
          onClick={() => setActiveTool("rewrite")}
        />
      </div>

      {activeTool === "schema" && (
        <SchemaGenerator
          onClose={() => setActiveTool(null)}
        />
      )}

      {activeTool === "faq" && (
        <FaqBuilder
          onClose={() => setActiveTool(null)}
        />
      )}

      {activeTool === "trust" && (
        <TrustChecker
          onClose={() => setActiveTool(null)}
        />
      )}

      {activeTool === "policy" && (
        <PolicyAnalyzer
          onClose={() => setActiveTool(null)}
        />
      )}

      {activeTool === "rewrite" && (
        <DescriptionEnhancer
          onClose={() => setActiveTool(null)}
        />
      )}
    </>
  );
}

function ToolCard({
  title,
  icon,
  isDark,
  onClick,
}: {
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

        <span className="font-semibold">
          {title}
        </span>
      </div>
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-sm font-semibold"
        >
          Close
        </button>

        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function OutputBox({
  value,
}: {
  value: string;
}) {
  function copy() {
    navigator.clipboard.writeText(value);
  }

  function download() {
    const blob = new Blob([value], {
      type: "text/plain",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

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
        className="tool-output h-72 w-full rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 text-sm"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={copy}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <Copy className="mr-2 inline h-4 w-4" />
          Copy
        </button>

        <button
          onClick={download}
          className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold"
        >
          <Download className="mr-2 inline h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}

function downloadJson(data: unknown) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    {
      type: "application/json",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = "analysis.json";

  a.click();

  URL.revokeObjectURL(url);
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 animate-pulse rounded-xl bg-orange-100" />
      <div className="h-6 animate-pulse rounded-xl bg-orange-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-orange-100" />
    </div>
  );
}

function SchemaGenerator({
  onClose,
}: {
  onClose: () => void;
}) {
  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [schema, setSchema] =
    useState("");

  async function generateSchema() {
    if (!input.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(
        "/api/schema",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            input,
          }),
        }
      );

      const data = await res.json();

      setSchema(data.schema);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="AI Schema Generator"
      onClose={onClose}
    >
      <textarea
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
        placeholder="Paste product description"
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4"
      />

      <button
        onClick={generateSchema}
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-white"
      >
        {loading
          ? "Generating..."
          : "Generate Schema"}
      </button>

      {schema && (
        <OutputBox value={schema} />
      )}
    </Modal>
  );
}

function FaqBuilder({
  onClose,
}: {
  onClose: () => void;
}) {
  const [input, setInput] =
    useState("");

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
    <Modal
      title="FAQ Builder"
      onClose={onClose}
    >
      <textarea
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
        placeholder="Paste product description"
        className="tool-input h-44 w-full rounded-2xl border border-orange-100 p-4"
      />

      <OutputBox value={faqs} />
    </Modal>
  );
}

function TrustChecker({ onClose }: { onClose: () => void }) {
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
    <Modal title="Trust Signal Checker" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">
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
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
      )}
 
      {loading && (
        <div className="mt-6 space-y-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}
 
      {results && !loading && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Trust Signal Analysis</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              results.overallScore >= 75 ? "bg-emerald-100 text-emerald-700" :
              results.overallScore >= 50 ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            }`}>
              Score: {results.overallScore}/100
            </span>
          </div>
 
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-xs text-slate-700 leading-5">
            {results.summary}
          </div>
 
          {results.checks.map((c) => (
            <div
              key={c.label}
              className={`rounded-2xl border p-4 ${
                c.status === "Present"
                  ? "trust-item-ok border-emerald-200 bg-emerald-50"
                  : c.status === "Partial"
                  ? "border-orange-200 bg-orange-50"
                  : "trust-item-missing border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{c.label}</p>
                <span className={`trust-item-status shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  c.status === "Present" ? "bg-emerald-100 text-emerald-700" :
                  c.status === "Partial" ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {c.status}
                </span>
              </div>
              {c.detail && (
                <p className="mt-1 text-[11px] leading-5 opacity-80">{c.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function PolicyAnalyzer({
  onClose,
}: {
  onClose: () => void;
}) {
  const [policy, setPolicy] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [results, setResults] =
    useState<null | {
      sections: {
        label: string;
        status:
          | "Present"
          | "Missing"
          | "Partial";
        detail: string;
      }[];

      summary: string;

      missingCount: number;

      presentCount: number;

      score: number;
    }>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function analyze() {
    const trimmed =
      policy.trim();

    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(
        "/api/policy_analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            policy: trimmed,
          }),
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        data.error
      ) {
        throw new Error(
          data.error ||
            "Analysis failed."
        );
      }

      setResults(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Policy Analyzer"
      onClose={onClose}
    >
      <p className="mb-4 text-sm text-slate-600">
        Paste your refund,
        shipping, privacy,
        or store policy text —
        the AI will analyze
        policy completeness,
        transparency, and
        customer trust
        readiness.
      </p>

      <textarea
        value={policy}
        onChange={(e) =>
          setPolicy(
            e.target.value
          )
        }
        placeholder="Paste your policy text here..."
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4 text-sm"
      />

      <button
        onClick={analyze}
        disabled={
          loading ||
          !policy.trim()
        }
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        {loading
          ? "Analyzing…"
          : "Analyze Policy"}
      </button>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map(
            (i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-orange-100"
              />
            )
          )}
        </div>
      )}

      {results && !loading && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {
                results.presentCount
              }{" "}
              of{" "}
              {
                results
                  .sections
                  .length
              }{" "}
              sections detected
            </p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                results.score >=
                75
                  ? "bg-emerald-100 text-emerald-700"
                  : results.score >=
                    50
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Score:{" "}
              {
                results.score
              }
              /100
            </span>
          </div>

          <div className="mb-4 rounded-2xl bg-orange-50 px-4 py-3 text-xs leading-5 text-slate-700">
            {
              results.summary
            }
          </div>

          <div className="space-y-3">
            {results.sections.map(
              (s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border p-4 ${
                    s.status ===
                    "Present"
                      ? "border-emerald-200 bg-emerald-50"
                      : s.status ===
                        "Partial"
                      ? "border-orange-200 bg-orange-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {
                        s.label
                      }
                    </p>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.status ===
                        "Present"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status ===
                            "Partial"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {s.detail && (
                    <p className="mt-1 text-[11px] leading-5 opacity-80">
                      {
                        s.detail
                      }
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
 
function DescriptionEnhancer({
  onClose,
}: {
  onClose: () => void;
}) {
  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<AnalysisResult | null>(
      null
    );

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  useEffect(() => {
    const raw =
      localStorage.getItem(
        HISTORY_KEY
      );

    if (!raw) return;

    try {
      setHistory(JSON.parse(raw));
    } catch {
      console.error(
        "Failed to restore history"
      );
    }
  }, []);

  async function generate() {
    if (!input.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            input,
            mode: "description",
          }),
        }
      );

      const data =
        (await res.json()) as AnalysisResult;

      if (!res.ok) {
        throw new Error(
          "Generation failed"
        );
      }

      setResult(data);

      const updated: HistoryItem[] = [
        {
          input,
          result: data,
          timestamp: Date.now(),
        },

        ...history,
      ];

      setHistory(updated);

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updated)
      );
    } catch (err) {
      console.error(err);

      alert(
        "Failed to generate AI rewrite"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Description Enhancer"
      onClose={onClose}
    >
      <textarea
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
        placeholder="Paste product description"
        className="tool-input h-52 w-full rounded-2xl border border-orange-100 p-4"
      />

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 inline h-4 w-4" />
            Generate AI Rewrite
          </>
        )}
      </button>

      {loading && (
        <div className="mt-6">
          <Skeleton />
        </div>
      )}

      {result && (
        <div className="mt-6">
          <OutputBox
            value={
              result.rewritten_description ||
              ""
            }
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() =>
                downloadPdf(
                  result,
                  input
                )
              }
              className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold"
            >
              <FileDown className="mr-2 inline h-4 w-4" />
              Export PDF
            </button>

            <button
              onClick={() =>
                downloadJson(result)
              }
              className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold"
            >
              <FileJson className="mr-2 inline h-4 w-4" />
              Export JSON
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-orange-600" />

            <p className="text-sm font-semibold">
              Previous Generations
            </p>
          </div>

          <div className="space-y-3">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(h.input);
                  setResult(h.result);
                }}
                className="tool-history-card w-full rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 text-left transition hover:border-orange-300"
              >
                <p className="text-xs font-semibold">
                  {h.input.slice(0, 120)}
                </p>

                <p className="mt-2 text-[11px] text-slate-500">
                  {new Date(
                    h.timestamp
                  ).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}