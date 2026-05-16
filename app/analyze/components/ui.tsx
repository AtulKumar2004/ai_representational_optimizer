// app/analyze/components/ui.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Small, reusable UI building blocks used throughout the Analyze feature.
// ─────────────────────────────────────────────────────────────────────────────

import type { Issue, Recommendation } from "../../api/analyze/route";
import { severityClass, priorityDot, effortBadge } from "../utils";

// ─── ScoreRing ────────────────────────────────────────────────────────────────
// Circular score badge with a colored border and label below it.

interface ScoreRingProps {
  score: number;
  label: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const color =
    score >= 75
      ? "border-emerald-400"
      : score >= 50
      ? "border-orange-400"
      : "border-red-400";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] ${color}`}
      >
        <span className="text-xl font-semibold text-slate-900">{score}</span>
        <span className="absolute -bottom-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          /100
        </span>
      </div>
      <p className="text-center text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
// Animated placeholder shown while content is loading.

interface SkeletonProps {
  h?: string; // Tailwind height class, e.g. "h-10"
  w?: string; // Tailwind width class, e.g. "w-full"
}

export function Skeleton({ h = "h-10", w = "w-full" }: SkeletonProps) {
  return <div className={`${h} ${w} animate-pulse rounded-2xl bg-orange-100`} />;
}

// ─── IssueCard ────────────────────────────────────────────────────────────────
// Displays a single issue with its severity badge.

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className={`rounded-2xl border p-3 ${severityClass(issue.severity)}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{issue.title}</p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(issue.severity)}`}
        >
          {issue.severity}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-5 opacity-80">{issue.description}</p>
    </div>
  );
}

// ─── RecCard ──────────────────────────────────────────────────────────────────
// Displays a single recommendation with priority, effort, and rank number.

interface RecCardProps {
  rec: Recommendation;
  rank: number;
}

export function RecCard({ rec, rank }: RecCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-orange-100 bg-white p-3">
      {/* Rank number badge */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
        {rank}
      </span>

      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-900">{rec.title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-slate-600">{rec.detail}</p>

        <div className="mt-1.5 flex gap-2">
          {/* Priority indicator */}
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(rec.priority)}`} />
            {rec.priority} priority
          </span>

          {/* Effort badge */}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${effortBadge(rec.effort)}`}
          >
            {rec.effort} effort
          </span>
        </div>
      </div>
    </div>
  );
}