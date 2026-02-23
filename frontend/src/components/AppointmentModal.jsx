import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import { getAuth } from "../lib/auth.js";

const appointmentTypes = [
  "General Checkup",
  "Follow-up",
  "Specialist Consultation",
  "Lab Work",
  "Vaccination"
];

const preferredDoctors = ["Dr. Sarah Smith", "Dr. John Wilson", "Any Available"];

const timeSlots = [
  { id: "morning", label: "Morning 9AM-12PM", min: "09:00", max: "12:00" },
  { id: "afternoon", label: "Afternoon 12PM-3PM", min: "12:00", max: "15:00" },
  { id: "evening", label: "Evening 3PM-6PM", min: "15:00", max: "18:00" }
];

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="text-sm font-semibold">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function inputClass(invalid) {
  return [
    "input focus:ring-[#3D3DBF33] focus:border-[#3D3DBF]",
    invalid ? "border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-400" : ""
  ].join(" ");
}

export default function AppointmentModal({ open, onClose }) {
  const auth = getAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    appointmentType: "General Checkup",
    preferredDoctor: "Any Available",
    preferredDate: "",
    timeSlot: "",
    specificTime: "",
    reason: "",
    insurance: "",
    urgency: "Routine"
  });

  useEffect(() => {
    if (!open) return;
    const u = auth?.user;
    setSubmitted(false);
    setSubmitAttempted(false);
    setForm((f) => ({
      ...f,
      fullName: u?.name ?? f.fullName,
      email: u?.email ?? f.email,
      phone: u?.phone ?? f.phone,
      dateOfBirth: u?.dateOfBirth ?? f.dateOfBirth,
      preferredDate: f.preferredDate || todayIso()
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const slot = useMemo(() => timeSlots.find((s) => s.id === form.timeSlot) ?? null, [form.timeSlot]);

  const reasonChars = form.reason.length;
  const reasonRemaining = 300 - reasonChars;

  const requiredMissing = useMemo(() => {
    const missing = {};
    function req(key, ok) {
      if (!ok) missing[key] = true;
    }
    req("fullName", form.fullName.trim().length > 1);
    req("dateOfBirth", Boolean(form.dateOfBirth));
    req("phone", form.phone.trim().length > 5);
    req("email", form.email.includes("@"));
    req("appointmentType", Boolean(form.appointmentType));
    req("preferredDoctor", Boolean(form.preferredDoctor));
    req("preferredDate", Boolean(form.preferredDate));
    req("timeSlot", Boolean(form.timeSlot));
    req("specificTime", Boolean(form.specificTime));
    req("reason", form.reason.trim().length > 3 && reasonChars <= 300);
    req("urgency", Boolean(form.urgency));
    return missing;
  }, [form, reasonChars]);

  const hasErrors = Object.keys(requiredMissing).length > 0;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSelectSlot(id) {
    set("timeSlot", id);
    set("specificTime", "");
  }

  function submit() {
    setSubmitAttempted(true);
    if (hasErrors) return;
    setSubmitted(true);
  }

  const summary = useMemo(() => {
    const slotLabel = timeSlots.find((s) => s.id === form.timeSlot)?.label ?? "";
    return {
      patient: { name: form.fullName, dob: form.dateOfBirth, phone: form.phone, email: form.email },
      details: {
        type: form.appointmentType,
        doctor: form.preferredDoctor,
        date: form.preferredDate,
        slot: slotLabel,
        time: form.specificTime
      },
      extra: { urgency: form.urgency, insurance: form.insurance || "—", reason: form.reason }
    };
  }, [form, slot]);

  return (
    <Modal
      open={open}
      title="Schedule New Appointment"
      onClose={onClose}
      showCloseTextButton={false}
      panelClassName={[
        "w-full h-full rounded-none p-0 sm:p-6 sm:rounded-2xl sm:w-[min(920px,calc(100vw-32px))] sm:h-auto",
        "sm:max-h-[calc(100vh-96px)] overflow-hidden"
      ].join(" ")}
    >
      <div className="h-full sm:h-auto sm:max-h-[calc(100vh-140px)] overflow-auto">
        <div className="p-5 sm:p-0">
          {!submitted ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">Appointment Request</div>
                <div className="text-sm text-slate-600 mt-1">Fill the form below and we’ll confirm within 24 hours.</div>
              </div>

              <Section title="Patient Information">
                <Field label="Full Name" required>
                  <input
                    className={inputClass(submitAttempted && requiredMissing.fullName)}
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Date of Birth" required>
                  <input
                    type="date"
                    className={inputClass(submitAttempted && requiredMissing.dateOfBirth)}
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                  />
                </Field>
                <Field label="Phone Number" required>
                  <input
                    type="tel"
                    className={inputClass(submitAttempted && requiredMissing.phone)}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+250..."
                  />
                </Field>
                <Field label="Email Address" required>
                  <input
                    type="email"
                    className={inputClass(submitAttempted && requiredMissing.email)}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              </Section>

              <Section title="Appointment Details">
                <Field label="Appointment Type" required>
                  <select
                    className={["select focus:ring-[#3D3DBF33] focus:border-[#3D3DBF]", submitAttempted && requiredMissing.appointmentType ? "border-rose-300 bg-rose-50/40" : ""].join(" ")}
                    value={form.appointmentType}
                    onChange={(e) => set("appointmentType", e.target.value)}
                  >
                    {appointmentTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Preferred Doctor" required>
                  <select
                    className={["select focus:ring-[#3D3DBF33] focus:border-[#3D3DBF]", submitAttempted && requiredMissing.preferredDoctor ? "border-rose-300 bg-rose-50/40" : ""].join(" ")}
                    value={form.preferredDoctor}
                    onChange={(e) => set("preferredDoctor", e.target.value)}
                  >
                    {preferredDoctors.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Preferred Date" required>
                  <input
                    type="date"
                    min={todayIso()}
                    className={inputClass(submitAttempted && requiredMissing.preferredDate)}
                    value={form.preferredDate}
                    onChange={(e) => set("preferredDate", e.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Preferred Time" required>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {timeSlots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onSelectSlot(s.id)}
                          className={[
                            "rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                            form.timeSlot === s.id
                              ? "border-[#3D3DBF] bg-[#3D3DBF0D] text-[#3D3DBF]"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          ].join(" ")}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {submitAttempted && requiredMissing.timeSlot ? (
                      <div className="text-xs text-rose-700 mt-2">Please select a time slot.</div>
                    ) : null}
                  </Field>
                </div>

                {slot ? (
                  <div className="md:col-span-2">
                    <Field label="Specific Time" required>
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input
                          type="time"
                          min={slot.min}
                          max={slot.max}
                          className={inputClass(submitAttempted && requiredMissing.specificTime)}
                          value={form.specificTime}
                          onChange={(e) => set("specificTime", e.target.value)}
                        />
                        <div className="text-xs text-slate-500">
                          Allowed: {slot.min} – {slot.max}
                        </div>
                      </div>
                    </Field>
                  </div>
                ) : null}
              </Section>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="text-sm font-semibold">Additional Info</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Reason for Visit" required>
                      <textarea
                        className={[
                          inputClass(submitAttempted && requiredMissing.reason),
                          "min-h-[110px]"
                        ].join(" ")}
                        maxLength={300}
                        value={form.reason}
                        onChange={(e) => set("reason", e.target.value)}
                        placeholder="Describe your symptoms or reason for the visit..."
                      />
                      <div className={["mt-1 text-xs", reasonRemaining < 0 ? "text-rose-700" : "text-slate-500"].join(" ")}>
                        {reasonChars}/300
                      </div>
                    </Field>
                  </div>

                  <Field label="Insurance Provider (optional)">
                    <input
                      className={["input focus:ring-[#3D3DBF33] focus:border-[#3D3DBF]"].join(" ")}
                      value={form.insurance}
                      onChange={(e) => set("insurance", e.target.value)}
                      placeholder="e.g. RSSB"
                    />
                  </Field>

                  <div>
                    <div className="text-sm font-semibold">
                      Urgency Level <span className="text-rose-600">*</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {["Routine", "Soon", "Urgent"].map((u) => (
                        <label
                          key={u}
                          className={[
                            "rounded-2xl border px-3 py-3 text-sm font-semibold cursor-pointer transition text-center",
                            form.urgency === u ? "border-[#3D3DBF] bg-[#3D3DBF0D] text-[#3D3DBF]" : "border-slate-200 bg-white hover:bg-slate-50"
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name="urgency"
                            value={u}
                            checked={form.urgency === u}
                            onChange={() => set("urgency", u)}
                          />
                          {u}
                        </label>
                      ))}
                    </div>
                    {submitAttempted && requiredMissing.urgency ? (
                      <div className="text-xs text-rose-700 mt-2">Please select urgency.</div>
                    ) : null}
                  </div>
                </div>
              </div>

              {submitAttempted && hasErrors ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Please fill all required fields highlighted in red.
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-white rounded-xl px-5 py-2.5 font-semibold shadow-soft bg-[#3D3DBF] hover:bg-[#3333a8]"
                  onClick={submit}
                >
                  Request Appointment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <div className="text-lg font-semibold text-indigo-900">✅ Appointment Requested!</div>
                <div className="text-sm text-indigo-800 mt-1">We&apos;ll confirm within 24 hours.</div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="text-sm font-semibold">Summary</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs">Patient</div>
                    <div className="font-semibold">{summary.patient.name}</div>
                    <div className="text-slate-600">{summary.patient.email}</div>
                    <div className="text-slate-600">{summary.patient.phone}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Appointment</div>
                    <div className="font-semibold">{summary.details.type}</div>
                    <div className="text-slate-600">{summary.details.doctor}</div>
                    <div className="text-slate-600">
                      {summary.details.date} · {summary.details.slot}
                    </div>
                    <div className="text-slate-600">Time: {summary.details.time}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-slate-500 text-xs">Reason</div>
                    <div className="text-slate-700">{summary.extra.reason}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Urgency</div>
                    <div className="font-semibold">{summary.extra.urgency}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Insurance</div>
                    <div className="font-semibold">{summary.extra.insurance}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

