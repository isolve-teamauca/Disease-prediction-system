import { memo, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Lock, Stethoscope, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLeftPanel from '../components/AuthLeftPanel';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = ['Cardiology', 'Neurology', 'Endocrinology', 'General Practice', 'Other'];

const PHONE_CODES = [
  { code: '+250', label: 'RW' },
  { code: '+1', label: 'US' },
  { code: '+44', label: 'UK' },
  { code: '+27', label: 'ZA' },
  { code: '+254', label: 'KE' },
  { code: '+255', label: 'TZ' },
  { code: '+256', label: 'UG' },
  { code: '+234', label: 'NG' },
];

const cardStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 24,
  padding: 48,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(20px)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: 'white',
  padding: '14px 16px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const inputFocusStyle = {
  borderColor: '#6F1D1B',
  boxShadow: '0 0 0 3px rgba(111,29,27,0.2)',
};

function getPasswordChecks(password) {
  const lengthOk = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const score = [lengthOk, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  let label = 'Weak';
  let color = 'text-red-400';
  if (score === 2) {
    label = 'Fair';
    color = 'text-orange-400';
  } else if (score === 3) {
    label = 'Strong';
    color = 'text-yellow-400';
  } else if (score === 4) {
    label = 'Very Strong';
    color = 'text-green-400';
  }
  return { label, color, lengthOk, hasUpper, hasNumber, hasSpecial };
}

const DarkInput = memo(function DarkInput({ label, icon: Icon, error, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: '#666' }} />
        )}
        <input
          className="placeholder:opacity-70"
          style={{ ...inputStyle, ...(Icon ? { paddingLeft: 44 } : {}) }}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => {
            e.target.style.borderColor = '';
            e.target.style.boxShadow = '';
          }}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
});

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone: '',
    email: '',
    date_of_birth: '',
    specialization: '',
    license_number: '',
    password: '',
    confirm_password: '',
  });
  const [phoneCountry, setPhoneCountry] = useState('+250');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toastState, setToastState] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const passwordChecks = useMemo(() => getPasswordChecks(form.password || ''), [form.password]);

  const validateStep = (currentStep) => {
    const e = {};
    if (currentStep === 1) {
      if (!form.full_name?.trim()) e.full_name = 'Required.';
      if (!form.username?.trim()) e.username = 'Required.';
    } else if (currentStep === 2) {
      if (!phoneNumber.trim()) e.phone = 'Phone number is required.';
      if (!form.email?.trim()) e.email = 'Required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.';
      if (role === 'provider' && !form.license_number?.trim()) e.license_number = 'Medical license is required.';
    } else if (currentStep === 3) {
      if (!form.password) e.password = 'Required.';
      else if (!passwordChecks.lengthOk) e.password = 'At least 8 characters.';
      if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 2) setForm((f) => ({ ...f, phone: phoneNumber ? `${phoneCountry}${phoneNumber.replace(/\s+/g, '')}` : '' }));
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      toast.error('Please fix the errors below.');
      return;
    }
    setSubmitting(true);
    const combinedPhone = phoneNumber ? `${phoneCountry}${phoneNumber.replace(/\s+/g, '')}` : '';
    const payloadForm = { ...form, phone: combinedPhone };
    try {
      await register(payloadForm, role);
      setToastState({ type: 'success', message: 'Account created successfully! Welcome to MbereMed 🎉' });
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.detail) toast.error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
        else toast.error(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' ') || 'Registration failed.');
      } else {
        toast.error(typeof data === 'string' ? data.slice(0, 100) : data?.detail || (status === 403 ? 'Request blocked.' : 'Registration failed.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Account Type', 'Contact Details', 'Security'];

  return (
    <div className="min-h-screen flex bg-[#0D0A0A]" style={{ minHeight: '100vh' }}>
      {toastState && <Toast type={toastState.type} message={toastState.message} onClose={() => setToastState(null)} />}

      <AuthLeftPanel />

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 w-[90%] md:w-full max-w-[420px] md:max-w-none mx-auto overflow-auto">
        <div className="auth-card-enter w-full" style={{ ...cardStyle, maxWidth: 440 }}>
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3" style={{ color: '#6F1D1B' }}>
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="currentColor">
                <path d="M14 17h12v6H14z" />
                <path d="M17 8h6v24h-6z" />
              </svg>
            </div>
            <h1 className="text-white text-[28px] font-serif font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
              Create Account
            </h1>
            <p className="text-sm mt-1" style={{ color: '#888' }}>
              Join MbereMed for data-driven health insights
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex gap-3 mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-all ${step === s ? 'auth-step-pulse' : ''}`}
                  style={{
                    background: step >= s ? '#6F1D1B' : 'transparent',
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs w-full" style={{ color: '#888', maxWidth: 200 }}>
              {stepLabels.map((label, i) => (
                <span key={label} className={step >= i + 1 ? 'text-white' : ''}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className="p-4 rounded-2xl text-left transition-colors border"
                    style={{
                      borderColor: role === 'patient' ? '#6F1D1B' : 'rgba(255,255,255,0.15)',
                      background: role === 'patient' ? 'rgba(111,29,27,0.2)' : 'transparent',
                    }}
                  >
                    <User className="w-8 h-8 mb-2" style={{ color: '#888' }} />
                    <p className="font-semibold text-white">Patient</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>Track my health</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className="p-4 rounded-2xl text-left transition-colors border"
                    style={{
                      borderColor: role === 'provider' ? '#6F1D1B' : 'rgba(255,255,255,0.15)',
                      background: role === 'provider' ? 'rgba(111,29,27,0.2)' : 'transparent',
                    }}
                  >
                    <Stethoscope className="w-8 h-8 mb-2" style={{ color: '#BB9457' }} />
                    <p className="font-semibold text-white">Health Provider</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>Manage patients</p>
                  </button>
                </div>
              </div>
              <DarkInput label="Full Name" icon={User} placeholder="e.g. John Doe" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} error={errors.full_name} />
              <DarkInput label="Username" icon={User} placeholder="e.g. johndoe123" value={form.username} onChange={(e) => update('username', e.target.value)} error={errors.username} />
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #6F1D1B, #99582A)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    className="rounded-xl outline-none transition-colors"
                    style={{ ...inputStyle, width: 100 }}
                    value={phoneCountry}
                    onChange={(e) => setPhoneCountry(e.target.value)}
                  >
                    {PHONE_CODES.map((opt) => (
                      <option key={opt.code} value={opt.code} className="bg-gray-900 text-white">
                        {opt.code} ({opt.label})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="e.g. 788123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 placeholder:opacity-70"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-400 mt-1">{errors.phone}</p>}
              </div>
              <DarkInput label="Email" icon={Mail} type="email" placeholder="e.g. john@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
              {role === 'provider' && (
                <DarkInput label="Medical License Number" icon={BadgeCheck} placeholder="e.g. MD-2024-001" value={form.license_number} onChange={(e) => update('license_number', e.target.value)} error={errors.license_number} />
              )}
              {role === 'patient' && (
                <DarkInput label="Date of Birth" icon={Calendar} type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} error={errors.date_of_birth} />
              )}
              <div className="flex justify-between pt-2">
                <button type="button" onClick={handleBack} className="px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button type="button" onClick={handleNext} className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:brightness-110" style={{ background: 'linear-gradient(135deg, #6F1D1B, #99582A)' }}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <DarkInput label="Password" icon={Lock} type="password" placeholder="Create a strong password" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} />
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#888' }}>Password strength:</span>
                <span className={`font-semibold ${passwordChecks.color}`}>{passwordChecks.label}</span>
              </div>
              <DarkInput label="Confirm Password" icon={Lock} type="password" placeholder="Re-enter your password" value={form.confirm_password} onChange={(e) => update('confirm_password', e.target.value)} error={errors.confirm_password} />
              <div className="text-xs space-y-1">
                <p style={{ color: '#888' }}>Your password should include:</p>
                <p className={passwordChecks.lengthOk ? 'text-green-400' : 'text-gray-500'}>✓ At least 8 characters</p>
                <p className={passwordChecks.hasUpper ? 'text-green-400' : 'text-gray-500'}>✓ One uppercase letter</p>
                <p className={passwordChecks.hasNumber ? 'text-green-400' : 'text-gray-500'}>✓ One number</p>
                <p className={passwordChecks.hasSpecial ? 'text-green-400' : 'text-gray-500'}>✓ One special character (!@#$%^&*)</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleBack} className="px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-[52px] rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg, #6F1D1B, #99582A)' }}
                >
                  {submitting ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm mt-6" style={{ color: '#888' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#BB9457' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
