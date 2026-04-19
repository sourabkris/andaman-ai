# Andaman AI — Smart Island Travel Assistant

## 1. Chosen Vertical
**Travel / Tourism**
Andaman AI is a localized, context-aware smart travel assistant designed exclusively for the Andaman and Nicobar Islands. 

## 2. Approach and Logic
We combine advanced LLM reasoning, interactive mapping, and seamless scheduling to create an end-to-end travel planner. The application logic is divided into three key integrations:
1. **Itinerary Generation (Google Gemini)**: Next.js serverless API routes (`/api/chat`) interact with `gemini-1.5-flash` using a tailored system prompt. This enforces JSON-structured responses containing daily schedules, realistic budgets, and local Andaman domain knowledge (like Makruzz ferries and RAP permits).
2. **Dynamic Route Visualization (Google Maps)**: The frontend intercepts the JSON itinerary and uses the `@googlemaps/js-api-loader`. We dynamically query the `PlacesService` to geocode each location, map out custom markers (color-coded by day), and draw polylines to represent the travel route across the islands.
3. **Calendar Syncing (Google Calendar & NextAuth)**: To make the itinerary actionable, we integrated Google OAuth2 via `next-auth`. The `/api/calendar` route securely uses server-side access tokens with the `googleapis` library to batch-create Google Calendar events for the trip.

## 3. How the Solution Works
- **Step 1: User Input:** Visitors describe their trip (e.g., "5 days, couple, luxury budget") through the chat interface.
- **Step 2: AI Processing:** The Gemini API acts as a local expert, generating a highly structured, day-wise itinerary in JSON format.
- **Step 3: Map rendering:** The application parses the response, updates the UI, and simultaneously plots every generated place onto the Google Maps panel as an interactive route.
- **Step 4: Scheduling:** Users click "Save to Google Calendar". If they aren't signed in, NextAuth prompts a Google Sign-in. Once authenticated, the trip schedule is pushed directly into their primary Google Calendar with locations and reminders.

## 4. Assumptions Made
- **Ferry & Activity Timings:** Transport availability, specifically inter-island ferries (like Port Blair to Havelock), assumes standard seasonal schedules.
- **Costing:** Budget estimates are approximated in INR based on standard 2024-2025 rates.
- **Permit Protocols:** Assumes travelers will obtain necessary RAP (Restricted Area Permit) or PAP passes before executing the generated itinerary.
- **Consistent AI Generation:** The application relies on Gemini strictly adhering to the JSON schema defined in the system prompts.

## 5. Technology Stack & Size
* Built on **Next.js 14 App Router** + **Tailwind CSS**.
* **Footprint:** The source repository is highly optimized and stripped of unused assets, well under the 1MB repository size limit.

---
### Local Setup
1. Clone this repository.
2. Run `npm install`
3. Duplicate `/env.example` internally or configure `.env.local` directly with: `GEMINI_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET`.
4. Run `npm run dev` to start the app.
