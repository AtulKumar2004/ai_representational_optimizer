import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(
  req: Request
) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const { policy } = body as {
      policy?: string;
    };

    if (
      !policy ||
      typeof policy !==
        "string" ||
      policy.trim().length < 50
    ) {
      return NextResponse.json(
        {
          error:
            "Please paste a valid policy.",
        },
        {
          status: 400,
        }
      );
    }

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "llama-3.3-70b-versatile",

          temperature: 0.2,

          max_tokens: 2048,

          messages: [
            {
              role: "system",

              content: `You are an ecommerce policy compliance analyst.

Analyze the provided policy text and return ONLY valid JSON.

Return EXACTLY this schema:

{
  "score": <integer 0-100>,

  "summary": "<1-2 sentence summary>",

  "presentCount": <integer>,

  "missingCount": <integer>,

  "sections": [
    {
      "label": "Refund Policy",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Shipping Information",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Privacy Policy",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Return Window",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Contact Information",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Data Usage Transparency",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Cancellation Terms",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    },
    {
      "label": "Dispute Resolution",
      "status": "<Present|Missing|Partial>",
      "detail": "<under 100 chars>"
    }
  ]
}

Rules:
- "Present" means clearly defined
- "Partial" means vaguely mentioned
- "Missing" means absent
- Be conservative
- Return ONLY valid JSON
- No markdown
- No backticks
- No explanations`,
            },

            {
              role: "user",

              content: `Analyze this ecommerce policy:

${policy}`,
            },
          ],
        }
      );

    const rawText =
      completion.choices[0]
        ?.message?.content ?? "";

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "AI returned empty response.",
        },
        {
          status: 500,
        }
      );
    }

    const jsonMatch =
      rawText.match(
        /\{[\s\S]*\}/
      );

    if (!jsonMatch) {
      console.error(
        "No JSON found:",
        rawText
      );

      return NextResponse.json(
        {
          error:
            "AI returned invalid format.",
        },
        {
          status: 500,
        }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(
        jsonMatch[0]
      );
    } catch {
      console.error(
        "JSON parse failed:",
        jsonMatch[0]
      );

      return NextResponse.json(
        {
          error:
            "Malformed JSON returned by AI.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      parsed,
      {
        status: 200,
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Unexpected server error.";

    console.error(
      "policy-analyze route error:",
      message
    );

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}