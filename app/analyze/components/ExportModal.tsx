// app/analyze/components/ExportModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal that lets the user export their analysis as Markdown, PDF, JSON,
// or copy it to the clipboard.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import type { AnalysisResult } from "../../api/analyze/route";
import { downloadPdf } from "../pdfReport";
import { SCORE_LABELS } from "../utils";

interface ExportModalProps {
  result: AnalysisResult | null;
  context: string; // The URL / description used for the analysis
  onClose: () => void;
}

export function ExportModal({ result, context, onClose }: ExportModalProps) {
  const [exported, setExported] = useState(false);

  // Build a full Markdown string from the result
  function buildMarkdown(): string {
    if (!result) return "";
    const now = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

    return `# AI Readiness Report
Generated: ${now}
Input: ${context.slice(0, 200)}${context.length > 200 ? "…" : ""}

---

## Overall Score: ${result.overall_score}/100 — ${result.overall_label}
Potential lift: ${result.potential_lift}

## Score Breakdown
${Object.entries(result.score_breakdown)
  .map(([k, v]) => `- ${SCORE_LABELS[k]}: ${v}/100`)
  .join("\n")}

## AI Snapshot
${result.ai_snapshot}

## Perceived Strengths
${result.perceived_strengths.map((s) => `- ${s}`).join("\n")}

## Perceived Weaknesses
${result.perceived_weaknesses.map((w) => `- ${w}`).join("\n")}

## Top Issues
${result.top_issues
  .map((i) => `### [${i.severity}] ${i.title}\n${i.description}`)
  .join("\n\n")}

## Top Recommendations
${result.top_recommendations
  .map(
    (r, i) =>
      `### ${i + 1}. ${r.title} [${r.priority} priority, ${r.effort} effort]\n${r.detail}`
  )
  .join("\n\n")}

## Ranked Action Plan
${result.ranked_action_plan
  .map(
    (r, i) =>
      `### ${i + 1}. ${r.title} [${r.priority} priority, ${r.effort} effort]\n${r.detail}`
  )
  .join("\n\n")}

## Fix Playbook
${result.fix_playbook.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Perception vs. Intent Gap Analysis
**AI perceives:** ${result.comparison.ai_perceives}
**Merchant intent:** ${result.comparison.merchant_intent}

${result.comparison.gaps
  .map(
    (g) =>
      `### ${g.dimension}\n- AI sees: ${g.ai_perceives}\n- You want: ${g.merchant_intent}\n- Gap: ${g.gap_explanation}`
  )
  .join("\n\n")}
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
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
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

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
          Export
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Export Report</h2>

        {/* No result yet */}
        {!result ? (
          <div className="mt-6 rounded-2xl border border-dashed border-orange-200 p-8 text-center">
            <p className="text-sm text-slate-500">No analysis to export yet.</p>
            <p className="mt-1 text-xs text-slate-400">Run an analysis first.</p>
          </div>
        ) : (
          <>
            {/* Summary of what will be exported */}
            <div className="mt-6 rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-semibold text-slate-700">Report includes</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• Overall score &amp; label ({result.overall_score}/100 — {result.overall_label})</li>
                <li>• Full score breakdown across 5 dimensions</li>
                <li>• {result.top_issues.length} identified issues</li>
                <li>• {result.ranked_action_plan.length}-step ranked action plan</li>
                <li>• AI perception analysis + gap report</li>
                <li>• Fix playbook ({result.fix_playbook.length} steps)</li>
              </ul>
            </div>

            {/* Success message */}
            {exported && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
                ✓ Exported successfully
              </div>
            )}

            {/* Export format buttons */}
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