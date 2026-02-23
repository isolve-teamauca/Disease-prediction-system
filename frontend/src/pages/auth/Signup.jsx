import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../../lib/api.js";
import { setAuth } from "../../lib/auth.js";
import Logo from "../../components/Logo.jsx";
import { HeartPulse, Stethoscope } from "lucide-react";

function RoleCard({ selected, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-2xl border p-6 text-left transition",
        selected ? "border-slate-900 bg-brand-50 shadow-soft" : "border-slate-200 bg-white hover:bg-slate-50"
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 grid place-items-center">
          <Icon size={20} className="text-brand-600" />
        </span>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-slate-500">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [doctorCode, setDoctorCode] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const providerFields = useMemo(() => role === "provider", [role]);

  useEffect(() => {
    const code = searchParams.get("doctorCode");
    if (code && !doctorCode) setDoctorCode(code);
  }, [searchParams, doctorCode]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        role,
        fullName,
        phone: phone || null,
        email,
        password,
        confirmPassword,
        dateOfBirth: role === "patient" && dateOfBirth ? dateOfBirth : null,
        doctorCode: role === "patient" ? (doctorCode || null) : null,
        specialization: role === "provider" ? specialization : null,
        licenseNumber: role === "provider" ? licenseNumber : null
      };
      const res = await apiPost("/api/auth/signup", payload);
      setAuth(res);
      navigate(role === "patient" ? "/patient/dashboard" : "/provider/overview");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 to-slate-50 grid place-items-center p-6">
      <div className="card w-[min(860px,100%)] p-10">
        <div className="flex justify-center">
          <Logo subtitle="Join MedPredict for AI-powered health insights" />
        </div>

        <div className="mt-6 text-center">
          <div className="text-3xl font-semibold">Create Your Account</div>
          <div className="mt-1 text-slate-500">Choose your role to continue</div>
        </div>

        <div className="mt-8">
          <div className="text-sm font-semibold text-slate-700">I am a...</div>
          <div className="mt-3 flex flex-col md:flex-row gap-4">
            <RoleCard
              selected={role === "patient"}
              icon={HeartPulse}
              title="Patient"
              subtitle="Track my health"
              onClick={() => setRole("patient")}
            />
            <RoleCard
              selected={role === "provider"}
              icon={Stethoscope}
              title="Healthcare Provider"
              subtitle="Manage patients"
              onClick={() => setRole("provider")}
            />
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Full Name *</label>
              <input className="input mt-2" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-semibold">Phone Number</label>
              <input className="input mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Email Address *</label>
            <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
          </div>

          {providerFields ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Specialization *</label>
                <select className="select mt-2" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                  <option value="">Select specialization</option>
                  <option>Cardiology</option>
                  <option>Endocrinology</option>
                  <option>General Practice</option>
                  <option>Neurology</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">License Number *</label>
                <input className="input mt-2" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="MD123456" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Doctor Code *</label>
                <input
                  className="input mt-2"
                  value={doctorCode}
                  onChange={(e) => setDoctorCode(e.target.value)}
                  placeholder="DR-XXXXXXXX"
                />
                <div className="text-xs text-slate-500 mt-1">Ask your doctor for their MedPredict code.</div>
              </div>
              <div>
                <label className="text-sm font-semibold">Date of Birth</label>
                <input className="input mt-2" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Password *</label>
              <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-semibold">Confirm Password *</label>
              <input
                className="input mt-2"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div> : null}

          <button className="btn-primary w-full h-12" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="text-center text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

