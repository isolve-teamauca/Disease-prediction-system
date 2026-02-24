import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import MedPredictLogo from '../components/MedPredictLogo';
import RoleToggle from '../components/RoleToggle';
import InputField from '../components/InputField';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [submitting, setSubmitting] = useState(false);
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
      toast.success('Signed in successfully.');
      const dest = data?.role === 'admin' ? '/admin-dashboard' : data?.role === 'patient' ? '/dashboard/patient' : '/dashboard/provider';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ParticleBackground />
      <div className="w-full max-w-md relative z-0">
        <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
          <div className="flex flex-col items-center text-center mb-6">
            <MedPredictLogo className="w-16 h-16 mb-4" />
            <h1 className="font-heading text-2xl font-bold text-content">Welcome to MedPredict</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-content mb-2">I am signing in as</label>
              <RoleToggle value={role} onChange={setRole} disabled={submitting} showAdmin />
            </div>

            <InputField
              icon={Mail}
              label="Email"
              type="email"
              placeholder=""
              value={email}
              onChange={setEmail}
            />
            <InputField
              icon={Lock}
              label="Password"
              type="password"
              placeholder=""
              value={password}
              onChange={setPassword}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : null}
              Sign In as {role === 'patient' ? 'Patient' : role === 'admin' ? 'Admin' : 'Health Provider'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
