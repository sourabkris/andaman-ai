export default function QuickStarts({ onSelect }) {
  const templates = [
    "5-day honeymoon package, luxury",
    "3-day budget backpacker",
    "7-day family trip with kids",
    "Adventure week (scuba + trekking)"
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {templates.map((t, i) => (
        <button
          key={i}
          onClick={() => onSelect(t)}
          className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-full border border-gray-200 shadow-sm transition-colors cursor-pointer"
        >
          {t}
        </button>
      ))}
    </div>
  );
}
