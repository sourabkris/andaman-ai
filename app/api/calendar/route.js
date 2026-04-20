import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Handle POST request to add itinerary to Google Calendar.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to read the JSON payload
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { itinerary } = body;
    if (!itinerary || !Array.isArray(itinerary.days) || itinerary.days.length === 0) {
      return NextResponse.json({ error: "Invalid or empty itinerary data" }, { status: 400 });
    }

    // Security: Limit number of days (e.g. max 30) to prevent abuse
    if (itinerary.days.length > 30) {
      return NextResponse.json({ error: "Itinerary exceeds maximum allowed days." }, { status: 413 });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    
    // Calculate start date = tomorrow
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);

    const createdEvents = [];
    const failedEvents = [];

    // Process events
    for (const [index, day] of itinerary.days.entries()) {
      try {
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + index);
        const dateStr = eventDate.toISOString().split('T')[0];

        let description = `<b>Day ${day.day}: ${day.title}</b><br/>Location: ${day.location}<br/><br/>`;
        
        if (Array.isArray(day.places)) {
          for (const place of day.places) {
            description += `- <b>${place.time}</b>: ${place.name} (${place.duration})<br/><i>${place.description}</i><br/><br/>`;
          }
        }

        description += `<b>Transport:</b> ${day.transport}<br/><b>Estimated Cost:</b> ${day.estimated_cost}`;

        const event = {
           summary: `Andaman Trip: Day ${day.day} - ${day.title}`,
           location: `${day.location}, Andaman and Nicobar Islands`,
           description: description,
           colorId: String((day.day % 11) + 1), // Cycle through Google Calendar's 11 color IDs
           start: {
             date: dateStr,
             timeZone: "Asia/Kolkata",
           },
           end: {
             date: dateStr,
             timeZone: "Asia/Kolkata",
           },
           reminders: {
             useDefault: false,
             overrides: [
               { method: 'email', minutes: 24 * 60 },
               { method: 'popup', minutes: 60 }
             ]
           }
        };

        const result = await calendar.events.insert({
           calendarId: 'primary',
           resource: event,
        });
        
        createdEvents.push(result.data.htmlLink);
      } catch (insertError) {
        console.error(`Failed to create calendar event for Day ${day.day}:`, insertError);
        failedEvents.push(day.day);
      }
    }

    if (createdEvents.length === 0 && failedEvents.length > 0) {
      throw new Error("Failed to create any calendar events.");
    }

    return NextResponse.json({ 
      success: true, 
      events: createdEvents,
      failedDays: failedEvents.length > 0 ? failedEvents : undefined
    });

  } catch (error) {
    console.error("Calendar Save Error:", error);
    return NextResponse.json({ error: "Failed to save to calendar due to an internal error." }, { status: 500 });
  }
}
