/**
 * MedPredict logo: medical cross (+) with heart outline overlay.
 * Red (#B91C1C) by default; fits 40×40px container, scales via className.
 */
export default function MedPredictLogo({ className = 'w-10 h-10', color = '#6F1D1B' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Medical cross: horizontal and vertical bars */}
      <path
        d="M14 17h12v6H14z"
        fill={color}
      />
      <path
        d="M17 8h6v24h-6z"
        fill={color}
      />
      {/* Heart outline overlaid on cross center (compact, symmetric) */}
      <path
        d="M20 25.5s-6-4.5-6-8c0-2 1.5-3 3-3 1.2 0 2 1 2.5 2 .5-1 1.3-2 2.5-2 1.5 0 3 1 3 3 0 3.5-6 8-6 8z"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
