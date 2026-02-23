import React from "react";
import clsx from "clsx";

const styles = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-slate-900 text-white border-slate-900",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  logged: "bg-sky-50 text-sky-700 border-sky-200"
};

export default function Badge({ tone = "low", children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[tone] ?? styles.low,
        className
      )}
    >
      {children}
    </span>
  );
}

