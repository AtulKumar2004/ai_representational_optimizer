// app/api/trust-check/route.ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching ${url}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const html = await res.text();
    // Strip scripts, styles, and tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 12000);

    if (text.length < 100) {
      throw new Error("Page returned too little readable content.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { url } = body as { url?: string };

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Please provide a valid URL starting with http:// or https://" },
        { status: 400 }
      );
    }

    let pageText: string;
    try {
      pageText = await fetchPageText(url);
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "Failed to fetch URL.";
      return NextResponse.json(
        {
          error: `Could not fetch the page: ${msg}. The site may block bots or require login.`,
        },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are an e-commerce trust signal analyst. Analyze the provided webpage text and return ONLY valid JSON — no markdown, no backticks, no explanation.

Return EXACTLY this schema:
{
  "overallScore": <integer 0-100>,
  "summary": "<1-2 sentences>",
  "checks": [
    { "label": "Customer Reviews", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Refund / Return Policy", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Secure Checkout", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Shipping Transparency", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Contact Information", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Business Identity / About", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Social Proof / Testimonials", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" },
    { "label": "Trust Badges / Certifications", "status": "<Present|Missing|Partial>", "detail": "<under 100 chars>" }
  ]
}

Rules:
- "Present" = signal clearly exists. "Partial" = mentioned but lacking detail. "Missing" = not found.
- Be conservative. Do NOT assume signals exist if not evident in the text.
- Return ONLY the JSON object. No backticks. No markdown. No preamble.`,
        },
        {
          role: "user",
          content: `Analyze trust signals for:\nURL: ${url}\n\nExtracted page text:\n${pageText}`,
        },
      ],
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please retry." },
        { status: 500 }
      );
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in trust-check response:", rawText.slice(0, 300));
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please retry." },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("JSON parse failed:", jsonMatch[0].slice(0, 300));
      return NextResponse.json(
        { error: "AI returned malformed JSON. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("trust-check route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}