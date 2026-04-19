"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function CalendarButton({ itinerary }) {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [successLink, setSuccessLink] = useState(null);

  const handleSave = async () => {
    if (!session) {
      signIn('google');
      return;
    }
    
    setSaving(true);
    setSuccessLink(null);

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSuccessLink("https://calendar.google.com");
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
       setSaving(false);
    }
  };

  if (!itinerary) return null;

  return (
    <div className="mt-4 w-full">
      {successLink ? (
        <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-200">
           ✅ Trip saved to your calendar! <a href={successLink} target="_blank" className="font-bold underline">View Calendar</a>
        </div>
      ) : (
        <button
           onClick={handleSave}
           disabled={saving}
           className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : (session ? "📆 Save to Google Calendar" : "📆 Sign in to Save Trip")}
        </button>
      )}
    </div>
  );
}
