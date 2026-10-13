import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus, Search, Menu, X, ChevronDown, Bell, Clock,
  LogOut, Settings, User, Home, Navigation, Route,
  Calendar, History, CheckCircle, Headphones, Award,
  MapPin, Crosshair,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

const formatNotificationTime = (createdAt) => {
  if (!createdAt) return '';

  const elapsedSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
};

const DashboardLayout = ({ children, user: userProp }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    error: notificationError,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { user: authUser, logout } = useAuth();
  const user = userProp || authUser;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Determine Sidebar Items based on Role (assuming passed via user prop or localStorage)
  const role = user?.role || localStorage.getItem('role') || 'Student';
  
  const studentItems = [
    { id: '/student',           icon: Home,      label: 'Dashboard',    color: 'text-blue-600'   },
    { id: '/student/profile',   icon: User,      label: 'My Profile',   color: 'text-indigo-600' },
    { id: '/student/transport', icon: Bus,       label: 'Transport',    color: 'text-indigo-600' },
    { id: '/student/my-bus',    icon: MapPin,    label: 'My Bus',       color: 'text-indigo-600' },
    { id: '/student/schedule',  icon: Calendar,  label: 'My Schedule',  color: 'text-indigo-600' },
    { id: '/student/track-bus', icon: Crosshair, label: 'Track My Bus', color: 'text-indigo-600' },
  ];

  const driverItems = [
    { id: '/driver',             icon: Home,    label: 'Dashboard',    color: 'text-violet-600' },
    { id: '/driver/my-bus',      icon: Bus,     label: 'My Bus',       color: 'text-indigo-600' },
    { id: '/driver/trip-history',icon: History, label: 'Trip History', color: 'text-indigo-600' },
    { id: '/driver/profile',     icon: User,    label: 'My Profile',   color: 'text-slate-600' },
  ];

  const sidebarItems = role === 'Driver' ? driverItems : studentItems;
  const profileRoute = role === 'Driver' ? '/driver/profile' : '/student/profile';

  const isNavActive = (route) => {
    if (route === '/student' || route === '/driver') {
      return location.pathname === route;
    }
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors md:hidden">
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              
              <Link to={role === 'Driver' ? '/driver' : '/student'} className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-900">UniTrack</h1>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{role === 'Driver' ? 'Driver Operations' : role + ' Portal'}</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-violet-600" />
              <span className="font-medium">{formatTime(currentTime)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                aria-label="Open notifications"
                onClick={() => setIsNotificationsOpen((current) => !current)}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-16 top-14 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">Notifications</p>
                      <p className="text-xs text-gray-500">Recent updates</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications && notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-500">Loading notifications...</p>
                    ) : notificationError && notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-red-500">Unable to load notifications.</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification._id}
                          onClick={() => markAsRead(notification._id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${notification.isRead ? 'bg-white' : 'bg-indigo-50/60'}`}
                        >
                          <div className="flex items-start gap-3">
                            <Bus className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm truncate ${notification.isRead ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-[11px] text-gray-400 mt-1">{formatNotificationTime(notification.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{(user?.name || role).charAt(0)}</span>
                  </div>
                  <ChevronDown className={`hidden md:block w-4 h-4 text-gray-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-900">{user?.name || `${role} User`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{role}</p>
                    </div>
                    <div className="py-2">
                      <Link to={profileRoute} onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors text-gray-700">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <div className="my-1 border-t border-gray-100"></div>
                      <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center space-x-3 transition-colors text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 md:w-24'} overflow-hidden`}>
        <div className="h-full flex flex-col overflow-y-auto py-4">
          <nav className="space-y-1.5 px-3 flex-1">
            {sidebarItems.map((item) => {
              const isActive = isNavActive(item.id);
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.08)]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 md:hidden' : 'opacity-100'}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-24'}`}>
        <div className="p-4 sm:p-6 xl:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/45 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default DashboardLayout;
