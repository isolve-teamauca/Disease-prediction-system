import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Calendar, Lock, Stethoscope, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import MedPredictLogo from '../components/MedPredictLogo';
import RoleToggle from '../components/RoleToggle';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = ['Cardiology', 'Neurology', 'Endocrinology', 'General Practice', 'Other'];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    specialization: '',
    license_number: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.full_name?.trim()) e.full_name = 'Required.';
    if (!form.email?.trim()) e.email = 'Required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.';
    if (role === 'patient') {
      if (form.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) e.date_of_birth = 'Use YYYY-MM-DD.';
    } else {
      if (!form.specialization?.trim()) e.specialization = 'Required.';
      if (!form.license_number?.trim()) e.license_number = 'Required.';
    }
    if (!form.password) e.password = 'Required.';
    else if (form.password.length < 8) e.password = 'At least 8 characters.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below.');
      return;
    }
    setSubmitting(true);
    try {
      await register(form, role);
      toast.success('Account created. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.detail) {
          toast.error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
        } else {
          const parts = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
          toast.error(parts.length ? parts.join(' ') : 'Registration failed.');
        }
      } else {
        const msg = typeof data === 'string' ? data.slice(0, 100) : (data?.detail || (status === 403 ? 'Request blocked. Try same-origin or check CORS/CSRF.' : 'Registration failed.'));
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-0">
        <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
          <div className="flex flex-col items-center text-center mb-6">
            <MedPredictLogo className="w-16 h-16 mb-4" />
            <h1 className="font-heading text-2xl font-bold text-primary">Create Your Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join MedPredict for data-driven health insights</p>
          </div>

          {step === 1 ? (
            <>
              <p className="text-sm font-medium text-content mb-3">I am a...</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`p-4 rounded-2xl border-2 text-left transition-colors ${
                    role === 'patient' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="font-heading font-semibold text-primary">Patient</p>
                  <p className="text-xs text-gray-500 mt-0.5">Track my health</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={`p-4 rounded-2xl border-2 text-left transition-colors ${
                    role === 'provider' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Stethoscope className="w-8 h-8 text-accent mb-2" />
                  <p className="font-heading font-semibold text-primary">Health Provider</p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage patients</p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90"
              >
                Continue
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">I am a...</p>
                <RoleToggle value={role} onChange={setRole} disabled />
              </div>

              <InputField icon={User} label="Full Name" placeholder="John Doe" value={form.full_name} onChange={(v) => update('full_name', v)} error={errors.full_name} required />
              <InputField icon={Phone} label="Phone Number" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(v) => update('phone', v)} />
              <InputField icon={Mail} label="Email Address" type="email" placeholder="your.email@example.com" value={form.email} onChange={(v) => update('email', v)} error={errors.email} required />

              {role === 'patient' ? (
                <InputField icon={Calendar} label="Date of Birth" type="date" placeholder="YYYY-MM-DD" value={form.date_of_birth} onChange={(v) => update('date_of_birth', v)} error={errors.date_of_birth} />
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-content">Specialization *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Stethoscope className="w-5 h-5" /></span>
                      <select
                        value={form.specialization}
                        onChange={(e) => update('specialization', e.target.value)}
                        className="w-full bg-input rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    {errors.specialization && <p className="text-sm text-red-600">{errors.specialization}</p>}
                  </div>
                  <InputField icon={BadgeCheck} label="License Number" placeholder="MD123456" value={form.license_number} onChange={(v) => update('license_number', v)} error={errors.license_number} required />
                </>
              )}

              <InputField icon={Lock} label="Password" type="password" placeholder="••••••••" value={form.password} onChange={(v) => update('password', v)} error={errors.password} required />
              <InputField icon={Lock} label="Confirm Password" type="password" placeholder="••••••••" value={form.confirm_password} onChange={(v) => update('confirm_password', v)} error={errors.confirm_password} required />

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Back
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
