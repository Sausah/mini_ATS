import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Columns,
  Briefcase,
  Zap,
  LogOut,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: Columns },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <aside className="sidebar shadow-xl" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Mini ATS</div>
          <div className="text-slate-400 text-xs">Applicant Tracking</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1">
            Main Menu
          </p>
        </div>
        <ul className="space-y-0.5" role="list">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                aria-label={label}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Admin Session Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Recruiter Admin'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user?.email || 'admin@miniats.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={15} />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 py-1 px-2 rounded-md">
          <ShieldCheck size={12} />
          <span>Admin Authorized</span>
        </div>
      </div>
    </aside>
  );
}
