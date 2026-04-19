"use client";

import { useState } from 'react';
import CalendarButton from '@/components/CalendarButton';
import QuickStarts from '@/components/QuickStarts';

export default function ChatPanel({ onItineraryUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setItinerary(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage = { role: 'assistant', content: "Here is your suggested itinerary." };
      setMessages((prev) => [...prev, assistantMessage]);
      setItinerary(data);
      if (onItineraryUpdate) onItineraryUpdate(data);

    } catch (err) {
      const errorMessage = { role: 'assistant', content: `Error: ${err.message}` };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full basis-0 flex-grow rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 p-4 text-center">
            <h3 className="font-medium text-gray-700 mb-1">Tell me about your dream Andaman trip!</h3>
            <p className="text-gray-500 text-sm mb-4">Mention duration, budget, companions, and interests.</p>
            <QuickStarts onSelect={(t) => setInput(t)} />
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 text-gray-800 self-start'}`}>
            <p className="text-xs font-semibold mb-1 opacity-75">{m.role === 'user' ? 'You' : 'Andaman AI'}</p>
            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="p-3 rounded-xl bg-gray-100 text-gray-500 self-start text-sm italic max-w-[85%]">
            Thinking...
          </div>
        )}
        {itinerary && (
          <div className="w-full flex-col flex gap-2">
            <div className="p-4 rounded-xl bg-green-50 text-green-900 border border-green-200 text-sm self-start w-full">
              <p className="font-bold mb-2">Itinerary generated!</p>
              <p className="mb-2 italic">{itinerary.summary}</p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium mb-1 line-clamp-1">View Budget Details</summary>
                <div className="mt-2 pl-4 border-l-2 border-green-300">
                  <p>Total Budget: <span className="font-semibold">{itinerary.total_budget}</span></p>
                  <p className="mt-2 font-semibold">Important Notes:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {itinerary.important_notes?.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              </details>
            </div>
            {/* Minimal Itinerary Preview */}
            <div className="flex flex-col gap-2 mt-2 w-full">
              {itinerary.days?.map((d) => (
                 <div key={d.day} className="p-3 border border-gray-200 rounded-lg text-sm bg-gray-50">
                   <p className="font-bold text-blue-900">Day {d.day}: {d.title}</p>
                   <p className="text-gray-600 font-medium mb-2">{d.location}</p>
                   {d.places?.map((p, i) => (
                     <p key={i} className="text-gray-800 ml-2 border-l-2 border-blue-200 pl-2 mb-1">
                       <span className="font-semibold">{p.time}</span> - {p.name}
                     </p>
                   ))}
                 </div>
              ))}
            </div>
            <CalendarButton itinerary={itinerary} />
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-black placeholder-gray-400 bg-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 5 days, couple, 30k budget..."
            disabled={loading}
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            disabled={loading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
