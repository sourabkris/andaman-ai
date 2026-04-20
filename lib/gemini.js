import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Verified 2026 models: "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.1-flash"
const MODEL_NAME = "gemini-2.5-flash-lite";

/**
 * Ensures a valid Gemini API Client is instantiated.
 * @type {GoogleGenerativeAI}
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key-to-prevent-crash");

/**
 * Standardized system prompt to guide the AI travel assistant behaviour.
 */
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
Always return itineraries strictly matching the defined JSON schema. Be highly descriptive but concise.`;

/**
 * Defines the strict JSON schema that Gemini must adhere to when generating responses.
 */
const itinerarySchema = {
  type: SchemaType.OBJECT,
  description: "A structured JSON response for a detailed travel itinerary.",
  properties: {
    summary: { type: SchemaType.STRING, description: "A brief, one sentence summary of the whole trip." },
    days: {
      type: SchemaType.ARRAY,
      description: "An array of daily itineraries.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          day: { type: SchemaType.INTEGER, description: "The day number, starting at 1." },
          title: { type: SchemaType.STRING, description: "A thematic title for the day." },
          location: { type: SchemaType.STRING, description: "The primary island or region for the day." },
          places: {
            type: SchemaType.ARRAY,
            description: "A list of places to visit on this day.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING, description: "Name of the place or activity." },
                time: { type: SchemaType.STRING, description: "Suggested start time." },
                duration: { type: SchemaType.STRING, description: "Estimated duration." },
                description: { type: SchemaType.STRING, description: "Engaging description of the place." },
                tips: { type: SchemaType.STRING, description: "Optional quick tip for this place." }
              },
              required: ["name", "time", "duration", "description"]
            }
          },
          transport: { type: SchemaType.STRING, description: "Suggested transportation for the day." },
          estimated_cost: { type: SchemaType.STRING, description: "Estimated cost for this specific day e.g., ₹2000." }
        },
        required: ["day", "title", "location", "places"]
      }
    },
    total_budget: { type: SchemaType.STRING, description: "Total estimated budget for the trip e.g., ₹25000." },
    important_notes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "A list of key travel tips and warnings."
    }
  },
  required: ["summary", "days", "total_budget"]
};

/**
 * Initialize and retrieve the generative model pre-configured with strict output schemas.
 * @returns {import("@google/generative-ai").GenerativeModel} The configured Gemini travel model.
 */
export const getTravelModel = () => {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: itinerarySchema,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });
};
