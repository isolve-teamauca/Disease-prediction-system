import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, History, LogOut, Search } from 'lucide-react';
import MedPredictLogo from './MedPredictLogo';
import { useAuth } from '../context/AuthContext';

const navPatient = [
  { to: '/dashboard/patient', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict/heart', icon: Activity, label: 'New Prediction' },
  { to: '/history', icon: History, label: 'History' },
];

const navProvider = [
  { to: '/dashboard/provider', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/provider', icon: Search, label: 'Search Patient' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPatient = user?.role === 'patient';
  const nav = isPatient ? navPatient : navProvider;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <NavLink to={isPatient ? '/dashboard/patient' : '/dashboard/provider'} className="flex items-center gap-3">
          <MedPredictLogo className="w-10 h-10" />
          <span className="font-heading font-bold text-primary">MedPredict</span>
        </NavLink>
      </div>
      <nav className="p-3 flex-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-input transition-colors ${
                isActive ? 'bg-input font-medium text-accent' : ''
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
