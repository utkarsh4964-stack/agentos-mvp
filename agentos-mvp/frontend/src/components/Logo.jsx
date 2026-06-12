export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="7" fill="#13161B" stroke="#23272E" />
        <circle cx="9" cy="16" r="2.6" fill="#7C5CFF" />
        <circle cx="16" cy="9" r="2.6" fill="#FF8A4C" />
        <circle cx="16" cy="23" r="2.6" fill="#FF8A4C" />
        <circle cx="23" cy="16" r="2.6" fill="#7C5CFF" />
        <path
          d="M11.3 14.8L13.8 11.4M11.3 17.2L13.8 20.6M18.2 11.4L20.7 14.8M18.2 20.6L20.7 17.2"
          stroke="#9AA3AE"
          strokeWidth="1.3"
        />
      </svg>
      <span className="font-display font-semibold text-lg tracking-tight text-paper">
        Agent<span className="text-signal">OS</span>
      </span>
    </div>
  );
}
