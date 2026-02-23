import React, { useMemo, useState } from "react";
import { apiPost } from "../../lib/api.js";

const suggestions = [
  "What's my current health status?",
  "How can I reduce my diabetes risk?",
  "Tips for better sleep quality",
  "What exercises do you recommend?"
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm your AI Health Assistant. I can help you understand your health data, provide personalized recommendations, and answer questions about disease prevention. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { from: "me", text: msg }]);
    setSending(true);
    try {
      const res = await apiPost("/api/patient/assistant/chat", { message: msg });
      setMessages((m) => [...m, { from: "ai", text: res.answer }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">AI Health Assistant</div>
            <div className="text-sm text-slate-500">Get personalized health insights powered by AI</div>
          </div>
          <span className="text-xs font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1">
            Online
          </span>
        </div>

        <div className="mt-6 space-y-3 max-h-[420px] overflow-auto pr-2">
          {messages.map((m, idx) => (
            <div key={idx} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  m.from === "me" ? "bg-slate-900 text-white" : "bg-slate-50 border border-slate-100 text-slate-800"
                ].join(" ")}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-xs text-slate-500">Suggested questions:</div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button key={s} className="btn-ghost justify-start" onClick={() => send(s)} disabled={sending}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <input
            className="input"
            placeholder="Ask me anything about your health..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className="btn-primary px-5" onClick={() => send()} disabled={!canSend}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

