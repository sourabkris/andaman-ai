"use client";

import { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import MapPanel from '@/components/MapPanel';

export default function Home() {
  const [itinerary, setItinerary] = useState(null);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'map'

  return (
    <main className="flex flex-col h-[100dvh] w-full bg-gray-50 text-black p-3 sm:p-4 md:p-6 lg:p-8">
      <header className="mb-3 md:mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 tracking-tight drop-shadow-sm">Andaman AI</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">Your Smart Island Travel Companion</p>
        </div>
      </header>
      
      {/* Mobile Tab Toggle */}
      <div className="lg:hidden flex bg-gray-200/80 p-1 mb-3 shrink-0 rounded-xl">
        <button 
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${mobileTab === 'chat' ? 'bg-white shadow-sm text-blue-700 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
        >
          Planner
        </button>
        <button 
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out ${mobileTab === 'map' ? 'bg-white shadow-sm text-blue-700 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
        >
          Map View
        </button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left column: Chat / Planner */}
        <section className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[450px] flex-col h-full min-h-0 shrink-0`}>
          <ChatPanel onItineraryUpdate={setItinerary} />
        </section>

        {/* Right column: Map panel */}
        <section className={`${mobileTab === 'map' ? 'flex' : 'hidden'} lg:flex flex-1 bg-white border border-gray-200 rounded-2xl items-center justify-center overflow-hidden shadow-sm shadow-gray-100 flex-col relative`}>
          <MapPanel itinerary={itinerary} />
        </section>
      </div>
    </main>
  );
}
