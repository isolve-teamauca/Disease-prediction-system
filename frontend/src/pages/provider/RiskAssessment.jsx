import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import Badge from "../../components/Badge.jsx";
import { apiGet, apiPost } from "../../lib/api.js";

function labelTone(label) {
  if (label === "critical") return "critical";
  if (label === "high") return "high";
  if (label === "moderate") return "moderate";
  return "low";
}

function MlPredictor({ title, schemaPath, predictPath }) {
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet(schemaPath)
      .then((s) => {
        if (!alive) return;
        setSchema(s);
        const init = {};
        (s.features ?? []).forEach((f) => {
          init[f.name] = f.kind === "number" ? "" : (f.options?.[0] ?? "");
        });
        setValues(init);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e.message || "Failed to load schema");
      });
    return () => {
      alive = false;
    };
  }, [schemaPath]);

  async function predict() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const features = {};
      (schema?.features ?? []).forEach((f) => {
        features[f.name] = f.kind === "number" ? Number(values[f.name]) : values[f.name];
      });
      const r = await apiPost(predictPath, { features });
      setRes(r);
    } catch (e) {
      setErr(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-slate-500 mt-1">Uses your pre-trained model files (.pkl).</div>

      {err ? <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{err}</div> : null}

      {schema ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(schema.features ?? []).map((f) => (
            <div key={f.name}>
              <label className="text-sm font-semibold">{f.name}</label>
              {f.kind === "category" ? (
                <select className="select mt-2" value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                  {(f.options ?? [""]).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input mt-2"
                  type="number"
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-600">Loading model schema…</div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button className="btn-primary" onClick={predict} disabled={!schema || loading}>
          {loading ? "Predicting..." : "Predict Risk"}
        </button>
        {res ? (
          <div className="text-sm">
            <span className="font-semibold">{res.label}</span>
            {typeof res.probability === "number" ? <span className="text-slate-500"> · Probability {Math.round(res.probability * 100)}%</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RiskAssessment() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: "P001",
    age: 45,
    gender: "Male",
    systolic: 120,
    diastolic: 80,
    cholesterol: 180,
    bloodSugar: 100,
    bmi: 24.5,
    smoking: "No",
    familyHistory: "No",
    exerciseLevel: "Moderate",
    dietQuality: "Balanced"
  });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    apiGet("/api/provider/patients").then((res) => setPatients(res.items ?? []));
  }, []);

  useEffect(() => {
    const p = patients.find((x) => x.id === form.patientId);
    if (!p) return;
    setForm((f) => ({ ...f, age: p.age, gender: p.gender }));
  }, [patients, form.patientId]);

  const canRun = useMemo(() => !running, [running]);

  async function run() {
    setRunning(true);
    try {
      const res = await apiPost("/api/provider/assess", form);
      setResult(res);
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setResult(null);
    setForm((f) => ({
      ...f,
      systolic: 120,
      diastolic: 80,
      cholesterol: 180,
      bloodSugar: 100,
      bmi: 24.5,
      smoking: "No",
      familyHistory: "No",
      exerciseLevel: "Moderate",
      dietQuality: "Balanced"
    }));
  }

  return (
    <div className="space-y-6">
      <Topbar title="AI Risk Assessment" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-sm text-slate-500">Patient Clinical Data</div>
          <div className="text-lg font-semibold mt-1">Enter comprehensive patient information</div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Patient ID</label>
              <select className="select mt-2" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Age</label>
              <input className="input mt-2" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Gender</label>
              <select className="select mt-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Blood Pressure (mmHg)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="input" type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: Number(e.target.value) })} />
                <input className="input" type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Cholesterol (mg/dL)</label>
              <input className="input mt-2" type="number" value={form.cholesterol} onChange={(e) => setForm({ ...form, cholesterol: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Blood Sugar (mg/dL)</label>
              <input className="input mt-2" type="number" value={form.bloodSugar} onChange={(e) => setForm({ ...form, bloodSugar: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">BMI</label>
              <input className="input mt-2" type="number" step="0.1" value={form.bmi} onChange={(e) => setForm({ ...form, bmi: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-semibold">Smoking</label>
              <select className="select mt-2" value={form.smoking} onChange={(e) => setForm({ ...form, smoking: e.target.value })}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Family History</label>
              <select className="select mt-2" value={form.familyHistory} onChange={(e) => setForm({ ...form, familyHistory: e.target.value })}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Exercise Level</label>
              <select className="select mt-2" value={form.exerciseLevel} onChange={(e) => setForm({ ...form, exerciseLevel: e.target.value })}>
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Diet Quality</label>
              <select className="select mt-2" value={form.dietQuality} onChange={(e) => setForm({ ...form, dietQuality: e.target.value })}>
                <option>Poor</option>
                <option>Balanced</option>
                <option>Excellent</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="btn-primary flex-1 h-11" onClick={run} disabled={!canRun}>
              {running ? "Running..." : "Run AI Analysis"}
            </button>
            <button className="btn-ghost h-11" onClick={reset} type="button">
              Reset
            </button>
          </div>
        </div>

        <div className="card p-6 flex items-center justify-center">
          {!result ? (
            <div className="text-center text-slate-500">
              <div className="text-3xl font-semibold text-slate-300">No Assessment Yet</div>
              <div className="mt-2">Fill in the patient data and click “Run AI Analysis”.</div>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Overall Risk</div>
                  <div className="text-4xl font-semibold mt-1">{result.overallRisk}%</div>
                </div>
                <Badge tone={labelTone(result.label)} className="capitalize">
                  {result.label}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  ["Heart Disease", result.heartDisease],
                  ["Diabetes", result.diabetes],
                  ["Hypertension", result.hypertension]
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <div>{label}</div>
                      <div>{val}%</div>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-600" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-xs text-slate-500">Generated at {result.generatedAt}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MlPredictor title="Diabetes Prediction" schemaPath="/api/predict/diabetes/schema" predictPath="/api/predict/diabetes" />
        <MlPredictor title="Stroke Prediction" schemaPath="/api/predict/stroke/schema" predictPath="/api/predict/stroke" />
      </div>
    </div>
  );
}

