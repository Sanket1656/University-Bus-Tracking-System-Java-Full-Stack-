import React from "react";
import { useLocation,  Outlet } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar"; 


const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/admin" },
    { id: "users", label: "Users", icon: "👤", path: "/admin/users" },
    { id: "drivers", label: "Drivers", icon: "🧑", path: "/admin/drivers" },
    { id: "students", label: "Students", icon: "🎓", path: "/admin/students" },
    { id: "buses", label: "Buses", icon: "🚌", path: "/admin/buses" },
    { id: "stops", label: "Stops", icon: "📍", path: "/admin/stops" },
    { id: "routes", label: "Routes", icon: "🗺️", path: "/admin/routes" },
    { id: "assignments", label: "Assignments", icon: "🔗", path: "/admin/assignments" },
    { id: "settings", label: "Settings", icon: "⚙", path: "/admin/settings" },
  ];


const Dashboard = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-24 bg-white/60 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-8 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            
            <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-full px-4 py-2.5 w-96 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <span className="text-slate-400 text-lg mr-3">🔍</span>
              <input
                type="text"
                placeholder="Search buses, routes, students..."
                className="bg-transparent border-none outline-none w-full text-slate-600 placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2.5 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Admin User</p>
                <p className="text-xs font-medium text-slate-500">
                  System Admin
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-linear-to-tr from-indigo-500 to bg-purple-500 flex items-center justify-center shadow-md border-2 border-white">
                <span className="text-lg text-white font-bold">👤</span>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Generic header — only on root dashboard, not sub-pages */}
            {location.pathname === "/admin" && (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    Dashboard
                  </h2>
                  <p className="text-slate-500 mt-1 font-medium">
                    Welcome back, here's what's happening today.
                  </p>
                </div>
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  Generate Report
                </button>
              </div>
            )}

            {location.pathname === "/admin" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Total Buses",
                      value: "42",
                      icon: "🚌",
                      color: "bg-emerald-500",
                      trend: "+2 this week",
                    },
                    {
                      label: "Active Ruotes",
                      value: "15",
                      icon: "🗺️",
                      color: "bg-blue-500",
                      trend: "All runing",
                    },
                    {
                      label: "Total Drivers",
                      value: "28",
                      icon: "👥",
                      color: "bg-purple-500",
                      trend: "+5 this month",
                    },
                    {
                      label: "Total Students",
                      value: "786",
                      icon: "🎓",
                      color: "bg-purple-500",
                      trend: "+25 this month",
                    },
                    {
                      label: "Alerts",
                      value: "3",
                      icon: "⚠️",
                      color: "bg-rose-500",
                      trend: "Needs attention",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duaration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 font-semibold mb-1">
                            {stat.label}
                          </p>

                          <h3 className="text-4xl font-extrabold text-slate-800">
                            {stat.value}
                          </h3>
                        </div>

                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg ${stat.color}`}
                        >
                          {stat.icon}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg">
                        <span>{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Large placeholder areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">
                      Live Bus Activity
                    </h3>

                    <div className="flex-1 bg-slate-50  rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <p className="text-slate-400 font-medium">
                        Map Integration Placeholder 🗺️
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">
                      Recent Alerts
                    </h3>

                    <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <p className="text-slate-400 font-medium">
                        Alert Feed Placeholder 🔔
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Outlet />

          </div>
        </main>
      </div>
    </div>
  );
};


export default Dashboard;
