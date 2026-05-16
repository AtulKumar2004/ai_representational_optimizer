// app/analyze/components/HistoryPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal overlay that shows the user's past analyses.
// Clicking an entry re-loads that result into the main view.
// ─────────────────────────────────────────────────────────────────────────────

import { Link2, FileText } from "lucide-react";
import type { HistoryEntry } from "../types";
import { formatDate } from "../utils";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export function HistoryPanel({ history, onSelect, onClose }: HistoryPanelProps) {
  return (
    // Full-screen dark overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-orange-100 bg-white p-8 shadow-xl">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
          Analysis History
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Past Analyses</h2>

        {/* Empty state */}
        {history.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-orange-200 p-8 text-center">
            <p className="text-sm text-slate-500">No analyses run yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Run your first analysis to see history here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {/* Show newest first */}
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    onSelect(entry);
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Entry title with optional icon */}
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {(entry.url || entry.fileName) && (
                          <span className="mr-1 inline-flex translate-y-0.5">
                            {entry.url ? (
                              <Link2 className="h-3.5 w-3.5 text-slate-500" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </span>
                        )}
                        {entry.input.slice(0, 60)}
                        {entry.input.length > 60 ? "…" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>

                    {/* Score badge */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          entry.result.overall_score >= 75
                            ? "bg-emerald-100 text-emerald-700"
                            : entry.result.overall_score >= 50
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {entry.result.overall_score}/100
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {entry.result.overall_label}
                      </span>
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