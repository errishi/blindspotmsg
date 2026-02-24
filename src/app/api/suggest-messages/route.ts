import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = rawBody.trim() ? JSON.parse(rawBody) : {};

    const hasMessages = Object.prototype.hasOwnProperty.call(body, "messages");
    if (hasMessages && !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          name: "ValidationError",
          message: "'messages' must be an array",
        },
        { status: 400 },
      );
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];

    const systemPrompt =
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What's a hobby you've recently started? || If you could have dinner with any historical figure, who would it be? || What's a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: messages as any,
    });

    // Using the exact return method your installed package supports
    return result.toUIMessageStreamResponse();
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
