// app/analyze/components/AnalyzeHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The top action bar shown in the Analyze section.
// Contains: New Analysis, History, Export Report, and Full Report buttons.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../../api/analyze/route";
import type { Tab } from "../types";

interface AnalyzeHeaderProps {
  result: AnalysisResult | null;
  historyCount: number;
  onNewAnalysis: () => void;
  onShowHistory: () => void;
  onShowExport: () => void;
  onSetTab: (tab: Tab) => void;
}

export function AnalyzeHeader({
  result,
  historyCount,
  onNewAnalysis,
  onShowHistory,
  onShowExport,
  onSetTab,
}: AnalyzeHeaderProps) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">

        {/* Start a fresh analysis */}
        <button
          onClick={onNewAnalysis}
          className="w-full rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
        >
          New Analysis
        </button>

        {/* Open analysis history modal */}
        <button
          onClick={onShowHistory}
          className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
        >
          History{" "}
          {historyCount > 0 && (
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
              {historyCount}
            </span>
          )}
        </button>

        {/* Open export modal */}
        <button
          onClick={onShowExport}
          className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
        >
          Export Report
        </button>

        {/* Jump to full report tab (only shown when a result exists) */}
        {result && (
          <button
            onClick={() => onSetTab("report")}
            className="w-full rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
          >
            Full Report
          </button>
        )}
      </div>
    </header>
  );
}