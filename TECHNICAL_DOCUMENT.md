# MERCHANTLENS — Technical Document

**AI Representation Optimizer for E-Commerce · Kasparro Lab Hackathon**

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Groq API · LLaMA 3.3 70B Versatile

---

# 01. System Architecture & Data Flow

MerchantLens is a stateless Next.js 16 application with three serverless API routes.

There is no persistent database, no authentication layer, and no external data store — all analysis state lives in the browser for the session duration.

This was a deliberate architectural choice: zero infrastructure overhead means the tool is instantly deployable and requires no backend provisioning.

## Component Map

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend SPA | Next.js 16 App Router + React 19 | Input collection, state management, tab/sidebar routing, export |
| Analysis API | `POST /api/analyze` | URL scraping, LLM call, JSON parse, response to client |
| File API | `POST /api/analyze-file` | Multipart upload, text extraction (PDF/DOCX/XLSX/CSV/JSON), OCR fallback |
| Toolkit APIs | `POST /api/trust_check`, `/api/policy_analyze`, `/api/schema` | Dedicated single-purpose LLM tools in the Toolkit panel |
| AI Engine | Groq API — LLaMA 3.3 70B Versatile | Structured JSON generation against a strict five-dimension schema |

---

## Request Flow — URL Mode

| Step | What Happens | Handled By |
|---|---|---|
| 1 | User submits store URL, description, or file | `InputCard.tsx` (client) |
| 2 | File bytes decoded; images sent to Tesseract.js OCR; documents sent to `/api/analyze-file` for text extraction | `analyze/page.tsx` + `/api/analyze-file` |
| 3 | All inputs merged into a single combined string; mode set to description if any text present, else url | `runAnalysis()` in `page.tsx` |
| 4 | If URL-only: server fetches page HTML, strips scripts/styles/tags, slices to 15,000 chars | `/api/analyze` route — `fetchPageText()` |
| 5 | Merged content sent to Groq with strict JSON system prompt; `temperature = 0.2` | Groq SDK — LLaMA 3.3 70B |
| 6 | Response regex-matched for JSON block, parsed, returned as `AnalysisResult` | `/api/analyze` route |
| 7 | Client renders scored dashboard across 6 tabs; entry appended to session history | `OverviewTab`, `IssuesTab`, etc. |

---

# 02. What the LLM Does vs. What Deterministic Code Handles

We drew a clear line: the LLM is responsible only for evaluation and generation tasks where judgment is required and where errors are visible and recoverable.

Everything structural — routing, parsing, rendering, validation, export — is deterministic TypeScript.

---

## LLM Handles (Judgment Required)

- Score all five dimensions (0–100) based on inferred quality of evidence
- Generate severity-ranked issue list with root-cause descriptions
- Produce ranked action plan ordered by impact-to-effort ratio
- Write AI perception snapshot and strengths/weaknesses narrative
- Identify gaps between AI perception and inferred merchant intent
- Rewrite product descriptions in an AI-optimised format (description mode only)
- Assess input consistency across multi-source submissions

---

## Deterministic Code Handles (No AI Needed)

- Input validation: file size, extension whitelist, character limits
- HTML scraping: lightweight HTML sanitization and content extraction; 15k char clip
- File text extraction: `pdf-parse`, `mammoth`, `xlsx` — no LLM involved
- OCR for image uploads via Tesseract.js (client-side)
- Error classification and user-friendly message mapping
- Score-to-color mapping, status chip logic, confidence derivation
- Export: Markdown build, JSON serialisation, PDF HTML generation
- History management, tab routing, theme persistence (`localStorage`)

---

## Why this split?

Structured prompt engineering with a strict JSON schema gives us explainable, auditable outputs using low-latency inference through Groq’s hosted infrastructure.

Adding AI to routing, parsing, or export would introduce non-determinism with zero added value and significantly more failure modes.

---

# 03. Key Implementation Decisions

## Strict JSON Schema Prompting

The entire analysis depends on a single Groq API call returning a valid, fully-typed JSON object.

We invested heavily in the system prompt — a detailed system prompt defining exact field names, value ranges, enum constraints, and prohibition on markdown or backticks.

Temperature is fixed at `0.2` across all routes to minimise hallucination drift while retaining enough variance for useful language.

The prompt explicitly states:

> “Do not invent policies, features, reviews, certifications, or trust signals not implied by the input. If information is missing or uncertain, be conservative and reduce scores accordingly.”

This prevents the model from fabricating trust signals — a real risk when the input is sparse.

---

## Multi-Input Consistency Validation

When a user submits two or three inputs simultaneously (description + URL + file), the inputs may not belong to the same store.

We address this by asking the LLM to populate an `input_consistency` object in every response — returning a `consistencyLevel` (`HIGH / MEDIUM / LOW`), a human-readable warning, and a list of detected mismatches.

The client surfaces this as a coloured banner before the score renders.

This prevents merchants from receiving a unified score built on contradictory data.

---

## No Shopify API — URL Scraping Instead

Deep Shopify integration would require OAuth, webhook setup, and store-level permissions — shifting the entire MVP from diagnostics to auth infrastructure.

Instead, the server fetches the raw HTML of any submitted URL, strips scripts/styles/comments, and clips to 15,000 characters before sending to the LLM.

This provides most of the analytical value while significantly reducing implementation complexity and works on any e-commerce platform, not just Shopify.

---

## Client-Side State, No Auth, No DB

Analysis history is stored in React state (not `localStorage` or a database).

This was intentional: it keeps the product fully stateless, instantly deployable to Vercel, and free of GDPR and data residency concerns in an MVP.

The tradeoff is that history is lost on page reload — an acceptable limitation documented in Known Limitations below.

---

## User-Supplied API Key Support

Every analysis route accepts an optional `apiKey` parameter.

If provided, it instantiates a separate Groq client with the caller's key rather than the server default.

This allows power users to use their own quota without any backend changes.

The key is stored in `localStorage` under the `merchantlens_api_key` key and is never logged server-side.

---

# 04. Failure Handling & System Degradation

| Failure Mode | What Triggers It | How We Handle It |
|---|---|---|
| LLM returns malformed JSON | Model wraps JSON in markdown, truncates output, or emits preamble text | `tryParseJson()` attempts to extract and parse the JSON block. If it fails, the system retries once — passing the bad response back as context with an explicit correction prompt at `temperature 0.1`. Only if the retry also fails is a 500 returned to the client. No crash, no raw dump to UI. |
| LLM returns empty response | Groq timeout, content filter, or model error | Explicit empty-string check before any parsing. Returns 500 with actionable message. Client maps this via `friendlyError()` to a plain-English banner — the user never sees a stack trace. |
| URL fetch fails or times out | Site blocks bots, requires login, returns non-HTML, or DNS fails | `fetchPageText()` wraps fetch in `AbortController` with 12s timeout. Non-200 status, wrong content-type, or `<100 chars` of content each throw descriptive errors. |
| File upload fails extraction | PDF has no text layer, DOCX is corrupt, XLSX is empty | `/api/analyze-file` writes to a temp dir and cleans up in a `finally` block regardless of outcome. Empty extraction returns `400: "No readable text found in this file."` |
| OCR failure | Image contains unreadable or noisy text | Image files are processed client-side via Tesseract.js before any API request is made. Blank OCR output immediately surfaces a user-friendly error. |
| Rate limit or quota exceeded | `429` from Groq, quota exhausted | `friendlyError()` detects `"429"`, `"rate limit"`, `"quota"`, `"billing"` patterns and returns actionable messages like `"Too many requests — please wait."` |
| Network error / fetch fails entirely | User offline, DNS failure, request interruption | Outer catch block handles network failures and resets loading state in the `finally` block to prevent UI lockups. |
| Input is blank | User clicks Analyze without providing input | Client-side guard disables analysis. Server also validates and returns a `400` for invalid submissions. |
| File type or size violation | Unsupported extension or file > 10 MB | Client validates extension and size before upload. Displays dismissible error banner without making server request. |

---

## Error Sanitization Policy

All errors — whether from Groq, the filesystem, or the network — are funnelled through a single `friendlyError()` function before touching the UI.

The function pattern-matches against several known error categories and returns fixed plain-English messages.

No raw API error messages, JSON dumps, stack traces, or HTTP status codes appear in the user interface.

Unexpected failures fall back to:

> “Something went wrong. Please try again, or contact support if the issue persists.”

---

# 05. Known Limitations

| Limitation | Root Cause | Impact |
|---|---|---|
| Analysis history is lost on refresh | State stored in React state only | Low — history is session-only |
| URL scraping fails on JavaScript-rendered stores | Server fetch only receives initial HTML | Medium — affects some headless storefronts |
| LLM scores are non-deterministic | Temperature `0.2` still allows minor variation | Low — scores are directional diagnostics |
| OCR accuracy degrades on poor images | Tesseract.js struggles with noisy scans | Low — image uploads are secondary inputs |
| Toolkit FAQ Builder uses a lightweight template system | Avoided additional API costs during MVP | Low — full LLM-powered FAQ generation planned later |

---

# 06. What We Would Improve With More Time

## Short-Term (Days)

- Persist analysis history to `localStorage`
- Replace FAQ Builder with live LLM generation
- Add confidence intervals to score outputs

---

## Medium-Term (Weeks)

- Streaming LLM responses
- Dual-prompt blended scoring
- Webhook-triggered re-analysis

---

## Architecture-Level (Longer Term)

- Persistent backend with Postgres
- Multi-model routing fallback
- Fine-tuned merchant scoring model
- Real AI shopping-agent simulation pipeline

---

# Design Philosophy

We deliberately avoided multi-agent pipelines, vector databases, and fine-tuned models — not because we could not build them, but because they would not have improved the core diagnostic experience.

A merchant receiving a score of `58/100` with three specific, ranked, plain-language fixes gains more value than one receiving an opaque agent simulation with no actionable output.

Every architectural decision was made in service of one constraint:

- make the AI's judgment transparent
- make the output actionable
- make failure modes visible rather than hidden