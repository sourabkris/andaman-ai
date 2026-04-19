"use client";

import { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import MapPanel from '@/components/MapPanel';

export default function Home() {
  const [itinerary, setItinerary] = useState(null);

  return (
    <main className="flex flex-col h-screen w-full bg-gray-50 text-black p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Andaman AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your Smart Island Travel Companion</p>
        </div>
      </header>
      
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left column: Chat / Planner */}
        <section className="w-full lg:w-[450px] flex flex-col h-full min-h-0 shrink-0">
          <ChatPanel onItineraryUpdate={setItinerary} />
        </section>

        {/* Right column: Map panel */}
        <section className="hidden lg:flex flex-1 bg-white border border-gray-200 rounded-xl items-center justify-center overflow-hidden shadow-sm shadow-gray-100 flex-col">
          <MapPanel itinerary={itinerary} />
        </section>
      </div>
    </main>
  );
}
