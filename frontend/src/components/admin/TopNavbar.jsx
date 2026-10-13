import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

const formatNotificationTime = (createdAt) => {
  if (!createdAt) return '';
  const elapsedSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
};

const NAV_LABELS = {
  '/admin/dashboard':   'Operations Dashboard',
  '/admin/buses':       'Fleet Management',
  '/admin/drivers':     'Driver Management',
  '/admin/students':    'Student Management',
  '/admin/stops':       'Bus Stop Management',
  '/admin/routes':      'Route Management',
  '/admin/assignments': 'Fleet Assignments',
  '/admin/schedules':   'Schedule Management',
  '/admin/transport':   'Transport Management',
  '/admin/tracking':    'Live Bus Tracking',
  '/admin/demo-fleet':  'Fleet Simulation',
  '/admin/settings':    'System Settings',
};

export const TopNavbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropRef = useRef(null);
  const notifRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    error: notificationError,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const pageTitle =
    Object.entries(NAV_LABELS).find(([p]) => location.pathname.startsWith(p))?.[1] ??
    'Operations Dashboard';

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = (name = '') =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'AD';

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile hamburger & Active Page Label */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-purple-600" />
          <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate tracking-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Open notifications"
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Notifications
                  </p>
                  <p className="text-[11px] text-gray-400">Transit operations feed</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {loadingNotifications && notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-gray-400">Loading notifications…</p>
                ) : notificationError && notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-rose-500">Unable to load notifications.</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-gray-400">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      type="button"
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-purple-50/40 hover:bg-purple-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.isRead ? 'bg-transparent' : 'bg-purple-600'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs truncate ${
                              n.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatNotificationTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
              {initials(user?.username || user?.name || 'Admin')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.username || user?.name || 'Admin'}
              </p>
              <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider leading-tight">
                {user?.role || 'Admin'}
              </p>
            </div>
            <ChevronDown
              className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${
                dropOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.name || user?.username || 'Admin'}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email || 'admin@unitrack.edu'}</p>
                <span className="inline-block mt-1 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full uppercase">
                  {user?.role || 'Administrator'}
                </span>
              </div>
              <div className="py-1">
                <Link
                  to="/admin/settings"
                  onClick={() => setDropOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings & Preferences
                </Link>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
