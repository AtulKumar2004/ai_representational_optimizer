// app/analyze/types.ts
// ─────────────────────────────────────────────────────────────────────────────
// All shared TypeScript types for the Analyze feature.
// Import from here in any component that needs these types.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../api/analyze/route";

/** One entry saved in the analysis history */
export interface HistoryEntry {
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

/** Which main tab is currently active */
export type Tab =
  | "overview"
  | "issues"
  | "recommendation"
  | "aiview"
  | "comparison"
  | "report";

/** Which input mode the user is using */
export type InputMode = "description" | "url" | "file" | "mixed";

/** Which sidebar section is active */
export type SidebarSection =
  | "analyze"
  | "reports"
  | "toolkit"
  | "resources"
  | "settings";