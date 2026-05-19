# MERCHANTLENS

## AI Representation Optimizer for E-Commerce

**Product Document**  
Kasparro Lab Hackathon — Track 5 (Advanced)

**Stack:**  
Next.js 16 · TypeScript · Tailwind CSS · Groq API · LLaMA 3.3 70B

---

# 01. The Problem

AI shopping agents — ChatGPT Shopping, Perplexity, Google SGE — are reshaping how users discover products.

Instead of browsing, users now ask questions like:

> “What are the best sustainable shoes under $100?”

These systems rely entirely on merchant-provided data:
- product descriptions
- FAQs
- structured markup
- policies
- trust signals

When that information is incomplete or ambiguous, AI systems either:
- skip the merchant entirely
- or misrepresent them

This creates a growing visibility problem for SMB merchants.

## Key Observations

| Observation | Why It Matters |
|---|---|
| Many SMB merchants lack structured product data | AI systems struggle to confidently represent products |
| AI visibility is becoming a competitive advantage | Discovery is shifting from search to AI recommendations |
| Limited AI readiness tooling exists today | Merchants lack diagnostics for AI representation quality |
| AI commerce is rapidly growing | Merchants need visibility into how AI systems perceive them |

Most merchants optimise for SEO and human shoppers. Very few tools help merchants optimise for AI-driven commerce discovery.

---

# 02. Our Solution

MerchantLens is a diagnostic platform that shows merchants how AI shopping agents currently perceive their stores — and provides a ranked action plan to improve representation quality.

## Core Capabilities

| Capability | Description |
|---|---|
| AI Readiness Score | Five-dimension scoring across product clarity, FAQ coverage, trust signals, policy completeness, and structured data |
| Top Issues Dashboard | Severity-ranked issues with plain-language explanations and root-cause context |
| Ranked Action Plan | Prioritised recommendations ordered by impact-to-effort ratio |
| AI Perception View | Narrative summary of how AI systems currently interpret the store |
| Perception vs Intent | Gap analysis comparing AI perception with intended merchant positioning |
| Multi-Format Input | Supports store URLs, product descriptions, and uploaded documents |

---

# 03. Core User Journey

| Step | Description |
|---|---|
| Step 1 — Input | Merchant submits a store URL, product description, or uploaded policy document |
| Step 2 — Validation | System validates that inputs belong to the same merchant context |
| Step 3 — Analysis | LLM evaluates trust signals, FAQ quality, structured data, policy completeness, and product clarity |
| Step 4 — Dashboard | Merchant receives a scored diagnostic dashboard with issues, recommendations, AI insights, and gap analysis |
| Step 5 — Optimization | Merchant uses toolkit features including schema generation, policy analysis, trust checks, and export |

---

# 04. Key Product Decisions

## Diagnostic Layer Instead of Full Agent Simulation

We intentionally scoped the project around diagnostics rather than building a full AI shopping-agent simulator.

The core merchant problem was understanding visibility gaps — diagnostics were more actionable, easier to explain, and aligned directly with the challenge problem.

---

## Product Clarity Over AI Complexity

We deliberately avoided:
- vector databases
- multi-agent pipelines
- fine-tuning infrastructure

Strict prompt engineering with structured JSON outputs produced more reliable and explainable merchant-facing results.

---

## Consistency Validation Before Analysis

Users may provide multiple inputs:
- URLs
- descriptions
- uploaded files

These inputs may conflict.

We added consistency validation before generating unified reports to prevent misleading outputs and improve merchant trust.

---

## Multi-Format Input Support

Merchant information often exists across:
- storefront pages
- PDFs
- policy documents
- copied descriptions

Supporting all three formats made the product significantly closer to real merchant workflows.

---

## No Shopify API in MVP

We intentionally avoided deep Shopify API integration.

URL-based analysis provided most of the diagnostic value while dramatically reducing implementation complexity and authentication overhead.

---

## No Authentication in MVP

Authentication and persistent accounts were intentionally excluded.

The team prioritised:
- analysis quality
- dashboard polish
- AI workflows
- merchant usability

instead of infrastructure-heavy account systems.

---

# 05. Tradeoffs

| Tradeoff | What We Chose | Why |
|---|---|---|
| Breadth vs Depth | Fewer polished workflows | Better merchant experience over many shallow utilities |
| Real-time integration vs Speed | Lightweight URL analysis | Faster development and lower infrastructure complexity |
| Technical complexity vs UX | Simple AI architecture | More explainable outputs and faster iteration |

---

# 06. Target Users

## Primary User

Small-to-mid-sized Shopify and D2C merchants with:
- content-heavy product pages
- SEO-focused workflows
- growing dependence on AI-driven discovery

Especially merchants who:
- optimise for SEO but lack AI visibility
- manually write product descriptions
- do not understand how AI systems interpret their stores
- want stronger placement in AI-assisted shopping recommendations

---

## Current Market Gap

| Exists Today | Missing |
|---|---|
| SEO tools | AI readiness audits |
| Ad analytics | AI perception diagnostics |
| CRO platforms | Agent gap analysis |
| Social tools | Structured AI visibility checks |

---

# 07. Technical Architecture

| Capability | Description |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| AI Engine | Groq API using LLaMA 3.3 70B with strict structured prompting |
| Analysis Pipeline | Five-dimension scoring rubric with structured JSON parsing |
| Input Handling | URLs, descriptions, PDFs, DOCX, TXT uploads |
| State Management | Client-side session state with lightweight history |

---

# 08. Final Outcome

MerchantLens demonstrates that AI representation optimization is an emerging and underserved merchant problem.

The platform delivers:
- visibility into AI perception
- structured AI readiness diagnostics
- ranked action plans
- trust signal analysis
- perception-vs-intent gap analysis
- merchant-friendly workflows with minimal infrastructure

Our goal was not to build the most technically complex AI system.

Our goal was to build a thoughtful, practical, and usable product that helps merchants understand and improve how AI systems represent them.