import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api.js";
import { setAuth } from "../../lib/auth.js";
import Logo from "../../components/Logo.jsx";

function RoleTabs({ value, onChange }) {
  return (
    <div className="mt-6 rounded-2xl bg-slate-100 p-1 flex">
      {[
        { id: "patient", label: "Patient" },
        { id: "provider", label: "Healthcare Provider" }
      ].map((t) => (
        <button
          key={t.id}
          className={[
            "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
            value === t.id ? "bg-white shadow-soft" : "text-slate-600 hover:text-slate-900"
          ].join(" ")}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [doctorCode, setDoctorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buttonLabel = useMemo(() => (role === "patient" ? "Sign In as Patient" : "Sign In as Provider"), [role]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost("/api/auth/login", {
        email,
        password,
        role,
        doctorCode: role === "patient" ? (doctorCode || null) : null
      });
      setAuth(res);
      navigate(role === "patient" ? "/patient/dashboard" : "/provider/overview");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 to-slate-50 grid place-items-center p-6">
      <div className="card w-[min(640px,100%)] p-10">
        <div className="flex justify-center">
          <Logo subtitle="AI-Powered Disease Risk Prediction System" />
        </div>

        <div className="mt-6 text-center">
          <div className="text-3xl font-semibold">Welcome to MedPredict</div>
          <div className="mt-1 text-slate-500">Sign in to continue</div>
        </div>

        <RoleTabs value={role} onChange={(r) => setRole(r)} />

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input
              className="input mt-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {role === "patient" ? (
            <div>
              <label className="text-sm font-semibold">Doctor Code (only if not assigned)</label>
              <input
                className="input mt-2"
                value={doctorCode}
                onChange={(e) => setDoctorCode(e.target.value)}
                placeholder="DR-XXXXXXXX"
              />
              <div className="text-xs text-slate-500 mt-1">If your account is not linked yet, enter your doctor code to link on login.</div>
            </div>
          ) : null}

          {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div> : null}

          <button className="btn-primary w-full h-12" disabled={loading}>
            {loading ? "Signing in..." : buttonLabel}
          </button>

          <div className="text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

