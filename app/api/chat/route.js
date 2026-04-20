import { NextResponse } from "next/server";
import { getTravelModel } from "@/lib/gemini";

export const maxDuration = 60; // Increase timeout for long-running Gemini calls

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy-key-to-prevent-crash") {
      console.error("GEMINI_API_KEY is missing or invalid");
      return NextResponse.json({ error: "Configuration Error: GEMINI_API_KEY is missing. Please check your environment variables." }, { status: 500 });
    }

    const model = getTravelModel();
    
    const formattedHistory = history?.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    })) || [];

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    let responseText = result.response.text();
    
    let jsonResponse;
    try {
      // 1. Try to find JSON inside markdown blocks
      let cleanText = responseText.trim();
      const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        cleanText = jsonMatch[1].trim();
      } else {
        // 2. Fallback: find the first { and last }
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }
      }
      
      jsonResponse = JSON.parse(cleanText);
      
      // Basic validation
      if (!jsonResponse.summary || !Array.isArray(jsonResponse.days)) {
        throw new Error("Missing required fields in AI response");
      }
    } catch (e) {
      console.error("Gemini Parsing/Validation Error:", e);
      console.error("Raw Response Text that failed parsing:", responseText);
       return NextResponse.json({ 
         error: "The AI response was not in the expected format. Please try again.",
         details: process.env.NODE_ENV === 'development' ? responseText : undefined
       }, { status: 500 });
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Chat API error details:", error);
    // Expose the error message to help debugging (especially in local dev)
    const errorMsg = error.message || "An unexpected error occurred";
    return NextResponse.json({ error: `Gemini API Error: ${errorMsg}` }, { status: 500 });
  }
}
