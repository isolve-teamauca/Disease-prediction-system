import React from "react";

export default function Logo({ subtitle = null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-soft grid place-items-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 12h4l2-5 3 10 2-6h7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <div className="text-xl font-semibold leading-tight">MedPredict</div>
        {subtitle ? <div className="text-sm text-slate-500 -mt-0.5">{subtitle}</div> : null}
      </div>
    </div>
  );
}

