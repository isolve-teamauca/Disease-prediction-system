import { useState } from 'react';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [submitting, setSubmitting] = useState(false);
  const [toastState, setToastState] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await login(email, password, role);
      const user = data?.user || data;
      const name = user?.full_name || user?.username || user?.email || 'there';
      setToastState({ type: 'success', message: `Welcome back, ${name}! 👋` });
      const dest =
        user?.role === 'admin'
          ? '/admin-dashboard'
          : user?.role === 'patient'
          ? '/dashboard/patient'
          : '/dashboard/provider';
      setTimeout(() => navigate(dest, { replace: true }), 1200);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
