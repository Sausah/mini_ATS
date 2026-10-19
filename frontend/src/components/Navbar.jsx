import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Bell, Search, X, LogOut, User as UserIcon,
  Briefcase, CheckCheck, ChevronRight, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatusBadge from './StatusBadge';

const BREADCRUMBS = {
  '/dashboard': 'Dashboard',
  '/candidates': 'Candidates',
  '/candidates/new': 'Add Candidate',
  '/pipeline': 'Hiring Pipeline',
  '/calendar': 'Interview Calendar',
  '/jobs': 'Job Openings',
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef(null);

  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const getTitle = () => {
    const path = location.pathname;
    if (path.match(/^\/candidates\/\d+\/edit$/)) return 'Edit Candidate';
    if (path.match(/^\/candidates\/\d+$/)) return 'Candidate Details';
    return BREADCRUMBS[path] || 'Mini ATS';
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch recent notifications from dashboard activity
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/dashboard');
        const activity = res.data?.recent_activity || [];
        setNotifications(activity);
      } catch {
        // Fallback or empty if not ready
      }
    };
    fetchNotifications();
  }, []);

  // Live quick search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get('/candidates', {
          params: { search: searchQuery.trim(), limit: 5 }
        });
        setSearchResults(res.data?.candidates || []);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/candidates?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectCandidate = (id) => {
    navigate(`/candidates/${id}`);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getTitle()}</h1>

      <div className="flex items-center gap-3">
        {/* Quick Search Tool */}
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search
              size={15}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Quick search candidates…"
              className="w-48 sm:w-64 pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Quick Search Results Dropdown */}
          {showSearchDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 fade-in">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Matching Candidates</span>
                {searchLoading && <span className="text-indigo-600">Searching…</span>}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.length > 0 ? (
                  searchResults.map((cand) => (
                    <button
                      key={cand.id}
                      onClick={() => handleSelectCandidate(cand.id)}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {cand.full_name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{cand.email}</p>
                      </div>
                      <StatusBadge stage={cand.stage} />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {searchLoading ? 'Looking up results…' : 'No matching candidates found.'}
                  </div>
                )}
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View all results in Candidates →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Tool */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 fade-in">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Activity
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        navigate(`/candidates/${n.candidate_id}`);
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">
                          {n.candidate_name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.changed_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Moved {n.previous_stage ? `from ${n.previous_stage} ` : ''}to{' '}
                        <span className="font-semibold text-indigo-600">{n.new_stage}</span>
                      </p>
                      {n.note && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                          "{n.note}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No recent activities recorded yet.
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to="/pipeline"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View full hiring pipeline →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Tool & Admin Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="User profile menu"
          >
            {userInitial}
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || 'Recruiter Admin'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email || 'admin@miniats.com'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                        <Shield size={10} />
                        {user?.role?.toUpperCase() || 'ADMIN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Link
                  to="/dashboard"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Briefcase size={14} className="text-slate-400" />
                  Recruitment Dashboard
                </Link>
                <Link
                  to="/candidates"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <UserIcon size={14} className="text-slate-400" />
                  Candidate Roster
                </Link>
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
