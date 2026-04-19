import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session || !session.accessToken) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itinerary } = await req.json();
    if (!itinerary || !itinerary.days) {
      return NextResponse.json({ error: "Invalid itinerary data" }, { status: 400 });
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

    for (const [index, day] of itinerary.days.entries()) {
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + index);
        const dateStr = eventDate.toISOString().split('T')[0];

        let description = `<b>Day ${day.day}: ${day.title}</b><br/>Location: ${day.location}<br/><br/>`;
        
        for (const place of day.places) {
            description += `- <b>${place.time}</b>: ${place.name} (${place.duration})<br/><i>${place.description}</i><br/><br/>`;
        }

        description += `<b>Transport:</b> ${day.transport}<br/><b>Estimated Cost:</b> ${day.estimated_cost}`;

        const event = {
           summary: `Andaman Trip: Day ${day.day} - ${day.title}`,
           location: `${day.location}, Andaman and Nicobar Islands`,
           description: description,
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
    }

    return NextResponse.json({ success: true, events: createdEvents });
  } catch (error) {
    console.error("Calendar Save Error:", error);
    return NextResponse.json({ error: "Failed to save to calendar" }, { status: 500 });
  }
}
