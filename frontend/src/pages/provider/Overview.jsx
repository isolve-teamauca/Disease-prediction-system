import React, { useEffect, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import Badge from "../../components/Badge.jsx";
import { apiGet } from "../../lib/api.js";

function Stat({ title, value, tone }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <span className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {tone ? <div className="mt-1 text-xs text-slate-500">{tone}</div> : null}
    </div>
  );
}

export default function ProviderOverview() {
  const [data, setData] = useState(null);
  const [doctorCode, setDoctorCode] = useState(null);

  useEffect(() => {
    apiGet("/api/provider/overview").then(setData);
    apiGet("/api/provider/invite-code").then((r) => setDoctorCode(r.doctorCode));
  }, []);

  if (!data) return <div className="text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <Topbar
        title="Overview"
        right={
          doctorCode ? (
            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <div className="text-xs text-slate-500">Doctor Code</div>
                <div className="font-semibold tracking-wide">{doctorCode}</div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => navigator.clipboard?.writeText(doctorCode)}
                type="button"
              >
                Copy
              </button>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Patients" value={data.totalPatients.toLocaleString()} />
        <Stat title="High Risk" value={data.highRisk} />
        <Stat title="Assessments Today" value={data.assessmentsToday} />
        <Stat title="Avg Risk Score" value={`${data.avgRiskScore}%`} />
      </div>

      <div className="card p-6">
        <div className="text-lg font-semibold">High Risk Patients</div>
        <div className="text-sm text-slate-500">Patients requiring immediate attention</div>
        <div className="mt-4 divide-y divide-slate-100">
          {data.highRiskPatients.map((p) => (
            <div key={p.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-500">
                  ID: {p.id} · Age: {p.age}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">{p.condition}</div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="text-sm font-semibold text-rose-700">Risk: {p.risk}%</div>
                  <Badge tone={p.tag}>{p.tag}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-lg font-semibold">Recent Assessments</div>
          <div className="mt-4 space-y-3">
            {data.recentAssessments.map((a) => (
              <div key={a.name + a.timeAgo} className="rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.timeAgo}</div>
                </div>
                <Badge tone={a.level.toLowerCase().includes("low") ? "low" : a.level.toLowerCase().includes("moderate") ? "moderate" : "high"}>
                  {a.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-lg font-semibold">System Alerts</div>
          <div className="mt-4 space-y-3">
            {data.systemAlerts.map((a) => (
              <div key={a.text} className="rounded-2xl border border-slate-100 p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{a.text}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.timeAgo}</div>
                </div>
                <Badge tone={a.type === "success" ? "good" : a.type === "warning" ? "moderate" : "logged"}>{a.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

