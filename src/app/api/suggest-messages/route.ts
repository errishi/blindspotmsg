import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let prompt = "Generate suggested anonymous conversation starters.";

    if (rawBody.trim()) {
      try {
        const body = JSON.parse(rawBody) as {
          prompt?: unknown;
          input?: unknown;
        };

        if (typeof body.prompt === "string" && body.prompt.trim()) {
          prompt = body.prompt.trim();
        } else if (typeof body.input === "string" && body.input.trim()) {
          prompt = body.input.trim();
        }
      } catch {
        // If body is not JSON, treat it as a plain text prompt.
        prompt = rawBody.trim();
      }
    }

    const systemPrompt =
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What's a hobby you've recently started? || If you could have dinner with any historical figure, who would it be? || What's a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("API Route Error:", error);

    const parsedError =
      typeof error === "object" && error !== null
        ? (error as { name?: string; message?: string; status?: unknown })
        : {};

    const isJsonSyntaxError = error instanceof SyntaxError;
    const statusCode =
      typeof parsedError.status === "number"
        ? parsedError.status
        : isJsonSyntaxError
          ? 400
          : 500;

    return NextResponse.json(
      {
        name: parsedError.name || "Error",
        message:
          parsedError.message ||
          (isJsonSyntaxError
            ? "Invalid JSON body"
            : "An unexpected error occurred"),
      },
      { status: statusCode },
    );
  }
}
