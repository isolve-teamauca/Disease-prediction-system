import { useEffect } from 'react';

export default function Toast({ type = 'success', message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === 'error';
  const colorClasses = isError
    ? 'bg-red-600 text-white'
    : 'bg-emerald-600 text-white';

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`toast-slide-in shadow-lg rounded-xl px-4 py-3 flex items-start gap-3 ${colorClasses}`}
      >
        <div className="text-sm leading-snug">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white text-xs font-semibold"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

