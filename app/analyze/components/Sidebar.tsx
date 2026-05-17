// app/analyze/components/Sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The collapsible left sidebar.
// Shows nav icons (collapsed) or full nav labels (expanded).
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import type { SidebarSection } from "../types";

interface NavItem {
  section: SidebarSection;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  isDark: boolean;
  activeSection: SidebarSection;
  navItems: NavItem[];
  onToggle: () => void;
  onSelectSection: (section: SidebarSection) => void;
  onGoToResources: () => void;
  variant?: "desktop" | "mobile";
}

export function Sidebar({
  isOpen,
  isDark,
  activeSection,
  navItems,
  onToggle,
  onSelectSection,
  onGoToResources,
  variant = "desktop",
}: SidebarProps) {
  const isMobile = variant === "mobile";

  return (
    <aside
      className={`flex flex-col border-r transition-all duration-300 ${
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-[82vw] max-w-xs shadow-2xl lg:hidden"
          : "hidden lg:flex"
      } ${!isMobile && isOpen ? "w-64" : !isMobile ? "w-16" : ""} ${isDark ? "border-slate-700 bg-slate-800" : "border-orange-100 bg-white/80"}`}
    >
      {/* ── Logo / collapse button ── */}
      <div
        className={`flex items-center border-b border-orange-100 px-4 py-5 ${
          isMobile || isOpen ? "justify-between gap-3" : "justify-center px-3"
        }`}
      >
        {isMobile ? (
          <>
            <p className="text-[15px] font-semibold uppercase tracking-[0.25em] text-orange-600">
              Merchant Lens
            </p>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 text-sm text-orange-700 hover:bg-orange-50"
              aria-label="Close sidebar"
            >
              ×
            </button>
          </>
        ) : isOpen ? (
          <>
            <p className="text-[15px] font-semibold uppercase tracking-[0.25em] text-orange-600">
              Merchant Lens
            </p>
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 text-xs text-orange-700 hover:bg-orange-50"
            >
              ‹
            </button>
          </>
        ) : (
          // Collapsed state: show a small "AI" button to re-expand
          <button
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700"
          >
            AI
          </button>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="mt-4 flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => onSelectSection(item.section)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeSection === item.section
                ? isDark
                  ? "bg-slate-700 text-white"
                  : "bg-orange-100 text-orange-700"
                : isDark
                ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                : "text-slate-800 hover:bg-orange-50 hover:text-slate-900"
            } ${isMobile || isOpen ? "" : "justify-center px-2"}`}
            title={!isMobile && !isOpen ? item.label : undefined}
          >
            <span className="text-base">{item.icon}</span>
            {(isMobile || isOpen) && item.label}
          </button>
        ))}
      </nav>

      {/* ── Help footer (only visible when sidebar is expanded + on Analyze tab) ── */}
      {(isMobile || isOpen) && activeSection === "analyze" && (
        <div className="border-t border-orange-100 p-4">
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Need help?</p>
            <p className="mt-2">Read the docs or book a quick demo.</p>
            <button
              onClick={onGoToResources}
              className="mt-3 w-full rounded-full border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
            >
              Go to resources
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}