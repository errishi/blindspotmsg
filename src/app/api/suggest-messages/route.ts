import { streamText, convertToModelMessages  } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // We store your prompt here to pass it as the 'system' instruction
    const systemPrompt = "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for anonymous social messaging platform, like Qooh.me and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What's a hobby you've recently started? || If you could have dinner with any historical figure, who would it be? || What's a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    const result = streamText({
      model: openai("gpt-3.5-turbo"), 
      system: systemPrompt,
      messages:  await convertToModelMessages(messages),
    });

    // Return the stream to the client
    return result.toUIMessageStreamResponse();
    
  } catch (error: any) {
    console.error("An unexpected error occurred", error);
    
    // Simplified error handling that catches both OpenAI and standard errors
    return NextResponse.json(
      { 
        name: error.name || "Error", 
        message: error.message || "An unexpected error occurred" 
      }, 
      { status: error.status || 500 }
    );
  }
}