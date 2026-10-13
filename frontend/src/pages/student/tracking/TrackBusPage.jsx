/**
 * TrackBusPage — Student "Track My Bus" — Phase 1
 *
 * Data source: GET /api/transport/my-transport-request
 *   (already returns bus, driver, route+stops, preferredStop, seatNumber, status)
 *   No new API endpoint needed.
 *
 * ── Phase 1 mock bus location ─────────────────────────────────────────────────
 *   MOCK_BUS_LOCATION is defined at the top of this file, clearly separated.
 *   Phase 2: remove MOCK_BUS_LOCATION and replace `busLocation` state with
 *            a value received from WebSocket (e.g. socket.on('bus-location', ...))
 *            or a polling API call to a backend GPS endpoint.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bus, User, MapPin, Navigation, CreditCard,
  Route, Hash, Shield, PhoneCall, Armchair,
  AlertCircle, CheckCircle, RefreshCw, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import transportRequestApi from '../../../api/transportRequestApi';
import studentApi from '../../../api/studentApi';
import trackingApi from '../../../api/trackingApi';
import { useToast } from '../../../context/ToastContext';
import TrackingMap from '../../../components/student/tracking/TrackingMap';
import { getLocationAgeLabel, getLocationStatus } from '../../../utils/locationStatus';
import {
  normalizeDirection,
  getDirectionAwareStops,
  getRouteTerminals,
  getRouteSummary,
} from '../../../utils/routeDirection';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
 
// ── Leaflet CSS (required once per app; safe to import here if not already global) ──
import 'leaflet/dist/leaflet.css';

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIGURATION
   ──────────────────────────────────────────────────────────────────────────── */
const LOCATION_POLL_INTERVAL = 3000; // 3 seconds

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────── */
const imgUrl = resolveMediaUrl;

const resolveDriverName = (driver) =>
  driver?.driverProfile?.name || driver?.name || driver?.username || '—';

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────────────── */

/** Small labelled chip used in info cards */
// eslint-disable-next-line no-unused-vars
const Chip = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-100 rounded-2xl p-4">
    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
      <Icon className="w-4 h-4 text-indigo-600" />
    </div>
    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-sm font-bold text-gray-900 leading-snug">{value || '—'}</p>
  </div>
);

/** Skeleton loading state */
const Skeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-[420px] bg-gray-100 rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="h-44 bg-gray-100 rounded-3xl" />
      <div className="h-44 bg-gray-100 rounded-3xl" />
      <div className="h-44 bg-gray-100 rounded-3xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="h-64 bg-gray-100 rounded-3xl" />
      <div className="h-64 bg-gray-100 rounded-3xl" />
    </div>
  </div>
);

/** Shown when the student has no approved transport */
const NoTransport = ({ status }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5">
      <Bus className="w-10 h-10 text-gray-300" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">No Bus Assigned Yet</h3>
    <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
      {status === 'Pending'
        ? 'Your transport request is under review. The admin will assign your bus, route and seat shortly.'
        : "You don't have an approved transport assignment. Apply from the Transport page."}
    </p>
    <Link
      to="/student/transport"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
    >
      <ExternalLink className="w-4 h-4" />
      Go to Transport
    </Link>
  </div>
);

/** Bus information card */
const BusInfoCard = ({ bus }) => {
  const statusCfg = {
    active:      { cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
    inactive:    { cls: 'bg-gray-100   text-gray-600   ring-gray-200',      dot: 'bg-gray-400',                  label: 'Inactive' },
    maintenance: { cls: 'bg-amber-100  text-amber-700  ring-amber-200',     dot: 'bg-amber-400',                 label: 'Maintenance' },
  };
  const sc = statusCfg[bus?.busStatus] ?? statusCfg.active;
  const photo = imgUrl(bus?.busPhoto);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {photo ? (
              <img src={photo} alt="Bus" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bus className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Your Bus</p>
              <p className="text-white text-lg font-extrabold leading-tight">{bus?.busNumber || '—'}</p>
              {bus?.busName && bus.busName !== bus.busNumber && (
                <p className="text-indigo-200 text-xs font-medium">{bus.busName}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${sc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
        </div>
      </div>
      {/* Details */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {bus?.busRegistrationNumber && (
          <Chip icon={CreditCard} label="Reg. Number" value={bus.busRegistrationNumber} />
        )}
        {bus?.busType && (
          <Chip icon={Shield} label="Bus Type" value={bus.busType} />
        )}
        {bus?.busCapacity > 0 && (
          <Chip icon={Armchair} label="Capacity" value={`${bus.busCapacity} Seats`} />
        )}
      </div>
    </div>
  );
};

/** Current bus trip and location summary */
const BusTripStatusCard = ({ bus, route, trip, location, direction = 'OUTBOUND' }) => {
  const status = trip?.status || 'NotStarted';
  const isActive = status === 'Active';
  const isCompleted = status === 'Completed';
  const isCancelled = status === 'Cancelled';
  const locationStatus = getLocationStatus(location?.updatedAt);
  const normDirection = normalizeDirection(direction);

  const statusConfig = isActive
    ? {
        label: location
          ? locationStatus.status === 'live'
            ? 'TRIP ACTIVE • LIVE'
            : locationStatus.status === 'stale'
              ? 'TRIP ACTIVE • LOCATION DELAYED'
              : 'TRIP ACTIVE • LOCATION OFFLINE'
          : 'TRIP ACTIVE • LOCATION UNAVAILABLE',
        message: location
          ? `${location.isMoving ? 'Moving' : 'Stopped'}${location.speed != null ? ` • ${location.speed} km/h` : ''}${locationStatus.status !== 'live' ? ` • ${locationStatus.label}` : ''}`
          : 'Trip is active, but bus location is not available yet.',
        cls: locationStatus.status === 'live'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : locationStatus.status === 'stale'
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-gray-50 border-gray-200 text-gray-600',
        dot: locationStatus.status === 'live'
          ? 'bg-emerald-500 animate-pulse'
          : locationStatus.status === 'stale' ? 'bg-amber-400' : 'bg-gray-400',
      }
    : isCompleted
      ? {
          label: 'TRIP COMPLETED',
          message: location
            ? "Today's trip has concluded. Bus marker displays last recorded position."
            : "Today's trip has ended.",
          cls: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-blue-500',
        }
      : isCancelled
        ? {
            label: 'TRIP CANCELLED',
            message: 'The trip was cancelled before reaching the final stop.',
            cls: 'bg-red-50 border-red-200 text-red-700',
            dot: 'bg-red-400',
          }
        : {
            label: 'TRIP NOT STARTED',
            message: 'Your bus trip has not started yet.',
            cls: 'bg-gray-50 border-gray-200 text-gray-600',
            dot: 'bg-gray-400',
          };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Bus className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-extrabold text-gray-900 truncate">
              {bus?.busNumber || '—'}
            </p>
            <span className="text-gray-300">•</span>
            <p className="text-sm text-gray-500 truncate">{route?.routeName || '—'}</p>
            <span className="text-gray-300">•</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {normDirection}
            </span>
          </div>
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide ${statusConfig.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
          <p className="text-sm text-gray-600 mt-3">{statusConfig.message}</p>
        </div>

        {isActive && location && (
          <div className="flex flex-col sm:items-end gap-1 text-xs text-gray-500">
            <span>{location.isMoving ? 'Moving' : 'Stopped'}{location.speed != null ? ` • ${location.speed} km/h` : ''}</span>
            {location.updatedAt && (
              <span>{locationStatus.label} • Updated {getLocationAgeLabel(location.updatedAt)}</span>
            )}
          </div>
        )}
        {isCompleted && location && (
          <div className="flex flex-col sm:items-end gap-1 text-xs text-blue-700">
            <span className="font-semibold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Last Known Position Preserved
            </span>
            {location.updatedAt && (
              <span className="text-gray-500">Completed • {getLocationAgeLabel(location.updatedAt)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Driver information card */
const DriverInfoCard = ({ driver }) => {
  const profile = driver?.driverProfile;
  const name    = resolveDriverName(driver);
  const photo   = imgUrl(profile?.photo);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
        <User className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Driver</h3>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          {photo ? (
            <img src={photo} alt={name} className="w-14 h-14 rounded-2xl object-cover bg-gray-100 flex-shrink-0 ring-2 ring-gray-100" />
          ) : (
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-indigo-300" />
            </div>
          )}
          <div>
            <p className="text-base font-extrabold text-gray-900 leading-tight">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Assigned Driver</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {profile?.phone && (
            <Chip icon={PhoneCall} label="Phone" value={profile.phone} />
          )}
          {profile?.licenseId && (
            <Chip icon={CreditCard} label="License ID" value={profile.licenseId} />
          )}
        </div>
      </div>
    </div>
  );
};

/** Route information card */
const RouteInfoCard = ({ route, routeStats, direction = 'OUTBOUND' }) => {
  const normDirection = normalizeDirection(direction);
  const { origin, destination } = getRouteTerminals(route?.stops || [], normDirection);
  const startName = origin?.stopName || origin?.name || '—';
  const endName   = destination?.stopName  || destination?.name  || '—';
  const stopsCount = (route?.stops || []).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Route</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            {normDirection}
          </span>
          {route?.routeCode && (
            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
              {route.routeCode}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-lg font-extrabold text-gray-900 mb-3">
          {route?.routeName || route?.name || '—'}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Chip icon={Navigation} label="From" value={startName} />
          <Chip icon={MapPin}     label="To"   value={endName} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Chip icon={Hash} label="Total Stops" value={`${stopsCount} Stops`} />
          <Chip
            icon={Route}
            label="Road Distance"
            value={routeStats?.distance ? `${(routeStats.distance / 1000).toFixed(1)} km` : 'OSRM Tracked'}
          />
        </div>
      </div>
    </div>
  );
};

/** Stop list — shows all stops, highlights student's stop */
const StopListCard = ({ route, preferredStopId, location, tripStatus, direction = 'OUTBOUND' }) => {
  const normDirection = normalizeDirection(direction);
  const stops = getDirectionAwareStops(route?.stops || [], normDirection);
  if (!stops.length) return null;

  const isActive = tripStatus?.status === 'Active';
  const isCompleted = tripStatus?.status === 'Completed' || location?.routeCompleted;

  let currentStop = null;
  let nextStop = null;
  let progress = 0;
  let displayCurrentStopId = null;
  let currentStopIndex = -1;

  if (isActive && location) {
    const currentStopId = location?.currentStopId?.toString?.() || null;
    currentStopIndex = stops.findIndex((s) => (
      (s.stop?._id?.toString?.() || s.stop?.id?.toString?.() || s._id?.toString()) === currentStopId
    ));
    progress = Math.min(100, Math.max(0, Number(location?.routeProgress ?? 0)));
    currentStop = currentStopIndex >= 0 ? stops[currentStopIndex]?.stop : null;
    displayCurrentStopId = currentStopId;

    const nextStopId = location?.nextStopId?.toString?.() || null;
    const nextStopFromId = nextStopId
      ? stops.find((s) => (s.stop?._id?.toString?.() || s.stop?.id?.toString?.() || s._id?.toString()) === nextStopId)?.stop
      : null;
    nextStop = nextStopFromId || (currentStopIndex >= 0 && currentStopIndex < stops.length - 1 ? stops[currentStopIndex + 1]?.stop : null);
  } else if (isCompleted) {
    progress = 100;
    currentStopIndex = stops.length - 1;
    currentStop = stops[stops.length - 1]?.stop;
    displayCurrentStopId = stops[stops.length - 1]?.stop?._id?.toString?.() || stops[stops.length - 1]?.stop?.id?.toString?.() || stops[stops.length - 1]?._id?.toString();
    nextStop = null;
  } else {
    // Unstarted / Scheduled
    progress = 0;
    currentStopIndex = 0;
    currentStop = stops[0]?.stop;
    displayCurrentStopId = stops[0]?.stop?._id?.toString?.() || stops[0]?.stop?.id?.toString?.() || stops[0]?._id?.toString();
    nextStop = stops.length > 1 ? stops[1]?.stop : null;
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Route Stops</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            {normDirection}
          </span>
          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {stops.length} stops
          </span>
        </div>
      </div>
      
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
          <span>Route Progress</span>
          <span className="text-indigo-700">{progress}%</span>
        </div>
        <div className="w-full h-2 mt-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
          <p className="text-gray-500">
            Current Stop: <strong className="text-gray-800">{currentStop?.stopName || currentStop?.name || '—'}</strong>
          </p>
          <p className="text-gray-500">
            Next Stop: <strong className="text-gray-800">{isCompleted ? 'Route Completed' : (nextStop?.stopName || nextStop?.name || '—')}</strong>
          </p>
        </div>
        {isCompleted && <p className="text-xs font-bold text-emerald-700 mt-2">Route Completed</p>}
      </div>

      <div className="px-5 py-4 space-y-0">
        {stops.map((s, i) => {
          const isFirst  = i === 0;
          const isLast   = i === stops.length - 1;
          const stopId   = s.stop?._id?.toString?.() || s.stop?.id?.toString?.() || s._id?.toString();
          const isMyStop = preferredStopId && stopId === preferredStopId?.toString();
          const isCurrent = displayCurrentStopId && stopId === displayCurrentStopId;
          const isPassed = currentStopIndex >= 0 && i < currentStopIndex;
          const name     = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

          return (
            <div key={stopId || i} className="flex gap-3 items-stretch">
              {/* Timeline connector */}
              <div className="flex flex-col items-center w-6 flex-shrink-0 pt-1">
                <div className={`rounded-full ring-2 ring-white flex-shrink-0 z-10 ${
                  isCurrent ? 'w-4 h-4 bg-indigo-600 ring-indigo-200'
                  : isMyStop  ? 'w-4 h-4 bg-amber-400 ring-amber-200'
                  : isFirst ? 'w-3 h-3 bg-emerald-500 ring-emerald-200'
                  : isLast  ? 'w-3 h-3 bg-red-400   ring-red-200'
                  :           'w-3 h-3 bg-gray-300   ring-gray-100'
                }`} />
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${isPassed ? 'bg-indigo-200' : isMyStop ? 'bg-amber-200' : 'bg-gray-200'}`} />
                )}
              </div>
              {/* Stop label */}
              <div className="flex-1 pb-3">
                {isCurrent ? (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                    <span className="text-sm">🚌</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-indigo-700 truncate">{name}</p>
                      <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wide">
                        {isCompleted ? 'Final Destination' : isActive ? 'Current Stop' : 'Starting Stop'}
                      </p>
                    </div>
                    {isMyStop && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                        Your Stop ⭐
                      </span>
                    )}
                  </div>
                ) : isMyStop ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span className="text-sm">⭐</span>
                    <div>
                      <p className="text-sm font-bold text-amber-700">{name}</p>
                      <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Your Stop</p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-0.5">
                    <p className={`text-sm font-medium ${
                      isPassed ? 'text-indigo-600 font-semibold' : isFirst ? 'text-emerald-700' : isLast ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {name}
                      {isFirst && <span className="ml-2 text-[9px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">Start</span>}
                      {isLast  && <span className="ml-2 text-[9px] uppercase tracking-wider font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded">End</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Student assignment summary — your stop, seat, status */
const StudentInfoCard = ({ request }) => {
  const stopName = request?.preferredStop?.stopName || request?.preferredStop?.name || '—';
  const seat     = request?.seatNumber ?? null;
  const status   = request?.status ?? '—';

  const statusCfg = {
    Approved: { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
    Pending:  { cls: 'bg-amber-100  text-amber-700',  dot: 'bg-amber-400',  icon: AlertCircle },
    Rejected: { cls: 'bg-red-100    text-red-700',    dot: 'bg-red-400',    icon: AlertCircle },
  };
  const sc = statusCfg[status] || { cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', icon: AlertCircle };
  const StatusIcon = sc.icon;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">My Journey</h3>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preferred stop */}
          <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <span className="text-sm">⭐</span>
            </div>
            <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">My Stop</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">{stopName}</p>
          </div>

          {/* Seat number */}
          <div className="flex flex-col gap-1.5 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Armchair className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Seat No.</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">
              {seat != null ? `Seat ${seat}` : 'Not assigned'}
            </p>
          </div>

          {/* Transport status */}
          <div className={`flex flex-col gap-1.5 rounded-2xl p-4 border ${sc.cls} border-current/20`}>
            <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <StatusIcon className={`w-4 h-4 ${sc.cls.split(' ')[1]}`} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Status</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              <p className="text-sm font-bold leading-snug">{status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Map section wrapper (handles the map height + Leaflet CSS)
   ──────────────────────────────────────────────────────────────────────────── */
const MapSection = ({ 
  busLocation, 
  stops, 
  preferredStopId, 
  onRouteCalculated, 
  busId, 
  busLabel,
  locationSyncStatus,
  lastLocationSyncTime,
  direction = 'OUTBOUND',
}) => {
  const isTripCompleted = locationSyncStatus === 'Trip completed' || busLocation?.routeCompleted;

  // Helper to format sync status color
  const getSyncStatusColor = () => {
    if (!locationSyncStatus) return 'text-gray-500';
    if (locationSyncStatus === 'Synced') return 'text-emerald-600';
    if (locationSyncStatus === 'Trip completed') return 'text-blue-600 font-semibold';
    if (locationSyncStatus.includes('Waiting')) return 'text-amber-600';
    if (locationSyncStatus.includes('expired') || locationSyncStatus.includes('error')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isTripCompleted ? 'bg-blue-500' : 'bg-indigo-500 animate-pulse'}`} />
        <h3 className="text-sm font-semibold text-gray-900">{isTripCompleted ? 'Trip Completed (Last Location Preserved)' : 'Live Map'}</h3>
        {locationSyncStatus && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300">|</span>
            <span className={`text-xs font-medium ${getSyncStatusColor()}`}>
              {locationSyncStatus}
            </span>
            {lastLocationSyncTime && locationSyncStatus === 'Synced' && (
              <span className="text-xs text-gray-400">
                ({Math.round((Date.now() - lastLocationSyncTime) / 1000)}s ago)
              </span>
            )}
          </div>
        )}
      </div>
      {/* Route engine badge */}
      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
        OSRM Road Route
      </span>
    </div>

    {/* Legend */}
    <div className="flex flex-wrap gap-4 px-5 py-3 border-b border-gray-50 bg-gray-50/50">
      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${isTripCompleted ? 'bg-blue-600' : 'bg-indigo-600'} text-white text-[10px]`}>
          🚌
        </span>
        {isTripCompleted ? 'Last Known Position' : 'Live Bus'}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-700 text-amber-300 text-[10px] ring-1 ring-indigo-400">
          ★
        </span>
        Your Stop
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
        busLocation={busLocation}
        stops={stops}
        preferredStopId={preferredStopId}
        onRouteCalculated={onRouteCalculated}
        busId={busId}
        busLabel={busLabel}
        enableSimulation={false}
        direction={direction}
      />
    </div>
  </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main page component
   ──────────────────────────────────────────────────────────────────────────── */
const TrackBusPage = () => {
  const { addToast } = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [routeStats, setRouteStats] = useState(null);

  // ── PHASE 2: Live bus location from backend ──────────────────────────────
  const [busLocation, setBusLocation] = useState(null);
  const [busTripStatus, setBusTripStatus] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [locationSyncStatus, setLocationSyncStatus] = useState('Connecting...');
  const [lastLocationSyncTime, setLastLocationSyncTime] = useState(null);
  const locationPollRef = useRef(null);
  const isMountedRef = useRef(true);

  /* ── Callback to capture OSRM route metrics ── */
  const handleRouteCalculated = useCallback((stats) => {
    if (stats && !stats.isFallback) {
      setRouteStats(stats);
    }
  }, []);

  /* ── Fetch the student's transport request and schedule details ── */
  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, schRes] = await Promise.allSettled([
        transportRequestApi.getMyTransportRequest(),
        studentApi.getMySchedules(),
      ]);

      const requestData = reqRes.status === 'fulfilled' ? (reqRes.value?.data?.data ?? null) : null;
      const schData = schRes.status === 'fulfilled' ? (schRes.value?.data?.data ?? null) : null;

      setRequest(requestData);
      setScheduleData(schData);
    } catch (err) {
      if (err.response?.status === 404) {
        setRequest(null);
      } else {
        const msg = err.response?.data?.message || 'Failed to load transport data.';
        addToast(msg, 'error');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  /* ── Fetch combined trip and location status ── */
  const fetchBusStatus = useCallback(async (busId) => {
    if (!busId) {
      return;
    }

    try {
      const { data } = await trackingApi.getBusStatus(busId);
      
      if (!isMountedRef.current) {
        return;
      }

      const statusData = data?.data;
      const locationData = statusData?.location;
      const tripData = statusData?.trip;
      setBusTripStatus(tripData);

      if (tripData?.status === 'Active' && locationData && locationData.latitude != null && locationData.longitude != null) {
        setBusLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed ?? 0,
          heading: locationData.heading ?? 0,
          isMoving: locationData.isMoving ?? false,
          currentStopIndex: locationData.currentStopIndex ?? 0,
          currentStopId: locationData.currentStopId ?? null,
          nextStopId: locationData.nextStopId ?? null,
          routeProgress: locationData.routeProgress,
          routeCompleted: locationData.routeCompleted ?? false,
          updatedAt: locationData.updatedAt,
        });
        setLocationSyncStatus('Synced');
        setLastLocationSyncTime(new Date());

        // Ensure interval is running during active trip
        if (!locationPollRef.current && isMountedRef.current) {
          locationPollRef.current = setInterval(() => {
            if (isMountedRef.current) {
              fetchBusStatus(busId);
            }
          }, LOCATION_POLL_INTERVAL);
        }
      } else if (tripData?.status === 'Active') {
        setBusLocation((prev) => prev);
        setLocationSyncStatus('Waiting for bus...');
      } else if (tripData?.status === 'Completed') {
        // Preserve last valid location from backend or previous state
        setBusLocation((prev) => {
          if (locationData && locationData.latitude != null && locationData.longitude != null) {
            return {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              speed: 0,
              heading: locationData.heading ?? prev?.heading ?? 0,
              isMoving: false,
              currentStopIndex: locationData.currentStopIndex ?? prev?.currentStopIndex ?? 0,
              currentStopId: locationData.currentStopId ?? prev?.currentStopId ?? null,
              nextStopId: null,
              routeProgress: 100,
              routeCompleted: true,
              updatedAt: locationData.updatedAt || prev?.updatedAt,
            };
          }
          if (prev && prev.latitude != null && prev.longitude != null) {
            return {
              ...prev,
              speed: 0,
              isMoving: false,
              nextStopId: null,
              routeProgress: 100,
              routeCompleted: true,
            };
          }
          return null;
        });
        setLocationSyncStatus('Trip completed');
        // Stop live polling when trip is completed
        if (locationPollRef.current) {
          clearInterval(locationPollRef.current);
          locationPollRef.current = null;
        }
      } else if (tripData?.status === 'Cancelled') {
        setBusLocation((prev) => (prev ? { ...prev, speed: 0, isMoving: false } : null));
        setLocationSyncStatus('Trip cancelled');
        if (locationPollRef.current) {
          clearInterval(locationPollRef.current);
          locationPollRef.current = null;
        }
      } else {
        setBusLocation(null);
        setLocationSyncStatus('Trip not started');
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.message || 'Failed to fetch bus location';

      console.error('[TrackBusPage] API Error:', {
        status,
        message: errorMsg,
      });

      if (status === 404) {
        setBusTripStatus(null);
        setLocationSyncStatus('Waiting for bus...');
      } else if (status === 401) {
        setLocationSyncStatus('Authentication expired');
      } else if (status === 403) {
        setLocationSyncStatus('Not authorized');
      } else if (status >= 500) {
        setLocationSyncStatus('Server error');
      } else {
        setLocationSyncStatus('Connection failed');
      }
    }
  }, []);

  /* ── Derived values ── */
  const isApproved    = request?.status === 'Approved';
  const bus           = request?.assignment?.bus ?? null;
  const driver        = request?.assignment?.driver ?? null;
  const route         = request?.assignment?.route ?? null;
  const preferredId   = request?.preferredStop?._id ?? null;
  const realBusId     = bus?._id || bus?.id || null;
  const realBusLabel  = bus?.busNumber || bus?.busName || 'BUS 101';

  // Effective direction: Active trip has priority; otherwise check today's next scheduled trip
  const effectiveDirection = busTripStatus?.status === 'Active'
    ? (busTripStatus.direction || 'OUTBOUND')
    : (scheduleData?.nextTrip?.direction || busTripStatus?.direction || 'OUTBOUND');

  /* ── Poll bus location every LOCATION_POLL_INTERVAL ms ── */
  useEffect(() => {
    const realBusId = bus?._id || bus?.id || null;
    
    if (!realBusId) {
      if (!loading) {
        setLocationSyncStatus('Bus not assigned');
      }
      return;
    }

    // Fetch immediately on component mount
    fetchBusStatus(realBusId);

    // Clean existing interval before starting new one
    if (locationPollRef.current) {
      clearInterval(locationPollRef.current);
      locationPollRef.current = null;
    }

    locationPollRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchBusStatus(realBusId);
      }
    }, LOCATION_POLL_INTERVAL);

    return () => {
      if (locationPollRef.current) {
        clearInterval(locationPollRef.current);
        locationPollRef.current = null;
      }
    };
  }, [bus, loading, fetchBusStatus]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (locationPollRef.current) {
        clearInterval(locationPollRef.current);
        locationPollRef.current = null;
      }
    };
  }, []);

  /* ── Live bus location from backend polling (replaces mock) ── */
  const liveMapBusLocation = busLocation
    ? {
        ...busLocation,
        label: realBusLabel,
        isCompleted: busTripStatus?.status === 'Completed' || busLocation.routeCompleted,
      }
    : null;

  /* Flatten route stops into the shape TrackingMap expects */
  const mapStops = (route?.stops || [])
    .map((s) => ({
      _id:       s.stop?._id,
      stopName:  s.stop?.stopName || s.stop?.name,
      latitude:  s.stop?.latitude,
      longtitude: s.stop?.longtitude ?? s.stop?.longitude, // Handles schema typo & standard property
      order:     s.order,
    }))
    .filter((s) => s.latitude != null && (s.longtitude != null || s.longitude != null));

  /* ── Render ── */
  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Navigation className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Track My Bus</h1>
            <p className="text-sm text-gray-500">Real-time location of your assigned bus</p>
          </div>
        </div>
        {/* Refresh button */}
        <button
          onClick={fetchRequest}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && <Skeleton />}

      {/* ── API Error ── */}
      {!loading && error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load tracking data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── No approved transport ── */}
      {!loading && !error && !isApproved && (
        <NoTransport status={request?.status} />
      )}

      {/* ── Main tracking UI (only when approved) ── */}
      {!loading && !error && isApproved && (
        <div className="space-y-5">
          <BusTripStatusCard
            bus={bus}
            route={route}
            trip={busTripStatus}
            location={busLocation}
            direction={effectiveDirection}
          />

          <MapSection
            busLocation={liveMapBusLocation}
            stops={mapStops}
            preferredStopId={preferredId}
            onRouteCalculated={handleRouteCalculated}
            busId={realBusId}
            busLabel={realBusLabel}
            locationSyncStatus={locationSyncStatus}
            lastLocationSyncTime={lastLocationSyncTime}
            direction={effectiveDirection}
          />

          {/* Student journey summary */}
          <StudentInfoCard request={request} />

          {/* Bus + Driver + Route info — 3-column grid on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {bus    && <BusInfoCard    bus={bus} />}
            {driver && <DriverInfoCard driver={driver} />}
            {route  && <RouteInfoCard  route={route} routeStats={routeStats} direction={effectiveDirection} />}
          </div>

          {/* Full stop list */}
          {route && (
            <StopListCard
              route={route}
              preferredStopId={preferredId}
              location={busLocation}
              tripStatus={busTripStatus}
              direction={effectiveDirection}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TrackBusPage;
