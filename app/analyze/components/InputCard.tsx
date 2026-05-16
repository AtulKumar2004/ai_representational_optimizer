// app/analyze/components/InputCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The input card shown at the top of the Analyze section.
// Lets the user provide a product description, store URL, and/or an uploaded
// file. Each input type can be toggled independently.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from "react";
import type { AnalysisResult } from "../../api/analyze/route";

interface InputCardProps {
  // Text inputs
  input: string;
  setInput: (v: string) => void;
  inputUrl: string;
  setInputUrl: (v: string) => void;

  // File upload
  uploadFile: File | null;
  onFileSelected: (file: File | null) => void;

  // Toggle visibility of each input section
  showDescription: boolean;
  setShowDescription: (v: boolean) => void;
  showUrl: boolean;
  setShowUrl: (v: boolean) => void;

  // State
  loading: boolean;
  error: string | null;
  fileError: string | null;
  result: AnalysisResult | null;

  // Model label shown at the bottom (e.g. "Llama 3.3 70B")
  modelLabel: string;

  // Called when the user clicks "Analyze with AI"
  onRunAnalysis: () => void;
}

// Accepted file types shown in the file picker
const ACCEPTED_FILES = ".pdf,.docx,.txt,.csv,.xlsx,.json,.png,.jpg,.jpeg,.webp";

export function InputCard({
  input,
  setInput,
  inputUrl,
  setInputUrl,
  uploadFile,
  onFileSelected,
  showDescription,
  setShowDescription,
  showUrl,
  setShowUrl,
  loading,
  error,
  fileError,
  result,
  modelLabel,
  onRunAnalysis,
}: InputCardProps) {
  // Hidden <input type="file"> element we trigger programmatically
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Determine if there is anything to analyze
  const canAnalyze = !loading && (!!input.trim() || !!inputUrl.trim() || !!uploadFile);

  // How many input sections are currently visible (for grid layout)
  const visibleCount = Number(showDescription) + Number(showUrl);

  return (
    <div className="h-full rounded-3xl border border-orange-100 bg-white p-4">

      {/* ── Card header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Input Sources
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Add any one, two, or all three inputs to generate a unified report.
          </p>
        </div>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">
          Multi-input enabled
        </span>
      </div>

      {/* ── Toggle buttons (show/hide each input type) ── */}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            showDescription
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
          }`}
        >
          Product Description
        </button>
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            showUrl
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
          }`}
        >
          Store URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            uploadFile
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 bg-white text-slate-600 hover:bg-orange-50"
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_FILES}
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
      />

      {/* ── Uploaded file indicator ── */}
      {uploadFile && (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-orange-100 bg-[#fffaf5] px-3 py-2 text-[11px]">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{uploadFile.name}</p>
            <p className="text-[10px] text-slate-500">
              {Math.ceil(uploadFile.size / 1024)} KB · OCR for images
            </p>
          </div>
          <button
            onClick={() => onFileSelected(null)}
            className="rounded-full border border-orange-200 px-2 py-1 text-[10px] font-semibold text-orange-700 hover:bg-orange-50"
          >
            Remove
          </button>
        </div>
      )}

      {/* ── Description + URL text inputs ── */}
      <div
        className={`mt-3 grid gap-3 ${
          visibleCount === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1"
        }`}
      >
        {showDescription && (
          <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              Product Description
              <span className="ml-auto text-[10px] text-slate-400">Optional</span>
            </div>
            <textarea
              className="mt-3 w-full resize-none rounded-2xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
              rows={4}
              maxLength={5000}
              placeholder="Paste your product description here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-2 text-[10px] text-slate-400">
              {input.length}/5000 characters
            </div>
          </div>
        )}

        {showUrl && (
          <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              Store URL
              <span className="ml-auto text-[10px] text-slate-400">Optional</span>
            </div>
            <input
              type="url"
              className="mt-3 w-full rounded-2xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
              placeholder="https://yourstore.myshopify.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-slate-400">
              Add your store link for live context.
            </p>
          </div>
        )}
      </div>

      {/* ── Error messages ── */}
      {error && (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}
      {fileError && (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {fileError}
        </div>
      )}

      {/* ── Input consistency warning (from analysis result) ── */}
      {result?.input_consistency?.warning && (
        <div
          className={`mt-2 rounded-2xl border px-4 py-3 text-xs ${
            result.input_consistency.consistencyLevel === "LOW"
              ? "border-red-200 bg-red-50 text-red-700"
              : result.input_consistency.consistencyLevel === "MEDIUM"
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {result.input_consistency.warning}
        </div>
      )}

      {/* ── Submit row ── */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400 sm:pr-4">
          Powered by Groq + {modelLabel}
        </p>
        <button
          className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 sm:w-auto"
          onClick={onRunAnalysis}
          disabled={!canAnalyze}
        >
          {loading ? "Analyzing…" : "Analyze with AI"}
        </button>
      </div>
    </div>
  );
}