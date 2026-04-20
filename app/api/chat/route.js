import { NextResponse } from "next/server";
import { getTravelModel } from "@/lib/gemini";

export const maxDuration = 60; // Increase timeout for long-running Gemini calls
export const runtime = 'nodejs';

// Simple in-memory rate limiting (IP -> { count, resetTime })
const ipRateLimit = new Map();

/**
 * Handle POST request for generating travel itineraries.
 * Includes security checks for payload size and type validation.
 */
export async function POST(req) {
  try {
    // Security: Simple rate limiting based on IP or fallback header
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    if (ip !== 'unknown') {
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 10;
      
      const record = ipRateLimit.get(ip);
      
      if (record && record.resetTime > now) {
        if (record.count >= maxRequests) {
          return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
        }
        record.count++;
      } else {
        ipRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      }
    }

    const body = await req.json();
    const { message, history } = body;

    // Security: Input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required and must be a string." }, { status: 400 });
    }
    
    // Security: Limit input length to prevent abuse
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long. Please keep it under 2000 characters." }, { status: 413 });
    }
    
    // Security: Limit history length
    if (history && (!Array.isArray(history) || history.length > 50)) {
      return NextResponse.json({ error: "Chat history too long or invalid format." }, { status: 413 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy-key-to-prevent-crash") {
      console.error("GEMINI_API_KEY is missing or invalid");
      return NextResponse.json({ error: "Configuration Error: GEMINI_API_KEY is missing." }, { status: 500 });
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
    const responseText = result.response.text();
    
    let jsonResponse;
    try {
      // With responseSchema strictly enforced by Gemini, parsing is deterministic.
      jsonResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("Gemini Parsing/Validation Error:", e);
      return NextResponse.json({ 
        error: "The AI response could not be parsed correctly.",
        details: process.env.NODE_ENV === 'development' ? responseText : undefined
      }, { status: 500 });
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Chat API error details:", error);
    const errorMsg = error.message || "An unexpected error occurred";
    return NextResponse.json({ error: `Gemini API Error: ${errorMsg}` }, { status: 500 });
  }
}
