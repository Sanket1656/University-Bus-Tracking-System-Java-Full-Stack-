import React from 'react';
import {
  Bus, User, Route, MapPin, Hash, CheckCircle,
  AlertCircle, Armchair, Navigation
} from 'lucide-react';

/* ── helper: resolve driver name from populated driver object ── */
const resolveDriverName = (driver) =>
  driver?.driverProfile?.name ||
  driver?.studentProfile?.name ||
  driver?.name ||
  driver?.username ||
  '—';

/* ── Info chip used in the 4-up summary grid ── */
const InfoChip = ({ icon: Icon, label, value, accent = false }) => (
  <div className={`flex flex-col gap-1.5 p-4 rounded-2xl border ${
    accent
      ? 'bg-indigo-600 border-indigo-500 text-white'
      : 'bg-white border-gray-100 shadow-sm'
  }`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
      accent ? 'bg-white/20' : 'bg-indigo-50'
    }`}>
      <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-indigo-600'}`} />
    </div>
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? 'text-indigo-200' : 'text-gray-400'}`}>
        {label}
      </p>
      <p className={`text-sm font-bold leading-tight mt-0.5 ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

/* ── Route journey timeline ── */
const JourneyTimeline = ({ stops = [], preferredStopId }) => {
  const ordered = [...stops].sort((a, b) => a.order - b.order);
  if (!ordered.length) return (
    <p className="text-sm text-gray-400 py-2">No route stops available.</p>
  );

  return (
    <div className="space-y-0">
      {ordered.map((s, i) => {
        const isFirst   = i === 0;
        const isLast    = i === ordered.length - 1;
        const stopId    = s.stop?._id?.toString?.() || s.stop?.id?.toString?.() || (typeof s.stop === 'string' || typeof s.stop === 'number' ? s.stop.toString() : '');
        const isMyStop  = preferredStopId && stopId && stopId === preferredStopId.toString();
        const name      = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

        return (
          <div key={i} className="flex gap-3 items-stretch">
            {/* Connector column */}
            <div className="flex flex-col items-center w-6 flex-shrink-0 pt-1">
              <div className={`w-3 h-3 rounded-full ring-2 ring-white flex-shrink-0 z-10 ${
                isMyStop
                  ? 'bg-indigo-600 ring-indigo-300 w-4 h-4'
                  : isFirst
                  ? 'bg-emerald-500 ring-emerald-200'
                  : isLast
                  ? 'bg-red-400 ring-red-200'
                  : 'bg-gray-300 ring-gray-100'
              }`} />
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                  isMyStop ? 'bg-indigo-200' : 'bg-gray-200'
                }`} />
              )}
            </div>

            {/* Stop label */}
            <div className={`flex-1 pb-3 ${isMyStop ? 'mb-1' : ''}`}>
              {isMyStop ? (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-indigo-700 truncate">{name}</p>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide">Your Stop</p>
                  </div>
                </div>
              ) : (
                <div className="pt-0.5 pb-1">
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

/**
 * ApprovedTransportCard
 *
 * Props:
 *   request        – full transport request object (status === 'Approved')
 *   onChangeStop   – () => void
 *   onCancel       – () => void
 */
const ApprovedTransportCard = ({ request, onChangeStop, onCancel }) => {
  const { assignment, preferredStop, seatNumber, cancellationStatus } = request;

  const bus    = assignment?.bus;
  const driver = assignment?.driver;
  const route  = assignment?.route;

  const busNumber     = bus?.busNumber  || bus?.busName || '—';
  const busName       = bus?.busName    || null;
  const routeName     = route?.routeName || route?.name || '—';
  const stopName      = preferredStop?.stopName || preferredStop?.name || '—';
  const driverName    = resolveDriverName(driver);
  const routeStops    = route?.stops || [];
  const preferredId   = preferredStop?._id || preferredStop?.id;

  const showCancellationBanner = cancellationStatus === 'Pending';

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Pass header band ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">
                Your Transport Pass
              </p>
              <h2 className="text-white text-xl font-extrabold leading-tight mt-0.5">{busNumber}</h2>
              {busName && busName !== busNumber && (
                <p className="text-indigo-200 text-xs font-medium mt-0.5">{busName}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40 rounded-full px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              APPROVED
            </span>
            {seatNumber != null && (
              <span className="text-indigo-200 text-xs font-semibold">
                Seat {seatNumber}
              </span>
            )}
          </div>
        </div>

        {/* Route strip */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
          <Route className="w-4 h-4 text-indigo-200 flex-shrink-0" />
          <span className="text-white text-sm font-semibold truncate">{routeName}</span>
        </div>
      </div>

      {/* ── Cancellation banner ── */}
      {showCancellationBanner && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            Your cancellation request is pending admin approval.
          </p>
        </div>
      )}

      {/* ── Info chips grid ── */}
      <div className="px-5 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoChip icon={Bus}     label="Bus"    value={busNumber} accent />
        <InfoChip icon={User}    label="Driver" value={driverName} />
        <InfoChip icon={MapPin}  label="Stop"   value={stopName} />
        <InfoChip icon={Armchair} label="Seat"  value={seatNumber != null ? `Seat ${seatNumber}` : null} />
      </div>

      {/* ── Route journey section ── */}
      {routeStops.length > 0 && (
        <div className="mx-5 mt-5 bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Route Journey</p>
          </div>
          <JourneyTimeline stops={routeStops} preferredStopId={preferredId} />
        </div>
      )}

      {/* ── Actions ── */}
      {!showCancellationBanner && (
        <div className="px-5 py-5 flex flex-wrap gap-3">
          <button
            onClick={onChangeStop}
            className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Change Stop
          </button>
          <button
            onClick={onCancel}
            className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
          >
            Request Cancellation
          </button>
        </div>
      )}
    </div>
  );
};

export default ApprovedTransportCard;
