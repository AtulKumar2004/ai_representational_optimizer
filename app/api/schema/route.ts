import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    const completion =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",

            content: `
Generate ONLY valid JSON-LD schema.org Product markup.

Rules:
- Return ONLY JSON
- Dynamically infer fields from description
- Include useful attributes
- Include brand/category if possible
- Include offers object
- Include aggregateRating if relevant
`,
          },

          {
            role: "user",

            content: input,
          },
        ],

        temperature: 0.2,
      });

    const raw =
      completion.choices[0]?.message
        ?.content || "";

    return NextResponse.json({
      schema: raw,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Failed",
      },

      {
        status: 500,
      }
    );
  }
}