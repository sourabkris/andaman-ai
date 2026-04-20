/**
 * Pre-defined trip templates.
 */
const TEMPLATES = [
  "5-day honeymoon package, luxury",
  "3-day budget backpacker",
  "7-day family trip with kids",
  "Adventure week (scuba + trekking)"
];

/**
 * Renders quick start suggestion buttons for users to quickly populate the chat input.
 * @param {Object} props
 * @param {(template: string) => void} props.onSelect - Callback when a template is selected
 */
export default function QuickStarts({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {TEMPLATES.map((t, i) => (
        <button
          key={i}
          onClick={() => onSelect(t)}
          aria-label={`Plan trip: ${t}`}
          className="text-sm bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 md:px-4 md:py-2 rounded-full border border-gray-200 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-95"
        >
          {t}
        </button>
      ))}
    </div>
  );
}
