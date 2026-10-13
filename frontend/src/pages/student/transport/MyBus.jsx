import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, User, MapPin, Navigation, CreditCard, Shield,
  Armchair, AlertCircle, CheckCircle, Users, Hash,
  PhoneCall, GraduationCap, Route
} from 'lucide-react';
import transportRequestApi from '../../../api/transportRequestApi';
import { useToast } from '../../../context/ToastContext';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

/* ──────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
const imgUrl = resolveMediaUrl;

const resolveDriverName = (driver) =>
  driver?.driverProfile?.name || driver?.name || driver?.username || '—';

/* ──────────────────────────────────────────────────────────────
   Skeleton
─────────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-48 bg-gray-100 rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="h-52 bg-gray-100 rounded-3xl" />
      <div className="h-52 bg-gray-100 rounded-3xl" />
    </div>
    <div className="h-72 bg-gray-100 rounded-3xl" />
    <div className="h-96 bg-gray-100 rounded-3xl" />
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Not-assigned empty state
─────────────────────────────────────────────────────────────── */
const NotAssigned = ({ status }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5">
      <Bus className="w-10 h-10 text-gray-300" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">No Bus Assigned Yet</h3>
    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
      {status === 'Pending'
        ? 'Your transport request is pending. The admin will assign your bus, route, and seat shortly.'
        : "You don't have an approved transport assignment. Go to Transport to apply."}
    </p>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Small info chip
─────────────────────────────────────────────────────────────── */
const Chip = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-100 rounded-2xl p-4">
    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
      <Icon className="w-4 h-4 text-indigo-600" />
    </div>
    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-sm font-bold text-gray-900 leading-snug">{value || '—'}</p>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Route Journey Timeline
─────────────────────────────────────────────────────────────── */
const JourneyTimeline = ({ stops, preferredStopId }) => {
  const ordered = [...(stops || [])].sort((a, b) => a.order - b.order);
  if (!ordered.length)
    return <p className="text-sm text-gray-400 py-2">No stops available.</p>;

  return (
    <div className="space-y-0">
      {ordered.map((s, i) => {
        const isFirst  = i === 0;
        const isLast   = i === ordered.length - 1;
        const stopId   = s.stop?._id?.toString?.() || s.stop?.toString?.();
        const isMyStop = preferredStopId && stopId === preferredStopId.toString();
        const name     = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

        return (
          <div key={i} className="flex gap-3 items-stretch">
            <div className="flex flex-col items-center w-6 flex-shrink-0 pt-1">
              <div className={`rounded-full ring-2 ring-white flex-shrink-0 z-10 ${
                isMyStop
                  ? 'w-4 h-4 bg-indigo-600 ring-indigo-300'
                  : isFirst ? 'w-3 h-3 bg-emerald-500 ring-emerald-200'
                  : isLast  ? 'w-3 h-3 bg-red-400   ring-red-200'
                  :           'w-3 h-3 bg-gray-300   ring-gray-100'
              }`} />
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                  isMyStop ? 'bg-indigo-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-3">
              {isMyStop ? (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-indigo-700">{name}</p>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide">
                      Your Stop
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${
                    isFirst ? 'text-emerald-700' : isLast ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {name}
                    {isFirst && (
                      <span className="ml-2 text-[9px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                        Start
                      </span>
                    )}
                    {isLast && (
                      <span className="ml-2 text-[9px] uppercase tracking-wider font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                        End
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Bus Hero Card
─────────────────────────────────────────────────────────────── */
const BusHeroCard = ({ bus, totalOccupied, seatMapLoading }) => {
  const photo    = imgUrl(bus?.busPhoto);
  const capacity = bus?.busCapacity ?? 0;

  const statusCfg = {
    active:      { cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
    inactive:    { cls: 'bg-gray-100   text-gray-600   ring-gray-200',      dot: 'bg-gray-400',                  label: 'Inactive' },
    maintenance: { cls: 'bg-amber-100  text-amber-700  ring-amber-200',     dot: 'bg-amber-400',                 label: 'Maintenance' },
  };
  const sc = statusCfg[bus?.busStatus] ?? statusCfg.active;

  const occupancy = seatMapLoading ? null : totalOccupied;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* gradient header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {photo ? (
              <img
                src={photo}
                alt="Bus"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bus className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">
                Assigned Bus
              </p>
              <h2 className="text-white text-2xl font-extrabold leading-tight">
                {bus?.busNumber || '—'}
              </h2>
              {bus?.busName && bus.busName !== bus.busNumber && (
                <p className="text-indigo-200 text-sm font-medium mt-0.5">{bus.busName}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${sc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
        </div>
      </div>

      {/* details grid — no progress bar */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bus?.busRegistrationNumber && (
            <Chip icon={CreditCard} label="Reg. Number" value={bus.busRegistrationNumber} />
          )}
          {bus?.busType && (
            <Chip icon={Shield}     label="Bus Type"    value={bus.busType} />
          )}
          {capacity > 0 && (
            <Chip icon={Armchair}   label="Total Seats" value={`${capacity} Seats`} />
          )}
          {occupancy != null && (
            <Chip icon={Users}      label="Students"    value={`${occupancy} / ${capacity}`} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Driver Card
─────────────────────────────────────────────────────────────── */
const DriverCard = ({ driver }) => {
  const profile = driver?.driverProfile;
  const name    = resolveDriverName(driver);
  const photo   = imgUrl(profile?.photo);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
        <User className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Driver</h3>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-center gap-4 mb-5">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0 ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-indigo-300" />
            </div>
          )}
          <div>
            <p className="text-lg font-extrabold text-gray-900 leading-tight">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Your Assigned Driver</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {profile?.phone && (
            <Chip icon={PhoneCall}  label="Phone"      value={profile.phone} />
          )}
          {profile?.licenseId && (
            <Chip icon={CreditCard} label="License ID" value={profile.licenseId} />
          )}
          {profile?.age && (
            <Chip icon={Shield}     label="Age"        value={profile.age} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Route Card
─────────────────────────────────────────────────────────────── */
const RouteCard = ({ route, preferredStopId }) => {
  const name  = route?.routeName || route?.name || '—';
  const code  = route?.routeCode || null;
  const stops = route?.stops     || [];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Route</h3>
          </div>
          {code && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {code}
            </span>
          )}
        </div>
        <p className="text-xl font-extrabold text-gray-900 mt-2">{name}</p>
      </div>
      <div className="px-6 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Route Journey
        </p>
        <JourneyTimeline stops={stops} preferredStopId={preferredStopId} />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Seat Map  — horizontal Indian bus layout
   Bus viewed from above, scrolling LEFT → RIGHT
   Each COLUMN = one seat row of the bus: [A] [B] aisle [C] [D] [E]
   Last column = rear bench: all 5 seats no aisle
   Window seats: A (top wall) and E (bottom wall) get a window stripe
─────────────────────────────────────────────────────────────── */

/**
 * Single seat cell.
 * isWindow = true → outermost seat (A or E), gets a subtle window-glass stripe
 * position  = 'top' | 'bottom' → which side the window stripe appears
 */
const SeatCell = ({ seatNum, passenger, isMySeat, selected, onClick, isWindow = false, windowSide = 'top' }) => {
  const base = 'relative flex flex-col items-center justify-center w-11 h-11 rounded-xl border-2 font-bold text-xs transition-all duration-150 select-none overflow-hidden';

  const style = isMySeat
    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-1'
    : passenger
    ? `bg-violet-50 border-violet-300 text-violet-700 cursor-pointer hover:bg-violet-100 hover:border-violet-500 hover:shadow-sm${selected ? ' ring-2 ring-violet-400 ring-offset-1 bg-violet-100 border-violet-500' : ''}`
    : 'bg-white border-gray-200 text-gray-300 cursor-default';

  /* window stripe color */
  const winColor = isMySeat ? 'bg-indigo-300/60' : passenger ? 'bg-violet-200/70' : 'bg-sky-100';

  const tooltipTitle = isMySeat
    ? `Your Seat (${seatNum})`
    : passenger?.isMine
    ? `Your Seat (${seatNum})`
    : passenger
    ? `Occupied (Seat ${seatNum})`
    : `Available (Seat ${seatNum})`;

  return (
    <button
      type="button"
      onClick={() => (isMySeat || passenger) && onClick(seatNum)}
      className={`${base} ${style}`}
      title={tooltipTitle}
    >
      {/* seat-back notch at the left (front-facing) */}
      <span className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-lg ${
        isMySeat ? 'bg-indigo-400' : passenger ? 'bg-violet-200' : 'bg-gray-100'
      }`} />

      {/* window stripe — top or bottom edge */}
      {isWindow && (
        <span className={`absolute left-0 right-0 h-1.5 ${winColor} ${
          windowSide === 'top' ? 'top-0' : 'bottom-0'
        }`} />
      )}

      <span className="ml-1">{seatNum}</span>
    </button>
  );
};

/* ── Student detail panel ── */
const PassengerPanel = ({ passenger, onClose }) => {
  const isMine = Boolean(passenger?.isMine);
  const isDetailsAvailable = Boolean(isMine || passenger?.enrollmentNumber || passenger?.branch);

  return (
    <div className="mt-5 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-4 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-indigo-300 hover:text-indigo-600 transition-colors text-base leading-none"
        aria-label="Close"
      >✕</button>
      <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {passenger?.photo ? (
          <img src={imgUrl(passenger.photo)} alt={passenger.name || 'Seat'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-indigo-600 font-extrabold text-lg">
            {isMine ? (passenger?.name?.charAt(0)?.toUpperCase() || 'Y') : 'O'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1 pr-6">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-extrabold text-indigo-900 truncate">
            {isMine ? (passenger?.name || 'Your Seat') : (passenger?.name || 'Occupied Seat')}
          </p>
          {isMine ? (
            <span className="text-[9px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
              You
            </span>
          ) : (
            <span className="text-[9px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
              Occupied
            </span>
          )}
        </div>
        {isDetailsAvailable && passenger?.enrollmentNumber && (
          <div className="flex items-center gap-1.5 text-indigo-600">
            <Hash className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs font-semibold">{passenger.enrollmentNumber}</span>
          </div>
        )}
        {isDetailsAvailable && passenger?.branch && (
          <div className="flex items-center gap-1.5 text-indigo-500">
            <GraduationCap className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs font-medium">{passenger.branch}</span>
          </div>
        )}
        {!isMine && !passenger?.enrollmentNumber && (
          <p className="text-xs text-indigo-500/80">
            This seat is reserved. Passenger details are protected for student privacy.
          </p>
        )}
        <p className="text-[10px] text-indigo-400 font-medium">Seat {passenger?.seatNumber}</p>
      </div>
    </div>
  );
};

/* ── Legend dot ── */
const LegendDot = ({ color, label, stripe = false }) => (
  <div className="flex items-center gap-1.5">
    <span className={`relative w-4 h-4 rounded-md flex-shrink-0 border ${color}`}>
      {stripe && (
        <span className="absolute top-0 left-0 right-0 h-1 rounded-t-md bg-sky-200" />
      )}
    </span>
    <span className="text-xs text-gray-500 font-medium">{label}</span>
  </div>
);

/**
 * Builds COLUMN data for horizontal layout.
 * Bus scrolls left→right; each column = one physical row of bus seats.
 *   Normal col  → top: [A], [B] | aisle gap | [C], [D], [E] : bottom
 *   Last col    → full bench [A][B][C][D][E] stacked, no aisle
 * Returns array of column objects.
 */
const buildCols = (capacity) => {
  const SEATS_PER_COL = 5;
  const totalCols = Math.ceil(capacity / SEATS_PER_COL);
  const cols = [];

  for (let c = 0; c < totalCols; c++) {
    const isLast = c === totalCols - 1;
    const base   = c * SEATS_PER_COL + 1;
    const seats  = Array.from({ length: SEATS_PER_COL }, (_, i) => {
      const n = base + i;
      return n <= capacity ? n : null;
    });

    if (isLast) {
      cols.push({ type: 'last', seats });
    } else {
      // top 2 = window side A,B; bottom 3 = C,D,E (E is window)
      cols.push({ type: 'normal', top: seats.slice(0, 2), bottom: seats.slice(2, 5) });
    }
  }
  return cols;
};

/* ── Full SeatMapCard ── */
const SeatMapCard = ({ seatMapData, seatMapLoading, seatMapError, mySeatNumber: propMySeatNumber }) => {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const toggle = (n) => setSelectedSeat((p) => (p === n ? null : n));

  /* ── loading ── */
  if (seatMapLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-3">
        <div className="h-5 w-32 bg-gray-100 rounded" />
        <div className="flex gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-11 h-11 bg-gray-100 rounded-xl" />
              <div className="w-11 h-11 bg-gray-100 rounded-xl" />
              <div className="h-5" />
              <div className="w-11 h-11 bg-gray-100 rounded-xl" />
              <div className="w-11 h-11 bg-gray-100 rounded-xl" />
              <div className="w-11 h-11 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (seatMapError) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <p className="text-sm text-gray-500">{seatMapError}</p>
      </div>
    );
  }

  if (!seatMapData) return null;

  const capacity = Number(seatMapData?.busCapacity) || 0;
  const rawOccupied = seatMapData?.totalOccupied ?? (seatMapData?.occupiedSeats?.length ?? (seatMapData?.data?.length ?? 0));
  const totalOccupied = Number(rawOccupied) || 0;
  const available = Math.max(0, capacity - totalOccupied);
  const mySeatNumber = seatMapData?.mySeat ?? propMySeatNumber ?? null;

  const occupiedMap = {};
  (seatMapData?.data || []).forEach((p) => {
    if (p && p.seatNumber != null) {
      occupiedMap[p.seatNumber] = p;
    }
  });
  (seatMapData?.occupiedSeats || []).forEach((sn) => {
    if (sn != null && !occupiedMap[sn]) {
      occupiedMap[sn] = {
        seatNumber: sn,
        occupied: true,
        isMine: sn === mySeatNumber,
        name: 'Occupied'
      };
    }
  });

  const cols              = buildCols(capacity);
  const selectedPassenger = selectedSeat ? occupiedMap[selectedSeat] : null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Armchair className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bus Seat Map</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {mySeatNumber != null ? (
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Your Seat {mySeatNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                No Seat Assigned
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              {totalOccupied} Occupied
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {available} Free
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <LegendDot color="bg-indigo-600 border-indigo-600" label="Your Seat" />
          <LegendDot color="bg-violet-50 border-violet-300" label="Occupied — click for details" />
          <LegendDot color="bg-white border-gray-200" label="Available" />
          <LegendDot color="bg-white border-gray-200" label="Window Seat" stripe />
        </div>
      </div>

      {/* ── bus body ── */}
      <div className="px-5 py-5">

        {/* Bus shell — outer border representing the bus body */}
        <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">

          {/* top wall label */}
          <div className="absolute top-0 left-0 right-0 h-5 flex items-center px-3 bg-sky-50 border-b border-sky-100 z-10">
            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Window Side A</span>
          </div>

          {/* bottom wall label */}
          <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center px-3 bg-sky-50 border-t border-sky-100 z-10">
            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Window Side E</span>
          </div>

          {/* inner scrollable area */}
          <div className="overflow-x-auto pt-6 pb-6 px-3">
            <div className="inline-flex gap-0 items-stretch min-w-max">

              {/* ── Driver block (front of bus) ── */}
              <div className="flex flex-col items-center justify-center mr-3 flex-shrink-0">
                <div className="flex flex-col gap-2 items-center">
                  {/* top filler to align with top seats */}
                  <div className="h-11 w-11 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center gap-0.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="text-[8px] font-bold text-indigo-400 uppercase">Driver</span>
                  </div>
                  <div className="h-11 w-11" /> {/* B gap */}
                  {/* aisle label */}
                  <div className="h-7 flex items-center justify-center">
                    <span className="text-[8px] text-gray-300 font-semibold rotate-90 whitespace-nowrap">AISLE</span>
                  </div>
                  <div className="h-11 w-11" /> {/* C gap */}
                  <div className="h-11 w-11" /> {/* D gap */}
                  <div className="h-11 w-11" /> {/* E gap */}
                </div>
              </div>

              {/* ── Seat columns ── */}
              {cols.map((col, ci) => {
                const colNum = ci + 1;
                const isLastCol = col.type === 'last';

                return (
                  <div key={ci} className="flex flex-col items-center gap-0 flex-shrink-0">
                    {/* column number */}
                    <div className="h-0 w-11 relative">
                      <span className="absolute -top-4 left-0 right-0 text-center text-[9px] text-gray-300 font-semibold">
                        {colNum}
                      </span>
                    </div>

                    {isLastCol ? (
                      /* ── rear bench: all 5 stacked, no aisle ── */
                      <div className="flex flex-col gap-2 px-1.5">
                        {col.seats.map((n, si) =>
                          n ? (
                            <SeatCell
                              key={n}
                              seatNum={n}
                              passenger={occupiedMap[n] || null}
                              isMySeat={n === mySeatNumber || Boolean(occupiedMap[n]?.isMine)}
                              selected={selectedSeat === n}
                              onClick={toggle}
                              isWindow={si === 0 || si === 4}
                              windowSide={si === 0 ? 'top' : 'bottom'}
                            />
                          ) : (
                            <div key={`el-${ci}-${si}`} className="w-11 h-11" />
                          )
                        )}
                      </div>
                    ) : (
                      /* ── normal column: top-2 | aisle gap | bottom-3 ── */
                      <div className="flex flex-col gap-2 px-1.5">
                        {/* top 2 seats (A, B) */}
                        {col.top.map((n, si) =>
                          n ? (
                            <SeatCell
                              key={n}
                              seatNum={n}
                              passenger={occupiedMap[n] || null}
                              isMySeat={n === mySeatNumber || Boolean(occupiedMap[n]?.isMine)}
                              selected={selectedSeat === n}
                              onClick={toggle}
                              isWindow={si === 0}
                              windowSide="top"
                            />
                          ) : (
                            <div key={`et-${ci}-${si}`} className="w-11 h-11" />
                          )
                        )}

                        {/* aisle gap */}
                        <div className="h-7 flex items-center justify-center">
                          <div className="w-full border-t border-dashed border-gray-200" />
                        </div>

                        {/* bottom 3 seats (C, D, E) */}
                        {col.bottom.map((n, si) =>
                          n ? (
                            <SeatCell
                              key={n}
                              seatNum={n}
                              passenger={occupiedMap[n] || null}
                              isMySeat={n === mySeatNumber || Boolean(occupiedMap[n]?.isMine)}
                              selected={selectedSeat === n}
                              onClick={toggle}
                              isWindow={si === 2}
                              windowSide="bottom"
                            />
                          ) : (
                            <div key={`eb-${ci}-${si}`} className="w-11 h-11" />
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* student detail panel */}
        {selectedPassenger && (
          <PassengerPanel passenger={selectedPassenger} onClose={() => setSelectedSeat(null)} />
        )}

        <p className="mt-4 text-[10px] text-gray-400 text-center">
          Click your seat or an occupied seat to view details
        </p>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Assignment Summary
─────────────────────────────────────────────────────────────── */
const AssignmentSummary = ({ request, mySeatNumber }) => {
  const { assignment, preferredStop, status } = request;
  const bus    = assignment?.bus;
  const driver = assignment?.driver;
  const route  = assignment?.route;
  const resolvedSeat = mySeatNumber ?? request?.seatNumber;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Your Assignment</h3>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Chip icon={Bus}         label="Bus"       value={bus?.busNumber || bus?.busName} />
        <Chip icon={User}        label="Driver"    value={resolveDriverName(driver)} />
        <Chip icon={Route}       label="Route"     value={route?.routeName || route?.name} />
        <Chip icon={MapPin}      label="Your Stop" value={preferredStop?.stopName || preferredStop?.name} />
        <Chip icon={Armchair}    label="Seat"      value={resolvedSeat != null ? `Seat ${resolvedSeat}` : null} />
        <Chip icon={CheckCircle} label="Status"    value={status} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MyBus — Main Page
══════════════════════════════════════════════════════════════ */
const MyBus = () => {
  const { addToast } = useToast();

  const [request,        setRequest]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [seatMapData,    setSeatMapData]    = useState(null);
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  const [seatMapError,   setSeatMapError]   = useState(null);

  /* ── fetch main transport request ── */
  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transportRequestApi.getMyTransportRequest();
      setRequest(data?.data ?? null);
    } catch (err) {
      if (err.response?.status !== 404) {
        addToast(err.response?.data?.message || 'Failed to load transport data.', 'error');
      }
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── fetch seat map (only if approved) ── */
  const fetchSeatMap = useCallback(async () => {
    setSeatMapLoading(true);
    setSeatMapError(null);
    try {
      const { data } = await transportRequestApi.getBusSeatMap();
      setSeatMapData(data);
    } catch (err) {
      setSeatMapData(null);
      setSeatMapError(err.response?.data?.message || 'Bus seat map is currently unavailable.');
    } finally {
      setSeatMapLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  useEffect(() => {
    if (request?.status === 'Approved') fetchSeatMap();
  }, [request, fetchSeatMap]);

  /* ── derived ── */
  const isApproved  = request?.status === 'Approved';
  const bus         = request?.assignment?.bus;
  const driver      = request?.assignment?.driver;
  const route       = request?.assignment?.route;
  const preferredId = request?.preferredStop?._id;
  const mySeat      = request?.seatNumber;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Bus className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Bus</h1>
          <p className="text-sm text-gray-500">Your assigned university transportation</p>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : !isApproved ? (
        <NotAssigned status={request?.status} />
      ) : (
        <div className="space-y-5">
          {/* Cancellation-pending notice */}
          {request?.cancellationStatus === 'Pending' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-medium">
                Your cancellation request is pending admin approval. Your assignment is still active.
              </p>
            </div>
          )}

          {/* Section 1 — Bus hero (with occupancy) */}
          {bus && (
            <BusHeroCard
              bus={bus}
              totalOccupied={seatMapData?.totalOccupied ?? (seatMapData?.occupiedSeats?.length ?? null)}
              seatMapLoading={seatMapLoading}
            />
          )}

          {/* Section 2 + 3 — Driver & Route */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {driver && <DriverCard driver={driver} />}
            {route  && <RouteCard  route={route} preferredStopId={preferredId} />}
          </div>

          {/* Section 4 — Seat Map */}
          <SeatMapCard
            seatMapData={seatMapData}
            seatMapLoading={seatMapLoading}
            seatMapError={seatMapError}
            mySeatNumber={mySeat}
          />

          {/* Section 5 — Assignment summary */}
          <AssignmentSummary request={request} mySeatNumber={seatMapData?.mySeat ?? mySeat} />
        </div>
      )}
    </div>
  );
};

export default MyBus;
