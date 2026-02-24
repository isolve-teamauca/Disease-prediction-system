import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Activity, History, LogOut, HelpCircle } from 'lucide-react';
import MedPredictLogo from './MedPredictLogo';
import { useAuth } from '../context/AuthContext';

const navPatient = [
  { to: '/dashboard/patient', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict/heart', icon: Activity, label: 'New Prediction' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How MedPredict Works' },
];

const navProvider = [
  { to: '/dashboard/provider', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How MedPredict Works' },
];

const navAdmin = [
  { to: '/admin-dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How MedPredict Works' },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPatient = user?.role === 'patient';
  const isAdmin = user?.role === 'admin';
  const nav = user ? (isAdmin ? navAdmin : isPatient ? navPatient : navProvider) : [{ to: '/how-it-works', icon: HelpCircle, label: 'How MedPredict Works' }];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-nav">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <NavLink to={user ? (isAdmin ? '/admin-dashboard' : isPatient ? '/dashboard/patient' : '/dashboard/provider') : '/how-it-works'} className="flex items-center gap-2 shrink-0">
          <MedPredictLogo className="w-9 h-9" />
          <span className="font-heading font-bold text-content">MedPredict</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to + label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm font-medium text-content border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:text-primary/80 hover:border-gray-300'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <span className="text-sm text-gray-500 truncate max-w-[120px]">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-content hover:bg-red-50 hover:text-primary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
