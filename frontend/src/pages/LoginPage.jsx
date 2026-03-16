import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLeftPanel from '../components/AuthLeftPanel';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (!local) return `***@${domain}`;
  const first = local[0];
  return `${first}***@${domain}`;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('credentials');
  const [twoFaUser, setTwoFaUser] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState(Array(6).fill(''));
  const [twoFaError, setTwoFaError] = useState('');
  const [toastState, setToastState] = useState(null);
  const inputsRef = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await login(email, password, role);
      const user = data?.user || data;
      setTwoFaUser(user);
      setTwoFaCode(Array(6).fill(''));
      setTwoFaError('');
      setStage('2fa');
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDigitChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...twoFaCode];
    next[idx] = value;
    setTwoFaCode(next);
    setTwoFaError('');
    if (value && idx < inputsRef.current.length - 1) inputsRef.current[idx + 1]?.focus();
    const joined = next.join('');
    if (joined.length === 6) verifyCode(joined);
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !twoFaCode[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
  };

  const completeLogin = (user) => {
    const name = user?.full_name || user?.username || user?.email || 'there';
    setToastState({ type: 'success', message: `Welcome back, ${name}! 👋` });
    const dest = user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'patient' ? '/dashboard/patient' : '/dashboard/provider';
    setTimeout(() => navigate(dest, { replace: true }), 1200);
  };

  const verifyCode = (code) => {
    if (code === '123456') completeLogin(twoFaUser);
    else {
      setTwoFaError('Invalid code. Try again.');
      setTwoFaCode(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  const handleResend = () => {
    setTwoFaCode(Array(6).fill(''));
    setTwoFaError('');
    inputsRef.current[0]?.focus();
    setToastState({ type: 'success', message: 'Code resent!' });
  };

  const handleSkip = () => {
    if (twoFaUser) completeLogin(twoFaUser);
  };

  const emailLabel = role === 'provider' ? 'Email or Medical License' : 'Email';
  const emailPlaceholder =
    role === 'patient' ? 'your@email.com' : role === 'provider' ? 'Email or license number' : 'admin@medpredict.com';

  return (
    <div className="min-h-screen flex bg-[#0D0A0A]" style={{ minHeight: '100vh' }}>
      {toastState && <Toast type={toastState.type} message={toastState.message} onClose={() => setToastState(null)} />}

      <AuthLeftPanel />

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 w-[90%] md:w-full max-w-[420px] md:max-w-none mx-auto">
        <div
          className="auth-card-enter w-full"
          style={{ ...cardStyle, maxWidth: 440 }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4" style={{ color: '#6F1D1B' }}>
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="currentColor">
                <path d="M14 17h12v6H14z" />
                <path d="M17 8h6v24h-6z" />
              </svg>
            </div>
            <h1 className="text-white text-[28px] font-serif font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome Back
            </h1>
            <p className="text-sm mt-1" style={{ color: '#888' }}>
              Sign in to your account
            </p>
          </div>

          {stage === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
                  I am signing in as
                </label>
                <div className="flex rounded-full p-1 gap-0.5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                  {['patient', 'provider', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={submitting}
                      className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors"
                      style={{
                        background: role === r ? '#6F1D1B' : 'transparent',
                        color: role === r ? 'white' : '#888',
                      }}
                    >
                      {r === 'patient' ? 'Patient' : r === 'admin' ? 'Admin' : 'Health Provider'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
                  {emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#666' }} />
                  <input
                    type="text"
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="placeholder:opacity-70"
                    style={{ ...inputStyle, paddingLeft: 44 }}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#999' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#666' }} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="placeholder:opacity-70"
                    style={{ ...inputStyle, paddingLeft: 44 }}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[52px] rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #6F1D1B, #99582A)',
                }}
              >
                {submitting ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : null}
                Sign In
              </button>
            </form>
          )}

          {stage === '2fa' && (
            <div className="space-y-5">
              <h2 className="text-white text-xl font-semibold text-center" style={{ fontFamily: 'Georgia, serif' }}>
                Verify Your Identity
              </h2>
              <p className="text-sm text-center" style={{ color: '#888' }}>
                A 6-digit code has been sent to{' '}
                <span className="text-white font-medium">{maskEmail(twoFaUser?.email || email)}</span>
              </p>
              <div className="flex justify-center gap-2">
                {twoFaCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-lg rounded-xl text-white"
                    style={inputStyle}
                  />
                ))}
              </div>
              {twoFaError && <p className="text-sm text-red-400 text-center">{twoFaError}</p>}
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={handleResend} className="font-medium hover:underline" style={{ color: '#6F1D1B' }}>
                  Resend Code
                </button>
                <button type="button" onClick={handleSkip} className="text-gray-500 hover:text-gray-300">
                  Skip for now (Demo)
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm mt-6" style={{ color: '#888' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: '#BB9457' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
