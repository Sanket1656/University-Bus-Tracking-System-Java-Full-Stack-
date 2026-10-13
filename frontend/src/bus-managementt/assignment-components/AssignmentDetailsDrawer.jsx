import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaUtils';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const statusCfg = {
  Active:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-100 ring-emerald-400/30' },
  Inactive: { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400',    badge: 'bg-gray-500/20 text-gray-200 ring-gray-400/30'          },
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const avatarGradients = [
  'from-amber-300 to-yellow-400',
  'from-sky-300 to-cyan-400',
  'from-rose-300 to-pink-400',
  'from-violet-300 to-purple-400',
  'from-teal-300 to-emerald-400',
];
const avatarColor = (name = '') =>
  avatarGradients[(name.charCodeAt(0) || 0) % avatarGradients.length];

/* ── Vertical route timeline ─────────────────────────────────────────────── */
const VerticalTimeline = ({ stops = [] }) => {
  const ordered = [...stops].sort((a, b) => a.order - b.order);
  if (!ordered.length) return <p className="text-xs text-gray-400">No stops defined</p>;

  return (
    <div className="space-y-0">
      {ordered.map((s, i) => {
        const isFirst = i === 0;
        const isLast  = i === ordered.length - 1;
        const stopName = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

        return (
          <div key={i} className="flex items-stretch gap-3">
            {/* connector column */}
            <div className="flex flex-col items-center w-5 flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full ring-2 ring-white flex-shrink-0 mt-0.5 ${
                  isFirst ? 'bg-emerald-500 ring-emerald-200' : isLast ? 'bg-red-400 ring-red-200' : 'bg-indigo-500 ring-indigo-200'
                }`}
              />
              {!isLast && <div className="w-0.5 flex-1 bg-indigo-100 my-0.5" />}
            </div>
            {/* stop info */}
            <div className="pb-4">
              <p className={`text-xs font-semibold leading-tight ${isFirst ? 'text-emerald-700' : isLast ? 'text-red-500' : 'text-gray-800'}`}>
                {stopName}
                {isFirst && (
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                    Start
                  </span>
                )}
                {isLast && (
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                    End
                  </span>
                )}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Stop {s.order}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── InfoRow ─────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value, valueClass = '' }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-xs text-gray-400">{label}</span>
    <span className={`text-xs font-semibold text-gray-800 ${valueClass}`}>{value || '—'}</span>
  </div>
);

/* ── SectionLabel ────────────────────────────────────────────────────────── */
const SectionLabel = ({ num, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-md">
      {num}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{children}</span>
  </div>
);

/* ── AssignmentDetailsDrawer ─────────────────────────────────────────────── */
const AssignmentDetailsDrawer = ({ isOpen, onClose, assignment, onEdit }) => {
  if (!assignment) return null;

  const bus    = assignment.bus    || {};
  const driver = assignment.driver || {};
  const route  = assignment.route  || {};
  const stops  = route.stops       || [];

  const status = assignment.status || 'Inactive';
  const sc     = statusCfg[status] || statusCfg.Inactive;

  const busName    = bus.busName   || bus.name  || 'Unknown Bus';
  const busPlate   = bus.busRegistrationNumber || bus.plateNumber || '—';
  // driver.name comes from DriverProfile; driver.username is fallback from User model
  const driverName = driver.name   || driver.username || 'Unassigned';
  const routeName  = route.routeName  || route.name  || 'Unknown Route';
  const routeCode  = route.routeCode  || route.code  || '—';

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* ── Drawer Header ─────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-5 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight">{routeName}</h2>
                  <p className="text-indigo-200 text-xs mt-1 truncate">{busName} · {driverName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${status === 'Active' ? 'animate-pulse' : ''}`} />
                    {status}
                  </span>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* 01 — Assignment */}
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionLabel num="01">Assignment</SectionLabel>
                <InfoRow label="Assignment ID" value={assignment._id ? `#${assignment._id.slice(-8).toUpperCase()}` : '—'} valueClass="text-indigo-600 font-mono" />
                <InfoRow label="Status" value={
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {status}
                  </span>
                } />
                <InfoRow label="Created"      value={fmtDate(assignment.createdAt)} />
                <InfoRow label="Last Updated" value={fmtDate(assignment.updatedAt)} />
              </div>

              {/* 02 — Bus */}
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionLabel num="02">Bus</SectionLabel>
                {/* Bus image */}
                <div className="w-full h-28 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {bus.busPhoto ? (
                    <img src={resolveMediaUrl(bus.busPhoto)} alt={busName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg className="w-14 h-14 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                  )}
                </div>
                <InfoRow label="Bus Name"    value={busName} />
                <InfoRow label="Number Plate" value={
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">{busPlate}</span>
                } />
                <InfoRow label="Capacity"   value={bus.busCapacity ? `${bus.busCapacity} seats` : '—'} />
                <InfoRow label="Bus Status" value={bus.busStatus ? (bus.busStatus.charAt(0).toUpperCase() + bus.busStatus.slice(1)) : '—'} />
              </div>

              {/* 03 — Driver */}
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionLabel num="03">Driver</SectionLabel>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(driverName)} flex items-center justify-center text-base font-bold text-white flex-shrink-0 overflow-hidden`}>
                    {driver.photo ? (
                      <img src={resolveMediaUrl(driver.photo)} alt={driverName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-700">{initials(driverName)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{driverName}</p>
                    <p className="text-xs text-gray-400">{driver.role || 'Driver'}</p>
                  </div>
                </div>
                <InfoRow label="Contact"    value={driver.phone || '—'} />
                <InfoRow label="Email"      value={driver.email || '—'} />
                <InfoRow label="License No." value={driver.licenseId || '—'} />
              </div>

              {/* 04 — Route */}
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionLabel num="04">Route</SectionLabel>
                <InfoRow label="Route Name" value={routeName} />
                <InfoRow label="Route Code" value={
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">{routeCode}</span>
                } />
                <InfoRow label="Total Stops" value={stops.length ? `${stops.length} stops` : '—'} />
              </div>

              {/* 05 — Route Stops */}
              <div className="px-6 py-4">
                <SectionLabel num="05">Route Stops</SectionLabel>
                <VerticalTimeline stops={stops} />
              </div>
            </div>

            {/* ── Footer actions ────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onEdit(assignment); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Assignment
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssignmentDetailsDrawer;

// Made with Bob
