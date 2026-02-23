import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import { apiGet, apiPost } from "../../lib/api.js";

function toneFromStatus(status) {
  if (status === "critical") return "critical";
  if (status === "high") return "high";
  if (status === "moderate") return "moderate";
  return "low";
}

export default function Patients() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [doctorCode, setDoctorCode] = useState(null);
  const [patientEmail, setPatientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiGet("/api/provider/patients");
    setItems(res.items ?? []);
  }

  useEffect(() => {
    load();
    apiGet("/api/provider/invite-code").then((r) => setDoctorCode(r.doctorCode));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => (p.name + " " + p.id).toLowerCase().includes(q));
  }, [items, query]);

  async function assignPatient() {
    setSaving(true);
    try {
      await apiPost("/api/provider/assign", { patientEmail });
      setOpen(false);
      setPatientEmail("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Patient Management"
        right={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            Assign / Invite
          </button>
        }
      />
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID..." />
          </div>
          <div className="text-sm text-slate-500">Showing {filtered.length} of {items.length} patients</div>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-3 pr-3 font-semibold">Patient ID</th>
                <th className="py-3 pr-3 font-semibold">Name</th>
                <th className="py-3 pr-3 font-semibold">Age</th>
                <th className="py-3 pr-3 font-semibold">Gender</th>
                <th className="py-3 pr-3 font-semibold">Last Visit</th>
                <th className="py-3 pr-3 font-semibold">Risk Score</th>
                <th className="py-3 pr-3 font-semibold">Status</th>
                <th className="py-3 pr-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-3 font-semibold">{p.id}</td>
                  <td className="py-3 pr-3">{p.name}</td>
                  <td className="py-3 pr-3">{p.age}</td>
                  <td className="py-3 pr-3">{p.gender}</td>
                  <td className="py-3 pr-3">{p.lastVisit}</td>
                  <td className="py-3 pr-3 font-semibold">{p.riskScore}%</td>
                  <td className="py-3 pr-3">
                    <Badge tone={toneFromStatus(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <button className="btn-ghost px-3 py-1.5">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title="Assign / Invite Patient" onClose={() => (saving ? null : setOpen(false))}>
        <div className="space-y-4">
          {doctorCode ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Your Doctor Code</div>
              <div className="mt-1 font-semibold tracking-wide">{doctorCode}</div>
              <div className="mt-2 text-xs text-slate-500">
                Patients can sign up using: <span className="font-semibold">/signup?doctorCode={doctorCode}</span>
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold">Assign existing patient by email</label>
            <input
              className="input mt-2"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="patient@email.com"
            />
            <div className="text-xs text-slate-500 mt-1">This will link that patient account to you if it’s unassigned.</div>
          </div>

          <button className="btn-primary w-full h-11" onClick={assignPatient} disabled={saving || !patientEmail.trim()}>
            {saving ? "Assigning..." : "Assign Patient"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

