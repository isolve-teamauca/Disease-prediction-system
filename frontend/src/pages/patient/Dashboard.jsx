import React, { useEffect, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import Badge from "../../components/Badge.jsx";
import { apiGet } from "../../lib/api.js";
import AppointmentModal from "../../components/AppointmentModal.jsx";

function MetricCard({ metric }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{metric.label}</div>
        <Badge tone={metric.status === "good" ? "good" : "normal"}>{metric.status}</Badge>
      </div>
      <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
      <div className="mt-1 text-xs text-slate-500">{metric.trend}</div>
    </div>
  );
}

function Insight({ item }) {
  const tone = item.type === "success" ? "good" : item.type === "warning" ? "moderate" : "logged";
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-3">
      <div className="w-1.5 rounded-full bg-brand-500" />
      <div>
        <div className="font-semibold flex items-center gap-2">
          {item.title} <Badge tone={tone}>{item.type}</Badge>
        </div>
        <div className="text-sm text-slate-600 mt-1">{item.text}</div>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [appointmentOpen, setAppointmentOpen] = useState(false);

  useEffect(() => {
    apiGet("/api/patient/dashboard").then(setData);
  }, []);

  if (!data) return <div className="text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-r from-brand-600 to-indigo-600 text-white overflow-hidden">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-sm/6 opacity-90">My Health Dashboard</div>
            <div className="mt-1 text-4xl font-semibold">
              {data.overallHealthScore}
              <span className="text-xl font-semibold opacity-80">/100</span>
            </div>
            <div className="mt-1 text-sm opacity-90">{data.delta}</div>
          </div>
          <div className="h-24 w-24 rounded-full border-4 border-white/30 grid place-items-center">
            <div className="h-14 w-14 rounded-full bg-white/15" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {data.doctor ? (
        <div className="card p-6">
          <Topbar title="Your Doctor" />
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{data.doctor.name}</div>
              <div className="text-sm text-slate-600">
                {data.doctor.specialty ? `${data.doctor.specialty}` : "Specialty not set"}
              </div>
              {data.doctor.doctorCode ? <div className="text-xs text-slate-500 mt-1">Code: {data.doctor.doctorCode}</div> : null}
            </div>
            <div className="text-right text-xs text-slate-500">
              Only your assigned doctor can view your record.
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 lg:col-span-2">
          <Topbar title="AI Health Insights" />
          <div className="mt-4 space-y-3">
            {data.insights.map((it) => (
              <Insight key={it.title} item={it} />
            ))}
          </div>
        </div>
        <div className="card p-6">
          <Topbar title="Upcoming Appointments" />
          <div className="mt-4 space-y-3">
            {data.appointments.map((a) => (
              <div key={a.type} className="rounded-2xl border border-slate-100 p-4">
                <div className="font-semibold">{a.type}</div>
                <div className="text-sm text-slate-600">{a.doctor}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {a.date} at {a.time}
                </div>
              </div>
            ))}
            <button className="btn-ghost w-full" type="button" onClick={() => setAppointmentOpen(true)}>
              Schedule New Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 bg-amber-50/60 border-amber-100">
        <Topbar title="Your Latest Risk Assessment" />
        <div className="mt-2 text-sm text-slate-700">{data.latestRisk.summary}</div>
        <div className="mt-6 space-y-4">
          {[
            ["Heart Disease Risk", data.latestRisk.heartDisease],
            ["Diabetes Risk", data.latestRisk.diabetes],
            ["Hypertension Risk", data.latestRisk.hypertension]
          ].map(([label, val]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm font-semibold">
                <div>{label}</div>
                <div>{val}%</div>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div className="h-full bg-slate-900" style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="btn-primary">Update Health Assessment</button>
        </div>
      </div>

      <AppointmentModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
    </div>
  );
}

