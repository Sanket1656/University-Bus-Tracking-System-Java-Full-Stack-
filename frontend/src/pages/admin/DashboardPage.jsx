import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Users,
  GraduationCap,
  Route,
  Link2,
  Plus,
  MapPin,
  ArrowRight,
  Activity,
  Radio,
  Clock,
  Compass,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminSectionCard from '../../components/ui/AdminSectionCard';
import busApi from '../../api/busApi';
import authApi from '../../api/authApi';
import routeApi from '../../api/routeApi';
import assignmentApi from '../../api/assignmentApi';
import { AdminSkeleton, SkeletonStatCard } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';

const DashboardPage = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    buses: 0,
    activeBuses: 0,
    drivers: 0,
    routes: 0,
    students: 0,
  });
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [busRes, driverRes, routeRes, assignRes, studentRes] = await Promise.allSettled([
          busApi.getAll({ page: 1, limit: 1 }),
          authApi.getAllDrivers({ page: 1, limit: 1 }),
          routeApi.getAll({ page: 1, limit: 4 }),
          assignmentApi.getAll({ page: 1, limit: 5 }),
          authApi.getAllStudents({ page: 1, limit: 1 }),
        ]);

        if (!isMounted) return;

        const busData = busRes.status === 'fulfilled' ? busRes.value.data : null;
        const driverData = driverRes.status === 'fulfilled' ? driverRes.value.data : null;
        const rts      = routeRes.status  === 'fulfilled' ? (routeRes.value.data?.data  || []) : [];
        const assigns  = assignRes.status === 'fulfilled' ? (assignRes.value.data?.data || []) : [];
        const studentData = studentRes.status === 'fulfilled' ? studentRes.value.data : null;

        setStats({
          buses: busData?.pagination?.total ?? null,
          activeBuses: busData?.summary?.active ?? null,
          drivers: driverData?.pagination?.total ?? null,
          routes: routeRes.status === 'fulfilled' ? routeRes.value.data?.pagination?.total ?? null : null,
          students: studentData?.pagination?.total ?? null,
        });
        setRoutes(rts.slice(0, 4));
        setAssignments(assigns.slice(0, 5));
        if ([busRes, driverRes, routeRes, assignRes, studentRes].some((result) => result.status === 'rejected')) {
          addToast('Some dashboard data could not be loaded', 'error');
        }
      } catch {
        if (isMounted) addToast('Failed to load dashboard data', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

  const quickActions = [
    {
      label: 'Add Bus',
      desc: 'Register vehicle',
      to: '/admin/buses',
      icon: Bus,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Add Stop',
      desc: 'Create waypoint',
      to: '/admin/stops',
      icon: MapPin,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Create Route',
      desc: 'Define stop sequence',
      to: '/admin/routes',
      icon: Route,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'New Assignment',
      desc: 'Link bus, driver & route',
      to: '/admin/assignments',
      icon: Link2,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Dashboard"
        description="Overview of university transport operations and fleet status"
        breadcrumb="Admin"
        action={
          <Link
            to="/admin/assignments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </Link>
        }
      />

      {/* ── KPI Row (5 Cards) ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonStatCard key={index} />)}
        </div>
      ) : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Buses"
          value={stats.buses}
          icon={Bus}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Fleet size"
        />
        <StatCard
          title="Active Buses"
          value={stats.activeBuses}
          icon={Activity}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="On service"
        />
        <StatCard
          title="Drivers"
          value={stats.drivers}
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Registered"
        />
        <StatCard
          title="Routes"
          value={stats.routes}
          icon={Route}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Configured"
        />
        <StatCard
          title="Students"
          value={stats.students}
          icon={GraduationCap}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          sub="Enrolled transit users"
        />
      </div>}

      {/* ── Main Operations Row: Live Map (Left) + Quick Actions (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Transport Map Preview Card (8 cols) */}
        <div className="lg:col-span-8">
          <AdminSectionCard
            title="Live Transport Map"
            subtitle="Current bus location overview"
            bodyClassName="p-0"
            action={
              <Link
                to="/admin/tracking"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Full map view</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="h-72 bg-slate-800 p-4 animate-pulse" aria-label="Loading map">
                <div className="h-full rounded-lg border border-slate-700 bg-slate-700/40" />
              </div>
            ) : <div className="relative h-72 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-6 overflow-hidden">
              {/* Subtle map coordinate grid background */}
              <svg
                className="absolute inset-0 w-full h-full opacity-15"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="dashgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                    <path
                      d="M 48 0 L 0 0 0 48"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                      strokeDasharray="2 4"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dashgrid)" />
              </svg>

              {/* Status pill in corner */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-xs border border-slate-700 px-3 py-1 rounded-full text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Monitoring Active Routes</span>
              </div>

              {/* Central stylized transit markers */}
              <div className="relative z-10 flex flex-wrap justify-center gap-6 sm:gap-10 my-auto">
                {[
                  { label: 'Fleet Status', val: `${stats.activeBuses} / ${stats.buses} Active`, icon: Bus, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
                  { label: 'Active Drivers', val: `${stats.drivers} Verified`, icon: Users, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
                  { label: 'Total Routes', val: `${stats.routes} Operating`, icon: Compass, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-4 py-3 rounded-xl shadow-lg"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.color}`}>
                      {React.createElement(item.icon, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom hint banner */}
              <div className="relative z-10 w-full flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  Live GPS telemetry updates from reporting vehicles
                </span>
                <Link
                  to="/admin/tracking"
                  className="text-purple-300 hover:text-white font-medium underline flex items-center gap-1"
                >
                  Open Live Tracking
                </Link>
              </div>
            </div>}
          </AdminSectionCard>
        </div>

        {/* Right: Quick Actions (4 cols) */}
        <div className="lg:col-span-4">
          <AdminSectionCard
            title="Quick Actions"
            subtitle="Common fleet operations"
            bodyClassName="p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {quickActions.map(({ label, desc, to, icon, iconBg }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-purple-50/60 border border-gray-200/70 hover:border-purple-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${iconBg}`}>
                      {React.createElement(icon, { className: 'w-5 h-5' })}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-purple-900 transition-colors">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          </AdminSectionCard>
        </div>
      </div>

      {/* ── Lower Row: Recent Assignments & Configured Routes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <AdminSectionCard
          title="Recent Assignments"
          subtitle="Latest vehicle, driver and route pairings"
          bodyClassName="p-0"
          action={
            <Link
              to="/admin/assignments"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-4"><AdminSkeleton variant="list" count={3} /></div>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No assignments created yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((a) => {
                const busName    = a.bus?.busName || a.bus?.busNumber || 'Bus';
                const driverName = a.driver?.name || a.driver?.username || 'Driver';
                const routeName  = a.route?.routeName || a.route?.routeCode || 'Route';
                return (
                  <div
                    key={a._id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{busName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {driverName} · <span className="font-medium text-gray-700">{routeName}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={a.status || 'Active'} size="xs" />
                  </div>
                );
              })}
            </div>
          )}
        </AdminSectionCard>

        {/* Configured Routes */}
        <AdminSectionCard
          title="Configured Routes"
          subtitle="Operating campus routes & waypoint counts"
          bodyClassName="p-0"
          action={
            <Link
              to="/admin/routes"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-4"><AdminSkeleton variant="list" count={3} /></div>
          ) : routes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No routes configured yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {routes.map((r) => {
                const start = r.stops?.[0]?.stop?.stopName ?? '—';
                const end   = r.stops?.[r.stops.length - 1]?.stop?.stopName ?? '—';
                return (
                  <div
                    key={r._id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Route className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{r.routeName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="text-emerald-700 font-medium">{start}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="text-rose-700 font-medium">{end}</span>
                          <span className="text-gray-400 ml-1.5">({r.stops?.length ?? 0} stops)</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md flex-shrink-0">
                      {r.routeCode}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </AdminSectionCard>
      </div>
    </div>
  );
};

export default DashboardPage;
