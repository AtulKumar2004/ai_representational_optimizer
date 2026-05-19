# Decision Log

---

## 1. Single LLM call vs multi-agent pipeline

### Considered
Using multiple AI agents for scoring, recommendations, and perception analysis separately.

### Chose
A single structured LLM analysis pipeline.

### Because
A single-pass architecture reduced latency, simplified state management, lowered cost, and avoided orchestration complexity during the hackathon timeframe.

---

## 2. Stateless architecture vs authentication/database

### Considered
Building full authentication, user accounts, and persistent report history.

### Chose
A stateless architecture without authentication or a database.

### Because
The core problem was AI readiness diagnostics, not account management. Avoiding auth reduced engineering overhead and kept focus on merchant analysis quality.

---

## 3. Groq + LLaMA vs proprietary paid models

### Considered
Using OpenAI or Anthropic APIs.

### Chose
Groq + LLaMA 3.3 70B.

### Because
Groq provided fast inference, generous free-tier experimentation, and predictable structured JSON performance suitable for rapid prototyping.

---

## 4. Structured JSON responses vs freeform text

### Considered
Rendering raw AI-generated markdown reports.

### Chose
Strict JSON schema responses.

### Because
Structured JSON made the frontend deterministic, enabled modular dashboard rendering, and simplified export generation and validation.

---

## 5. Multi-input analysis support

### Considered
Restricting users to only a store URL.

### Chose
Supporting product descriptions, URLs, and uploaded files together.

### Because
Merchants often have incomplete storefronts during setup. Multi-input support improved flexibility and allowed richer AI analysis even with partial information.

---

## 6. Lightweight toolkit vs advanced automation

### Considered
Building autonomous optimization agents that directly modify store content.

### Chose
A lightweight merchant toolkit focused on diagnostics and guidance.

### Because
We prioritized explainability and actionable recommendations over risky automated modifications during the MVP phase.

---

## 7. OCR + document parsing support

### Considered
Supporting only text inputs.

### Chose
Adding OCR and document parsing for uploaded merchant files.

### Because
Many merchants store policies, catalogs, and FAQs in PDFs or screenshots rather than structured storefront pages.

---

## 8. No vector database / RAG pipeline

### Considered
Adding embeddings, retrieval pipelines, and vector search.

### Chose
A prompt-engineered direct analysis approach.

### Because
The project focused on diagnostic quality and fast iteration. Retrieval infrastructure added complexity without significant MVP value for the current scope.