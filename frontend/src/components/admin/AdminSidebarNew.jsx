import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bus,
  Users,
  GraduationCap,
  MapPin,
  Route,
  Link2,
  Radio,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  FlaskConical,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/admin/dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/admin/buses',       label: 'Buses',             icon: Bus },
  { path: '/admin/drivers',     label: 'Drivers',           icon: Users },
  { path: '/admin/students',    label: 'Students',          icon: GraduationCap },
  { path: '/admin/stops',       label: 'Bus Stops',         icon: MapPin },
  { path: '/admin/routes',      label: 'Routes',            icon: Route },
  { path: '/admin/assignments', label: 'Assignments',       icon: Link2 },
  { path: '/admin/schedules',   label: 'Schedules',         icon: CalendarDays },
  { path: '/admin/transport',   label: 'Transport',         icon: ClipboardList },
  { path: '/admin/tracking',    label: 'Live Tracking',     icon: Radio },
  { path: '/admin/demo-fleet',  label: 'Fleet Simulation',  icon: FlaskConical, demoOnly: true },
  { path: '/admin/settings',    label: 'Settings',          icon: Settings },
];

const AdminSidebarNew = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) =>
    path === '/admin/dashboard'
      ? location.pathname === path || location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200/80 shadow-2xs">
      {/* Brand Header */}
      <div
        className={`flex items-center gap-3 px-4 h-16 border-b border-gray-100 flex-shrink-0 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs text-white">
          <Bus className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight flex items-center gap-1.5">
              <span>UniTrack</span>
              <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded">
                Ops
              </span>
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">Admin Portal</p>
          </div>
        )}
        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden md:flex ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ${
            collapsed ? 'mx-auto ml-0' : ''
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          className="md:hidden ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, demoOnly }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-purple-50 text-purple-700 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && demoOnly && !active && (
                <span className="ml-auto text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-1.5 py-0.5 rounded flex-shrink-0">
                  DEMO
                </span>
              )}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout separated at bottom */}
      <div className="p-2 border-t border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:block flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div
          className="fixed top-0 left-0 h-full z-30 transition-all duration-300"
          style={{ width: collapsed ? 64 : 240 }}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed top-0 left-0 h-full w-64 z-50 md:hidden shadow-xl animate-fade-in">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default AdminSidebarNew;
