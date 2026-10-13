import React from 'react'
import { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/admin" },
    { id: "users", label: "Users", icon: "👤", path: "/admin/users" },
    { id: "drivers", label: "Drivers", icon: "🧑", path: "/admin/drivers" },
    { id: "students", label: "Students", icon: "🎓", path: "/admin/students" },
    { id: "buses", label: "Buses", icon: "🚌", path: "/admin/bus" },
    { id: "stops", label: "Stops", icon: "📍", path: "/admin/stops" },
    { id: "routes", label: "Routes", icon: "🗺️", path: "/admin/routes" },
    { id: "assignments", label: "Assignments", icon: "🔗", path: "/admin/assignments" },
    { id: "settings", label: "Settings", icon: "⚙", path: "/admin/settings" },
  ];


  return (
    <div>
      <aside
        className={`
            ${isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-24 md:translate-x-0"} fixed md:relative z-50 h-full bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center justify-center px-6  border-b border-slate-50/50">
          <div
            className={`flex items-center gap-3 transition-opacity duration-300 ${!isSidebarOpen && "md:opacity-0 hidden md:flex"}`}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white text-xl">🚌</span>
            </div>

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-900 to-slate-800">
              Bus Tracker
            </h1>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-hide">
          {sidebarItems.map((item) => {

            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.24)] translate-x-1" : "text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600 hover:translate-x-1"}`}
              >

                <span 
                  className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</span>

                <span
                  className={`font-semibold tracking-wide ${!isSidebarOpen && "md:hidden"}`}>{item.label}</span>

                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-6 bg-white/20 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-rose-500 hover:bg-rose-50 hover:text-rose-600 group `}
          >
            <span className="text-xl group-hover:scale-110 transition-transform duration-300">
              🚪
            </span>
            <span
              className={`font-semibold tracking-wide ${!isSidebarOpen && "md:hidden"}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default AdminSidebar