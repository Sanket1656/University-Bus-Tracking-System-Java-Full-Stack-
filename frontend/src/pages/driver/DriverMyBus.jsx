import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, MapPin, Users, CheckCircle, AlertCircle, Phone, Mail,
  User, Hash, BookOpen, Shield, RefreshCw, Route, Info, Armchair, Navigation, Calendar
} from 'lucide-react';
import driverApi from '../../api/driverApi';
import tripApi from '../../api/tripApi';
import trackingApi from '../../api/trackingApi';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import TrackingMap from '../../components/student/tracking/TrackingMap';
import 'leaflet/dist/leaflet.css';
import { resolveMediaUrl } from '../../utils/mediaUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const imgSrc = resolveMediaUrl;

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const safeNum = (n) => (typeof n === 'number' && !isNaN(n) ? n : null);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</h3>
);

// Compact info chip used inside modals
const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-violet-600" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-sm font-semibold text-gray-800 mt-0.5 break-words ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

const PageSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="h-44 bg-gradient-to-r from-violet-100 to-purple-100 rounded-2xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100" />)}
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
    </div>
    <div className="h-[500px] bg-white rounded-2xl border border-gray-100" />
    <div className="h-80 bg-white rounded-2xl border border-gray-100" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Assignment Hero
// ─────────────────────────────────────────────────────────────────────────────

const AssignmentHero = ({ assignment }) => {
  const bus   = assignment.bus   || {};
  const route = assignment.route || {};
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-6 md:p-8 shadow-xl">
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">My Bus</span>
            <span className={`ml-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              assignment.status === 'Active'
                ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-400/30'
                : 'bg-gray-400/25 text-gray-200 border border-gray-400/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'Active' ? 'bg-emerald-300 animate-pulse' : 'bg-gray-300'}`} />
              {assignment.status}
            </span>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {bus.busNumber || '—'}
            </h1>
            <p className="text-violet-200 text-base mt-1">{bus.busName || '—'}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs font-medium">Route</p>
              <p className="text-white font-semibold text-sm mt-0.5">{route.routeName || '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs font-medium">Route Code</p>
              <p className="text-white font-semibold text-sm mt-0.5 font-mono">{route.routeCode || '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
              <p className="text-white/60 text-xs font-medium">Capacity</p>
              <p className="text-white font-semibold text-sm mt-0.5">{bus.busCapacity ?? '—'} seats</p>
            </div>
          </div>
        </div>

        {/* Bus photo */}
        <div className="hidden md:flex items-center justify-center flex-shrink-0">
          {imgSrc(bus.busPhoto) ? (
            <img
              src={imgSrc(bus.busPhoto)}
              alt={bus.busName}
              className="w-48 h-36 object-cover rounded-2xl shadow-xl border-2 border-white/25"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`w-48 h-36 bg-white/10 rounded-2xl border-2 border-white/20 items-center justify-center ${imgSrc(bus.busPhoto) ? 'hidden' : 'flex'}`}>
            <Bus className="w-20 h-20 text-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats Row
// ─────────────────────────────────────────────────────────────────────────────

const StatsRow = ({ capacity, studentCount }) => {
  const cap       = safeNum(capacity);
  const occupied  = studentCount;
  const available = cap !== null ? Math.max(0, cap - occupied) : null;
  const pct       = cap ? Math.min(100, Math.round((occupied / cap) * 100)) : 0;

  const stats = [
    { label: 'Students',  value: occupied,       icon: Users,       bg: 'bg-violet-50',  ic: 'text-violet-600' },
    { label: 'Capacity',  value: cap ?? '—',     icon: Bus,         bg: 'bg-indigo-50',  ic: 'text-indigo-600' },
    { label: 'Occupied',  value: occupied,       icon: Armchair,    bg: 'bg-rose-50',    ic: 'text-rose-600'   },
    { label: 'Available', value: available ?? '—', icon: CheckCircle, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, bg, ic }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
          </div>
          {label === 'Occupied' && cap ? (
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          ) : <div className="h-1.5" />}
        </div>
      ))}
    </div>
  );
};

const TripStatusCard = ({ assignment, currentTrip, loading, actionLoading, error, nextDirection, readySchedule, onEnd, routeCompleted }) => {
  const bus = assignment?.bus || currentTrip?.bus || {};
  const route = assignment?.route || currentTrip?.route || {};
  const isActive = currentTrip?.status === 'Active';
  const direction = currentTrip?.direction || readySchedule?.direction || nextDirection;
  const idleLabel = readySchedule ? `${direction} Trip Ready` : 'Trip Ready';
  const idleDescription = readySchedule ? 'Start a trip to simulate' : 'Select a scheduled trip to start';
  const atFinalStop = Boolean(routeCompleted);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Navigation className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trip Status</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <p className={`text-lg font-bold ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>
                {isActive ? `${direction} Trip Active` : idleLabel}
              </p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {isActive
                  ? atFinalStop
                    ? 'Final stop reached'
                    : 'Simulation available'
                  : idleDescription}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {bus.busNumber || '—'} · {route.routeName || '—'}
              {isActive && currentTrip.startedAt && ` · Started ${new Date(currentTrip.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
            </p>
          </div>
        </div>

        {isActive && (
          atFinalStop ? (
            <button
              type="button"
              onClick={onEnd}
              disabled={loading || actionLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Please wait...' : 'End Trip'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnd}
              disabled={loading || actionLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Please wait...' : 'Cancel Trip'}
            </button>
          )
        )}
      </div>

      {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
    </div>
  );
};

const TodayScheduleSection = ({ date, dayOfWeek, schedules, loading, onStart, onPrepareReturn, canPrepareReturn, preparedReturnId }) => {
  const formatDate = (value) => value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : dayOfWeek;
  const statusStyles = {
    UPCOMING: 'bg-amber-50 text-amber-700 ring-amber-200',
    READY: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ACTIVE: 'bg-blue-50 text-blue-700 ring-blue-200',
    COMPLETED: 'bg-gray-100 text-gray-600 ring-gray-200',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Today's Schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">{dayOfWeek || 'Today'}{date ? `, ${formatDate(date)}` : ''}</p>
        </div>
        <Calendar className="w-5 h-5 text-indigo-500" />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((item) => <div key={item} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-700">No trips scheduled for today.</p>
          <p className="text-xs text-gray-400 mt-1">Your active schedule will appear here when one is assigned.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const assignment = schedule.assignment || {};
            const bus = assignment.bus || {};
            const route = assignment.route || {};
            const isActive = schedule.status === 'ACTIVE';
            const isReturn = schedule.direction === 'RETURN';
            const isPrepared = preparedReturnId === schedule._id;
            const canStart = schedule.status === 'UPCOMING' || schedule.status === 'READY';
            return (
              <div key={schedule._id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="min-w-[92px]">
                  <p className="text-lg font-bold text-gray-900">{schedule.startTime}</p>
                  <p className="text-xs text-gray-400">{schedule.direction}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{bus.busNumber || bus.busName || 'Assigned bus'}</p>
                  <p className="text-xs text-gray-500 truncate">{route.routeName || route.routeCode || 'Assigned route'}</p>
                </div>
                <span className={`inline-flex self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${statusStyles[schedule.status] || statusStyles.UPCOMING}`}>
                  {schedule.status}
                </span>
                {canStart && (
                  <button type="button" onClick={() => onStart(schedule._id)} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                    Start Trip
                  </button>
                )}
                {isReturn && canPrepareReturn && !isPrepared && (
                  <button type="button" onClick={() => onPrepareReturn(schedule._id)} className="px-3.5 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                    Prepare Return Trip
                  </button>
                )}
                {isPrepared && <span className="text-xs font-semibold text-amber-700">Return Trip Ready</span>}
                {isActive && <span className="text-xs font-semibold text-blue-700">Trip Active</span>}
                {schedule.status === 'COMPLETED' && <span className="text-xs font-semibold text-gray-500">Completed ✓</span>}
                {schedule.status === 'CANCELLED' && <span className="text-xs font-semibold text-red-600">Cancelled</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const RouteProgressCard = ({ progress, direction, onReset }) => {
  const currentStopIndex = progress?.currentStopIndex ?? 0;
  const currentStop = progress?.currentStop?.stopName || '—';
  const nextStop = progress?.nextStop?.stopName || 'Final stop';
  const percentage = progress?.progress ?? 0;
  const stopCount = progress?.stopCount || null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{direction} Route Progress</p>
          <p className="text-sm font-bold text-gray-800 mt-1">
            Stop {currentStopIndex + 1}{stopCount ? ` of ${stopCount}` : ''}
          </p>
        </div>
        {progress?.routeCompleted && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            Route Completed
          </span>
        )}
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs font-bold text-indigo-700 mt-1.5 text-right">{percentage}%</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <div>
          <p className="text-xs text-gray-400">Current Stop</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{progress?.routeCompleted ? `Final Stop: ${currentStop}` : currentStop}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Next Stop</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{progress?.routeCompleted ? '—' : nextStop}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Reset to First Stop
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Bus Details Card — horizontal grid layout
// ─────────────────────────────────────────────────────────────────────────────

const BusDetailsCard = ({ bus }) => {
  const photo = imgSrc(bus.busPhoto);

  const fields = [
    { label: 'Bus Name',        value: bus.busName,                icon: Bus      },
    { label: 'Bus Number',      value: bus.busNumber,              icon: Hash,    mono: true },
    { label: 'Reg. Number',     value: bus.busRegistrationNumber,  icon: Shield,  mono: true },
    { label: 'Type',            value: capitalize(bus.busType),    icon: Info     },
    { label: 'Capacity',        value: bus.busCapacity != null ? `${bus.busCapacity} seats` : '—', icon: Users },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Bus className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Bus Details</h2>
      </div>

      {/* Photo (if available) */}
      {photo && (
        <div className="mb-5 rounded-xl overflow-hidden border border-gray-100">
          <img src={photo} alt={bus.busName || 'Bus'} className="w-full h-40 object-cover" />
        </div>
      )}

      {/* Grid of detail tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {fields.map(({ label, value, icon: Icon, mono }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
            </div>
            <p className={`text-sm font-bold text-gray-800 truncate ${mono ? 'font-mono' : ''}`}>
              {value || '—'}
            </p>
          </div>
        ))}

        {/* Status tile — spans full width on its own row if fields count is odd */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <p className="text-xs text-gray-400 font-medium">Status</p>
          </div>
          <StatusBadge status={bus.busStatus || 'active'} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Route Details Card — stop timeline
// ─────────────────────────────────────────────────────────────────────────────

const RouteDetailsCard = ({ route }) => {
  const stops = [...(route.stops || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Route className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Route Details</h2>
          <p className="text-xs text-gray-500">{stops.length} stop{stops.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-violet-50 rounded-xl p-3.5 border border-violet-100">
          <p className="text-xs text-violet-400 font-medium mb-0.5">Route Name</p>
          <p className="text-sm font-bold text-violet-900">{route.routeName || '—'}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
          <p className="text-xs text-indigo-400 font-medium mb-0.5">Route Code</p>
          <p className="text-sm font-bold text-indigo-900 font-mono">{route.routeCode || '—'}</p>
        </div>
      </div>

      {stops.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No stops configured</p>
      ) : (
        <div>
          {stops.map((s, idx) => {
            const isFirst  = idx === 0;
            const isLast   = idx === stops.length - 1;
            const stopName = s.stop?.stopName || '—';
            const lat      = s.stop?.latitude;
            const lng      = s.stop?.longtitude;
            return (
              <div key={s._id || idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    isFirst ? 'bg-violet-600 ring-2 ring-violet-200'
                    : isLast ? 'bg-indigo-600 ring-2 ring-indigo-200'
                    : 'bg-gray-300'
                  }`} />
                  {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[24px]" />}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${
                        isFirst ? 'text-violet-700' : isLast ? 'text-indigo-700' : 'text-gray-700'
                      }`}>{stopName}</p>
                      {lat != null && lng != null && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                          {lat.toFixed(4)}, {lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0 border border-gray-100">
                      #{s.order}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Seat Map  —  3 + AISLE + 2  (vertical, front-to-back)
//
// Layout (viewed from above, front = top):
//
//   ┌─────────────────────────────────────┐
//   │  🚌  DRIVER                         │
//   ├─────────────────────────────────────┤
//   │  [01] [02] [03]  │  [04] [05]      │
//   │  [06] [07] [08]  │  [09] [10]      │
//   │  [11] [12] [13]  │  [14] [15]      │
//   │         ...      │   ...            │
//   ├─────────────────────────────────────┤
//   │  ┌───────────────────────────────┐  │
//   │  │  56   57   58   59   60   61  │  │
//   │  │         REAR  BENCH           │  │
//   │  └───────────────────────────────┘  │
//   │              REAR / EXIT            │
//   └─────────────────────────────────────┘
//
// Seat numbering: row by row, left-to-right across the full 5-seat row.
//   Row 1 → 1,2,3 (left) and 4,5 (right)
//   Row 2 → 6,7,8 (left) and 9,10 (right) … etc.
//
// Algorithm:
//   SEATS_PER_ROW = 5  (3 left + 2 right)
//   normalSeats   = largest multiple of 5 that fits in capacity
//   benchSeats    = capacity - normalSeats   (the remainder → rear bench)
//   If benchSeats === 0, last normal row doubles as the bench visually.
// ─────────────────────────────────────────────────────────────────────────────

const SEATS_PER_ROW = 5; // 3 left + 2 right

// ── Single seat button ────────────────────────────────────────────────────────
// Looks like a physical bus seat: seat-back bar at the top, icon, number.
const SeatBtn = ({ seatNum, isOccupied, isSelected, onClick }) => {
  const base =
    'group relative flex flex-col items-center justify-end pb-1.5 ' +
    'w-12 h-14 rounded-xl border-2 cursor-pointer select-none ' +
    'transition-all duration-150 overflow-hidden flex-shrink-0';

  const colorCls = isSelected
    ? 'bg-violet-600 border-violet-700 shadow-lg shadow-violet-200 scale-105'
    : isOccupied
    ? 'bg-rose-100 border-rose-300 hover:bg-rose-200 hover:scale-105'
    : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 hover:scale-105 shadow-sm';

  // Seat-back strip colour
  const backCls = isSelected
    ? 'bg-violet-800'
    : isOccupied
    ? 'bg-rose-300'
    : 'bg-emerald-200';

  // Icon / number colour
  const iconCls  = isSelected ? 'text-white'     : isOccupied ? 'text-rose-500'    : 'text-emerald-500';
  const numCls   = isSelected ? 'text-white'     : isOccupied ? 'text-rose-700'    : 'text-gray-600';

  return (
    <button
      className={`${base} ${colorCls}`}
      onClick={onClick}
      title={`Seat ${String(seatNum).padStart(2, '0')} — ${isOccupied ? 'Occupied' : 'Available'}`}
    >
      {/* Seat-back bar — thick strip at the very top */}
      <div className={`absolute top-0 left-0 right-0 h-3 rounded-t-xl ${backCls}`} />

      {/* Seat icon */}
      <Armchair className={`w-4 h-4 relative z-10 mb-0.5 ${iconCls}`} />

      {/* Seat number */}
      <span className={`text-[10px] font-bold leading-none relative z-10 ${numCls}`}>
        {String(seatNum).padStart(2, '0')}
      </span>
    </button>
  );
};

// ── Rear bench seat — wider, no individual border, sits inside the bench container
const BenchSeat = ({ seatNum, isOccupied, isSelected, onClick }) => {
  const colorCls = isSelected
    ? 'text-white'
    : isOccupied
    ? 'text-rose-600'
    : 'text-emerald-600';

  const bgCls = isSelected
    ? 'bg-violet-600 shadow-inner'
    : isOccupied
    ? 'bg-rose-100'
    : 'bg-emerald-50 hover:bg-emerald-100';

  return (
    <button
      className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg cursor-pointer transition-all select-none flex-1 min-w-[44px] ${bgCls}`}
      onClick={onClick}
      title={`Seat ${String(seatNum).padStart(2, '0')} — ${isOccupied ? 'Occupied' : 'Available'}`}
    >
      <Armchair className={`w-4 h-4 ${colorCls}`} />
      <span className={`text-[10px] font-bold leading-none ${colorCls}`}>
        {String(seatNum).padStart(2, '0')}
      </span>
    </button>
  );
};

// ── Main SeatMap ─────────────────────────────────────────────────────────────
const SeatMap = ({ capacity, students, onSeatClick }) => {
  const cap = safeNum(capacity) ?? 0;
  const [selected, setSelected] = useState(null);

  // Build occupiedMap: seatNumber → student record
  const occupiedMap = {};
  students.forEach(st => {
    if (st.seatNumber != null) occupiedMap[st.seatNumber] = st;
  });

  const handleClick = (seatNum) => {
    if (seatNum > cap) return;
    setSelected(prev => (prev === seatNum ? null : seatNum));
    onSeatClick(seatNum, occupiedMap[seatNum] || null);
  };

  if (cap === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Armchair className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Capacity not available</p>
      </div>
    );
  }

  // ── Layout algorithm ────────────────────────────────────────────────────────
  // How many full normal rows of 5 fit?
  const normalRowCount = Math.floor(cap / SEATS_PER_ROW);
  const normalSeatCount = normalRowCount * SEATS_PER_ROW;
  const benchSeatCount  = cap - normalSeatCount; // 0 … 4 remaining seats

  // Build normal rows: each row = [s1,s2,s3,s4,s5] (5 sequential seat numbers)
  const normalRows = Array.from({ length: normalRowCount }, (_, r) => {
    const start = r * SEATS_PER_ROW + 1;
    return [start, start + 1, start + 2, start + 3, start + 4];
  });

  // Bench seats follow sequentially after the last normal seat
  const benchSeats = Array.from({ length: benchSeatCount }, (_, i) => normalSeatCount + i + 1);

  const occupiedCount  = Object.keys(occupiedMap).filter(k => +k <= cap).length;
  const availableCount = Math.max(0, cap - occupiedCount);

  return (
    <div className="w-full">

      {/* ── Legend ── */}
      <div className="flex justify-center gap-5 mb-6 flex-wrap">
        {[
          { dot: 'bg-rose-400',    label: 'Occupied'  },
          { dot: 'bg-emerald-400', label: 'Available' },
          { dot: 'bg-violet-600',  label: 'Selected'  },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <span className={`w-3 h-3 rounded-full ${dot} inline-block`} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Bus body container ── */}
      <div className="overflow-x-auto">
        <div className="mx-auto" style={{ maxWidth: '520px', minWidth: '320px' }}>

          {/* ── FRONT / DRIVER section ── */}
          <div className="bg-gradient-to-r from-violet-700 to-indigo-700 rounded-t-3xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">DRIVER</p>
              <p className="text-violet-200 text-xs">Front of bus</p>
            </div>
            {/* Steering wheel hint */}
            <div className="ml-auto w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white/50" />
            </div>
          </div>

          {/* Thin partition between driver and seats */}
          <div className="h-1.5 bg-violet-900/20 border-x border-violet-200" />

          {/* ── PASSENGER AREA ── */}
          <div className="bg-gray-50 border-x-2 border-gray-300 px-4 py-3 space-y-2">

            {/* Column headers — helps orient the aisle */}
            <div className="flex items-center mb-1">
              <div className="flex gap-2 w-[calc(3*3rem+2*0.5rem)]">
                {/* 3 seats wide = 3×w-12 + 2×gap-2 */}
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase px-2">
                  aisle
                </span>
              </div>
              <div className="flex gap-2 w-[calc(2*3rem+1*0.5rem)]">
                {/* 2 seats wide */}
              </div>
            </div>

            {/* ── Normal rows  3 | aisle | 2 ── */}
            {normalRows.map((row, rowIdx) => {
              const left  = row.slice(0, 3); // seats [0],[1],[2]
              const right = row.slice(3, 5); // seats [3],[4]
              return (
                <div key={rowIdx} className="flex items-center gap-0">
                  {/* 3-seat left side */}
                  <div className="flex gap-2">
                    {left.map(sNum => (
                      <SeatBtn
                        key={sNum}
                        seatNum={sNum}
                        isOccupied={!!occupiedMap[sNum]}
                        isSelected={selected === sNum}
                        onClick={() => handleClick(sNum)}
                      />
                    ))}
                  </div>

                  {/* ── Central aisle ── */}
                  <div className="flex-1 flex items-center justify-center mx-1">
                    <div className="w-full h-full min-h-[3rem] bg-gray-200/60 rounded-sm" />
                  </div>

                  {/* 2-seat right side */}
                  <div className="flex gap-2">
                    {right.map(sNum => (
                      <SeatBtn
                        key={sNum}
                        seatNum={sNum}
                        isOccupied={!!occupiedMap[sNum]}
                        isSelected={selected === sNum}
                        onClick={() => handleClick(sNum)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

          </div>

          {/* ── REAR BENCH (remaining seats after full rows) ── */}
          {benchSeats.length > 0 && (
            <>
              {/* Dashed divider above bench */}
              <div className="border-x-2 border-gray-300 bg-gray-50 px-4 pb-1">
                <div className="border-t-2 border-dashed border-gray-300 pt-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                    <p className="text-center text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                      Rear Bench
                    </p>
                    <div className="flex items-stretch gap-1 bg-amber-100/60 rounded-xl p-1.5 border border-amber-200">
                      {benchSeats.map(sNum => (
                        <BenchSeat
                          key={sNum}
                          seatNum={sNum}
                          isOccupied={!!occupiedMap[sNum]}
                          isSelected={selected === sNum}
                          onClick={() => handleClick(sNum)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── REAR / EXIT ── */}
          <div className="h-1.5 bg-gray-400/20 border-x border-gray-300" />
          <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-b-3xl px-6 py-3 flex items-center justify-center shadow">
            <span className="text-white text-xs font-bold tracking-widest uppercase">
              ← Rear Exit
            </span>
          </div>

        </div>
      </div>

      {/* ── Seat statistics ── */}
      <div className="flex justify-center gap-6 mt-5 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
          <span className="text-gray-700 font-semibold">{occupiedCount}</span>
          <span className="text-gray-400 text-xs">Occupied</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
          <span className="text-gray-700 font-semibold">{availableCount}</span>
          <span className="text-gray-400 text-xs">Available</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
          <span className="text-gray-700 font-semibold">{cap}</span>
          <span className="text-gray-400 text-xs">Total</span>
        </div>
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Student Table
// ─────────────────────────────────────────────────────────────────────────────

const StudentTable = ({ students, onStudentClick }) => {
  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Students Assigned"
        description="There are currently no students assigned to your bus."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Seat', 'Student', 'Enrollment', 'Branch', 'Phone', 'Stop', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider first:rounded-tl-lg last:rounded-tr-lg">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const profile = s.student?.studentProfile || {};
              const stop    = s.preferredStop?.stopName || '—';
              return (
                <tr
                  key={s._id || idx}
                  className="border-b border-gray-50 hover:bg-violet-50/40 cursor-pointer transition-colors"
                  onClick={() => onStudentClick(s)}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-violet-100 text-violet-700 font-bold rounded-lg text-xs">
                      {s.seatNumber != null ? String(s.seatNumber).padStart(2, '0') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {(profile.name || s.student?.username || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-800">{profile.name || s.student?.username || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{profile.enrollmentNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{profile.branch || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{profile.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                      <MapPin className="w-3 h-3" />{stop}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} size="xs" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 p-4">
        {students.map((s, idx) => {
          const profile = s.student?.studentProfile || {};
          const stop    = s.preferredStop?.stopName || '—';
          return (
            <div
              key={s._id || idx}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer hover:border-violet-200 hover:bg-violet-50/30 transition-all"
              onClick={() => onStudentClick(s)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {(profile.name || s.student?.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{profile.name || s.student?.username || '—'}</p>
                    <p className="text-xs text-gray-400 font-mono">{profile.enrollmentNumber || '—'}</p>
                  </div>
                </div>
                {s.seatNumber != null && (
                  <span className="bg-violet-100 text-violet-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                    #{String(s.seatNumber).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile.branch && (
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{profile.branch}</span>
                )}
                <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-100">
                  <MapPin className="w-3 h-3" />{stop}
                </span>
                <StatusBadge status={s.status} size="xs" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Student Detail Modal (row click)
// ─────────────────────────────────────────────────────────────────────────────

const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;
  const profile = student.student?.studentProfile || {};
  const stop    = student.preferredStop?.stopName || '—';
  const name    = profile.name || student.student?.username || '—';

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title={name}
      subtitle={`Seat ${student.seatNumber != null ? String(student.seatNumber).padStart(2, '0') : '—'}`}
      size="md"
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
          </div>
        </div>

        <div>
          <SectionTitle>Student</SectionTitle>
          <div className="bg-gray-50 rounded-xl p-4 space-y-0">
            <InfoRow icon={User}     label="Full Name"         value={profile.name} />
            <InfoRow icon={Mail}     label="Email"             value={profile.email} />
            <InfoRow icon={Phone}    label="Phone"             value={profile.phone} />
            <InfoRow icon={BookOpen} label="Branch"            value={profile.branch} />
            <InfoRow icon={Hash}     label="Enrollment Number" value={profile.enrollmentNumber} mono />
          </div>
        </div>

        <div>
          <SectionTitle>Transport</SectionTitle>
          <div className="bg-gray-50 rounded-xl p-4 space-y-0">
            <InfoRow icon={Armchair} label="Seat Number"    value={student.seatNumber != null ? String(student.seatNumber).padStart(2, '0') : '—'} />
            <InfoRow icon={MapPin}   label="Preferred Stop" value={stop} />
            <div className="flex items-start gap-3 py-2.5">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Transport Status</p>
                <div className="mt-1"><StatusBadge status={student.status} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Seat Detail Modal (seat map click)
// ─────────────────────────────────────────────────────────────────────────────

const SeatDetailModal = ({ seatInfo, onClose }) => {
  if (!seatInfo) return null;
  const { seatNum, student } = seatInfo;
  const profile = student?.student?.studentProfile || {};
  const stop    = student?.preferredStop?.stopName || '—';
  const name    = profile.name || student?.student?.username;

  return (
    <Modal
      isOpen={!!seatInfo}
      onClose={onClose}
      title={`Seat ${String(seatNum).padStart(2, '0')}`}
      subtitle={student ? 'Occupied' : 'Available'}
      size="sm"
    >
      {student ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">{(name || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{name || '—'}</p>
              <p className="text-xs text-gray-500 font-mono">{profile.enrollmentNumber || '—'}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-0">
            <InfoRow icon={BookOpen} label="Branch"         value={profile.branch} />
            <InfoRow icon={Phone}    label="Phone"          value={profile.phone} />
            <InfoRow icon={MapPin}   label="Preferred Stop" value={stop} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100">
            <Armchair className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-semibold text-gray-700">Available</p>
          <p className="text-sm text-gray-400 mt-1">No student assigned to this seat.</p>
        </div>
      )}
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

const DriverMyBus = () => {
  const [assignment,      setAssignment]      = useState(null);
  const [todaySchedules,  setTodaySchedules]  = useState([]);
  const [todayDate,       setTodayDate]       = useState(null);
  const [todayDay,        setTodayDay]        = useState(null);
  const [todayLoading,    setTodayLoading]    = useState(true);
  const [students,        setStudents]        = useState([]);
  const [currentTrip,     setCurrentTrip]     = useState(null);
  const [lastTripDirection, setLastTripDirection] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [preparedReturn, setPreparedReturn] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);
  const [simulationResetSignal, setSimulationResetSignal] = useState(0);
  const [tripLoading,      setTripLoading]      = useState(true);
  const [tripActionLoading, setTripActionLoading] = useState(false);
  const [tripError,        setTripError]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [noAssignment,    setNoAssignment]    = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [seatInfo,        setSeatInfo]        = useState(null);
  const [confirmEarlyEnd, setConfirmEarlyEnd] = useState(false);

  const fetchTodaySchedule = useCallback(async () => {
    setTodayLoading(true);
    try {
      const response = await driverApi.getTodaySchedule();
      setTodaySchedules(response.data?.data || []);
      setTodayDate(response.data?.date || null);
      setTodayDay(response.data?.dayOfWeek || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setTodaySchedules([]);
        setTodayDate(null);
        setTodayDay(null);
      } else {
        setTripError(err.response?.data?.message || "Today's schedule could not be loaded.");
      }
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoAssignment(false);
    try {
      const [assignRes, studentsRes] = await Promise.allSettled([
        driverApi.getMyAssignment(),
        driverApi.getMyStudents(),
      ]);

      if (assignRes.status === 'fulfilled' && assignRes.value.data?.success) {
        setAssignment(assignRes.value.data.data);
      } else {
        const status = assignRes.reason?.response?.status;
        if (status === 404) setNoAssignment(true);
        else throw assignRes.reason || new Error('Failed to load assignment');
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data?.success) {
        setStudents(studentsRes.value.data.data || []);
      }

    } catch (err) {
      console.error('DriverMyBus fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    fetchTodaySchedule();
    const refreshTimer = setInterval(fetchTodaySchedule, 60000);
    return () => clearInterval(refreshTimer);
  }, [fetchTodaySchedule]);

  const fetchCurrentTrip = useCallback(async () => {
    setTripLoading(true);
    setTripError(null);

    try {
      const response = await tripApi.getCurrent();
      const trip = response.data?.data || null;
      setLastTripDirection(response.data?.lastDirection || trip?.direction || null);

      if (trip?.status === 'Active') {
        try {
          const locationResponse = await trackingApi.getBusLocation(trip.bus?._id || trip.bus);
          setInitialPosition(locationResponse.data?.data || null);
        } catch (locationError) {
          if (locationError.response?.status !== 404) {
            throw locationError;
          }
          setInitialPosition(null);
        }
      } else {
        setInitialPosition(null);
      }

      setCurrentTrip(trip);
    } catch (err) {
      console.error('Current trip fetch error:', err);
      setTripError(err.response?.data?.message || 'Unable to load trip status');
    } finally {
      setTripLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrentTrip(); }, [fetchCurrentTrip]);

  const handleStartTrip = async (scheduleId) => {
    if (!scheduleId) {
      setTripError("Today's active schedule could not be found.");
      return;
    }

    setTripActionLoading(true);
    setTripError(null);

    try {
      const response = await tripApi.start(scheduleId);
      const trip = response.data?.data || null;
      const movementStops = trip?.direction === 'RETURN'
        ? [...mapStops].reverse()
        : mapStops;

      setInitialPosition(null);
      setPreparedReturn(null);
      setRouteProgress({
        currentStopIndex: 0,
        currentStop: movementStops[0] || null,
        nextStop: movementStops[1] || null,
        progress: 0,
        routeCompleted: false,
        stopCount: movementStops.length,
      });
      setSimulationResetSignal((previous) => previous + 1);
      setCurrentTrip(trip);
      await fetchTodaySchedule();
    } catch (err) {
      console.error('Start trip error:', err);
      setTripError(err.response?.data?.message || 'Unable to start trip');
    } finally {
      setTripActionLoading(false);
    }
  };

  const handleResetSimulation = () => {
    const progressStops = currentTrip?.direction === 'RETURN'
      ? [...mapStops].reverse()
      : mapStops;
    setRouteProgress({
      currentStopIndex: 0,
      currentStop: progressStops[0] || null,
      nextStop: progressStops[1] || null,
      progress: 0,
      routeCompleted: false,
      stopCount: mapStops.length,
    });
    setSimulationResetSignal((previous) => previous + 1);
  };

  const handleEndTrip = async (force = false) => {
    const reachedFinalStop = routeProgress?.routeCompleted || initialPosition?.routeCompleted;
    if (!force && !reachedFinalStop) {
      setConfirmEarlyEnd(true);
      return;
    }

    setTripActionLoading(true);
    setTripError(null);

    try {
      await tripApi.end();
      setLastTripDirection(currentTrip?.direction || lastTripDirection || 'OUTBOUND');
      setCurrentTrip(null);
      setPreparedReturn(null);
      setRouteProgress(null);
      setInitialPosition(null);
      await fetchTodaySchedule();
    } catch (err) {
      console.error('End trip error:', err);
      setTripError(err.response?.data?.message || 'Unable to end trip');
    } finally {
      setTripActionLoading(false);
    }
  };

  const handlePrepareReturn = async (scheduleId) => {
    setTripActionLoading(true);
    setTripError(null);
    try {
      const response = await tripApi.prepareReturn(scheduleId);
      const location = response.data?.data?.location || null;
      const returnStops = [...mapStops].reverse();
      setPreparedReturn({ scheduleId, direction: 'RETURN', location });
      setInitialPosition(location);
      setRouteProgress({
        currentStopIndex: 0,
        currentStop: returnStops[0] || null,
        nextStop: returnStops[1] || null,
        progress: 0,
        routeCompleted: false,
        stopCount: returnStops.length,
      });
      setSimulationResetSignal((previous) => previous + 1);
    } catch (err) {
      setTripError(err.response?.data?.message || 'Unable to prepare return trip');
    } finally {
      setTripActionLoading(false);
    }
  };

  const handleSeatClick = (seatNum, student) => setSeatInfo({ seatNum, student });

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm">{error}</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (noAssignment || !assignment) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 border border-violet-100">
            <Bus className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Assignment</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            You currently don't have an active bus assignment. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const bus   = assignment.bus   || {};
  const route = assignment.route || {};

  // Format stops for TrackingMap
  const mapStops = (route?.stops || [])
    .map((s) => ({
      _id:       s.stop?._id,
      stopName:  s.stop?.stopName || s.stop?.name,
      latitude:  s.stop?.latitude,
      longtitude: s.stop?.longtitude ?? s.stop?.longitude, // Handles schema typo & standard property
      order:     s.order,
    }))
    .filter((s) => s.latitude != null && (s.longtitude != null || s.longitude != null))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const nextDirection = currentTrip?.direction === 'OUTBOUND'
    ? 'RETURN'
    : currentTrip?.direction === 'RETURN'
      ? 'OUTBOUND'
      : lastTripDirection === 'OUTBOUND'
        ? 'RETURN'
        : 'OUTBOUND';
  const nextSchedule = todaySchedules.find((schedule) => schedule.direction === nextDirection)
    || todaySchedules[0]
    || null;
  const outboundSchedule = todaySchedules.find((schedule) => schedule.direction === 'OUTBOUND');
  const returnSchedule = todaySchedules.find((schedule) => schedule.direction === 'RETURN');
  const canPrepareReturn = !currentTrip
    && lastTripDirection === 'OUTBOUND'
    && Boolean(returnSchedule?._id)
    && !['COMPLETED', 'CANCELLED'].includes(returnSchedule?.status)
    && ['COMPLETED', 'CANCELLED'].includes(outboundSchedule?.status);
  const readySchedule = todaySchedules.find((schedule) => (
    schedule.status === 'UPCOMING' || schedule.status === 'READY'
  )) || null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AssignmentHero assignment={assignment} />
      <StatsRow capacity={bus.busCapacity} studentCount={students.length} />
      <TodayScheduleSection
        date={todayDate}
        dayOfWeek={todayDay}
        schedules={todaySchedules}
        loading={todayLoading}
        onStart={handleStartTrip}
        onPrepareReturn={handlePrepareReturn}
        canPrepareReturn={canPrepareReturn}
        preparedReturnId={preparedReturn?.scheduleId}
      />
      <TripStatusCard
        assignment={assignment}
        currentTrip={currentTrip}
        loading={tripLoading}
        actionLoading={tripActionLoading}
        error={tripError}
        nextDirection={nextSchedule?.direction || nextDirection}
        readySchedule={readySchedule}
        onEnd={handleEndTrip}
        routeCompleted={routeProgress?.routeCompleted || initialPosition?.routeCompleted}
      />

      {currentTrip?.status === 'Active' && mapStops.length > 0 && (
        <RouteProgressCard
          progress={routeProgress}
          direction={currentTrip.direction || '—'}
          onReset={handleResetSimulation}
        />
      )}

      {/* ─── DRIVER TRACKING MAP WITH SIMULATION CONTROLS ─── */}
      {mapStops.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Trip Simulation</h2>
                <p className="text-xs text-gray-500">Demo bus movement along the assigned route</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
              OSRM Road Route
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px]">
                🚌
              </span>
              Simulated Bus
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px]">
                ▶
              </span>
              Start
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px]">
                ⚑
              </span>
              End
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block w-3 h-3 rounded-full bg-white border-2 border-indigo-500" />
              Stop
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block w-5 h-1 bg-blue-500 rounded" />
              Road Route
            </div>
          </div>

          {/* Map container */}
          <div className="h-[420px] sm:h-[480px]">
            <TrackingMap
              buses={[]}
              stops={mapStops}
              preferredStopId={null}
              busId={bus._id || bus.id}
              busLabel={bus.busNumber || bus.busName || 'BUS'}
              enableSimulation={Boolean(currentTrip || preparedReturn)}
              autoStartSimulation={Boolean(currentTrip)}
              simulationResetSignal={simulationResetSignal}
              onSimulationProgress={(progress) => setRouteProgress({ ...progress, stopCount: mapStops.length })}
              initialPosition={initialPosition}
              direction={currentTrip?.direction || preparedReturn?.direction || null}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <BusDetailsCard bus={bus} />
        <RouteDetailsCard route={route} />
      </div>

      {/* Seat Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Armchair className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Bus Seat Map</h2>
            <p className="text-xs text-gray-500">
              Click any seat to see details · {students.length} occupied ·{' '}
              {bus.busCapacity != null ? Math.max(0, bus.busCapacity - students.length) : '?'} available
              {bus.busCapacity != null ? ` of ${bus.busCapacity} total` : ''}
            </p>
          </div>
        </div>
        <SeatMap capacity={bus.busCapacity} students={students} onSeatClick={handleSeatClick} />
      </div>

      {/* Assigned Students */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Assigned Students</h2>
              <p className="text-xs text-gray-500">{students.length} student{students.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <StudentTable students={students} onStudentClick={setSelectedStudent} />
      </div>

      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <SeatDetailModal    seatInfo={seatInfo}        onClose={() => setSeatInfo(null)} />
      <ConfirmDialog
        isOpen={confirmEarlyEnd}
        onClose={() => setConfirmEarlyEnd(false)}
        onConfirm={() => { setConfirmEarlyEnd(false); handleEndTrip(true); }}
        title="Cancel this trip?"
        description="This trip has not reached the final stop. The current trip will be marked as Cancelled and the last bus location will be preserved."
        confirmLabel="Cancel Trip"
        loading={tripActionLoading}
      />
    </div>
  );
};

export default DriverMyBus;
