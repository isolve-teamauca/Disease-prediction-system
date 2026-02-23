import React, { useEffect, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import Badge from "../../components/Badge.jsx";
import { apiGet, apiPost } from "../../lib/api.js";

export default function HealthTracking() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    systolic: 120,
    diastolic: 80,
    heartRate: 72,
    bloodSugar: 98,
    weightKg: 78.2,
    sleepHours: 7.5,
    exerciseMinutes: 30,
    mood: "Good",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiGet("/api/patient/health-entries");
    setEntries(res.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      await apiPost("/api/patient/health-entries", { ...form, notes: form.notes || null });
      await load();
      setForm((f) => ({ ...f, notes: "" }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Topbar title="Health Tracking" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 lg:col-span-2">
          <div className="text-sm text-slate-500">Log Health Data</div>
          <div className="text-lg font-semibold mt-1">Vital Signs</div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Blood Pressure (Systolic)</label>
              <input className="input mt-2" type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Blood Pressure (Diastolic)</label>
              <input className="input mt-2" type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Heart Rate (bpm)</label>
              <input className="input mt-2" type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Blood Sugar (mg/dL)</label>
              <input className="input mt-2" type="number" value={form.bloodSugar} onChange={(e) => setForm({ ...form, bloodSugar: Number(e.target.value) })} />
            </div>
          </div>

          <div className="text-lg font-semibold mt-6">Lifestyle Metrics</div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Weight (kg)</label>
              <input className="input mt-2" type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Sleep (hours)</label>
              <input className="input mt-2" type="number" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Exercise (minutes)</label>
              <input
                className="input mt-2"
                type="number"
                value={form.exerciseMinutes}
                onChange={(e) => setForm({ ...form, exerciseMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Mood</label>
              <select className="select mt-2" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
                {["Great", "Good", "Okay", "Bad"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold">Notes (Optional)</label>
            <textarea className="input mt-2 min-h-[90px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="mt-6">
            <button className="btn-primary w-full h-12" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-sm text-slate-500">Quick Log</div>
          <div className="mt-3 space-y-2">
            {["Blood Pressure", "Heart Rate", "Blood Sugar", "Weight"].map((x) => (
              <button key={x} className="btn-ghost w-full justify-between">
                {x} <span className="text-slate-400">›</span>
              </button>
            ))}
          </div>

          <div className="mt-6 text-lg font-semibold">Recent Entries</div>
          <div className="mt-3 space-y-3">
            {entries.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{e.type}</div>
                  <Badge tone={e.tag}>{e.tag}</Badge>
                </div>
                <div className="text-sm text-slate-700 mt-1">{e.value}</div>
                <div className="text-xs text-slate-500 mt-1">{e.recordedAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

