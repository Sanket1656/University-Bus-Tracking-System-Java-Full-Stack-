import React from 'react';
import { motion } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaUtils';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const statusCfg = {
  Active:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Inactive: { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400'    },
};

const initials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const avatarGradients = [
  'from-amber-300 to-yellow-400 text-amber-900',
  'from-sky-300 to-cyan-400 text-sky-900',
  'from-rose-300 to-pink-400 text-rose-900',
  'from-violet-300 to-purple-400 text-violet-900',
  'from-teal-300 to-emerald-400 text-teal-900',
];

const avatarColor = (name = '') =>
  avatarGradients[(name.charCodeAt(0) || 0) % avatarGradients.length];

/* ── RouteViz — horizontal dot-line strip ─────────────────────────────────── */
const RouteViz = ({ stops = [] }) => {
  if (!stops.length) return null;

  const ordered = [...stops].sort((a, b) => a.order - b.order);
  const MAX = 6; // maximum dots to render before truncating
  const visible = ordered.length <= MAX ? ordered : [ordered[0], ...ordered.slice(1, MAX - 1), ordered[ordered.length - 1]];
  const truncated = ordered.length > MAX;

  return (
    <div className="flex items-center overflow-x-auto pb-1 gap-0 no-scrollbar">
      {visible.map((s, i) => {
        const isFirst = i === 0;
        const isLast  = i === visible.length - 1;
        const isTruncMiddle = truncated && i === Math.floor(visible.length / 2);
        const stopName = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="flex-shrink-0 h-0.5 w-6 bg-indigo-200" />
            )}
            <div className="flex flex-col items-center flex-shrink-0">
              {isTruncMiddle ? (
                <>
                  <div className="flex gap-0.5 items-center h-2.5">
                    {[0, 1, 2].map((d) => (
                      <div key={d} className="w-1 h-1 rounded-full bg-indigo-300" />
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 max-w-[40px] text-center leading-tight truncate">
                    ···
                  </span>
                </>
              ) : (
                <>
                  <div
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ${
                      isFirst
                        ? 'bg-emerald-500 ring-emerald-400'
                        : isLast
                        ? 'bg-red-400 ring-red-300'
                        : 'bg-indigo-500 ring-indigo-300'
                    }`}
                  />
                  <span
                    className={`text-[9px] mt-1 max-w-[48px] text-center leading-tight truncate ${
                      isFirst ? 'text-emerald-600 font-semibold' : isLast ? 'text-red-500 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {stopName}
                  </span>
                </>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── AssignmentCard ───────────────────────────────────────────────────────── */
const AssignmentCard = ({ assignment, index, onView, onEdit, onDelete }) => {
  const bus    = assignment.bus    || {};
  const driver = assignment.driver || {};
  const route  = assignment.route  || {};
  const stops  = route.stops       || [];

  const status  = assignment.status || 'Inactive';
  const sc      = statusCfg[status] || statusCfg.Inactive;
  // driver.name is set by backend helper; driver.username is the fallback from User model
  const driverName = driver.name || driver.username || 'Unassigned';
  const busName    = bus.busName   || bus.name  || 'Unknown Bus';
  const busPlate   = bus.busRegistrationNumber || bus.plateNumber || '—';
  const routeName  = route.routeName  || route.name  || 'Unknown Route';
  const routeCode  = route.routeCode  || route.code  || '—';

  const formattedDate = assignment.createdAt
    ? new Date(assignment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* ── Header: Bus + Status ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          {/* Bus thumbnail */}
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden">
            {bus.busPhoto ? (
              <img src={resolveMediaUrl(bus.busPhoto)} alt={busName} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{busName}</p>
            <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md tracking-wide mt-0.5">
              {busPlate}
            </span>
          </div>
        </div>
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${status === 'Active' ? 'animate-pulse' : ''}`} />
          {status}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-3">
        {/* Driver row */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarColor(driverName)} flex items-center justify-center text-[11px] font-bold overflow-hidden`}>
            {driver.photo ? (
              <img src={resolveMediaUrl(driver.photo)} alt={driverName} className="w-full h-full object-cover" />
            ) : (
              initials(driverName)
            )}
          </div>
          <p className="text-xs text-gray-700">
            <span className="text-gray-400 mr-1">Driver</span>
            <span className="font-semibold">{driverName}</span>
          </p>
        </div>

        {/* Route block */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900 truncate">{routeName}</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md ml-2 flex-shrink-0">
              {routeCode}
            </span>
          </div>
          {stops.length > 0 && (
            <p className="text-[10px] text-gray-400 mb-2">{stops.length} stop{stops.length !== 1 ? 's' : ''}</p>
          )}
          <RouteViz stops={stops} />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Assigned {formattedDate}</span>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onView}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            View
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssignmentCard;

// Made with Bob
