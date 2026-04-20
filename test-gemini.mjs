import { GoogleGenerativeAI } from '@google/generative-ai';

// We use the same parameters as lib/gemini.js
const MODEL_NAME = "gemini-2.5-flash-lite"; // Note: User swapped to Gemini 3.1 Pro (High) in chat, but our code specifies gemini-2.5-flash-lite! Wait!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key-to-prevent-crash");

const systemPrompt = `You are an expert Andaman & Nicobar Islands travel assistant with deep 
local knowledge. You help travelers plan complete, practical itineraries.

ANDAMAN KNOWLEDGE BASE:
- Main islands: South Andaman (Port Blair), Havelock (Swaraj Dweep), 
  Neil Island (Shaheed Dweep), Baratang, Long Island, Little Andaman
- Ferry routes: Port Blair ↔ Havelock (govt ferry: 2.5hr, Makruzz: 90min)
  Port Blair ↔ Neil (1.5-2hr), Havelock ↔ Neil (1hr)
- Permit required: Restricted areas need RAP/PAP permits
- Best season: Oct–May (avoid Jun–Sep monsoon)
- Key beaches: Radhanagar (Havelock), Elephant Beach, Corbyn's Cove, 
  Vijaynagar, Bharatpur, Laxmanpur
- Activities: Scuba diving (Havelock, Neil), snorkeling, sea walk, 
  glass-bottom boats, trekking (Mt Harriet, Saddle Peak), 
  Cellular Jail light show, Baratang limestone caves/mudvolcano
- Budget tiers: Budget ₹2-3k/day, Mid ₹4-6k/day, Luxury ₹8k+/day

RESPONSE FORMAT:
Always return itineraries as structured JSON with this schema. Return ONLY the JSON object, do not include any markdown formatting, preamble, or postscript.
{
  "summary": "...",
  "days": [
    {
      "day": 1,
      "title": "...",
      "location": "Port Blair",
      "places": [
        { "name": "...", "time": "9:00 AM", "duration": "2 hours", 
          "description": "...", "tips": "..." }
      ],
      "transport": "...",
      "estimated_cost": "₹..."
    }
  ],
  "total_budget": "₹...",
  "important_notes": ["..."]
}`;

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: systemPrompt,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  }
});

async function run() {
  try {
    const chat = model.startChat({ history: [] });
    console.log("Sending message...");
    const result = await chat.sendMessage("Plan a 3-day trip to Port Blair");
    const responseText = result.response.text();
    console.log("----- RAW RESPONSE -----");
    console.log(responseText);
    console.log("------------------------");
    
    let cleanText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log("Regex matched a markdown code block.");
      cleanText = jsonMatch[1];
    }
    
    try {
        const parsed = JSON.parse(cleanText);
        console.log("Parse SUCCESS");
        if (!parsed.summary || !Array.isArray(parsed.days)) {
            console.error("Validation FAILED: Missing summary or days");
        } else {
            console.log("Validation SUCCESS");
        }
    } catch (e) {
        console.error("Parse FAILED:", e.message);
    }
  } catch (error) {
    console.error("API Error:", error);
  }
}

run();
