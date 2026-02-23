import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  panelClassName = "",
  showCloseTextButton = true
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  const transitionMs = 160;
  const transitionStyle = useMemo(() => ({ transitionDuration: `${transitionMs}ms` }), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), transitionMs);
    return () => clearTimeout(t);
  }, [open, transitionMs]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <button
        className={[
          "absolute inset-0 bg-slate-900/30 transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        ].join(" ")}
        style={transitionStyle}
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={[
          "relative card transition-all",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
          panelClassName || "w-[min(520px,calc(100vw-32px))] p-6"
        ].join(" ")}
        style={transitionStyle}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            {showCloseTextButton ? (
              <button className="btn-ghost px-3 py-1.5" onClick={onClose} type="button">
                Close
              </button>
            ) : null}
            <button
              className="btn-ghost px-3 py-1.5"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

