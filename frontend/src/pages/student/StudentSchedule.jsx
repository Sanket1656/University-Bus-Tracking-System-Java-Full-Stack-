import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Bus,
  Clock3,
  Activity,
  ArrowRight,
  ArrowLeftRight,
  Navigation,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Gauge,
  Sparkles,
  Shield,
  User,
  Radio,
} from 'lucide-react';
import studentApi from '../../api/studentApi';
import { useToast } from '../../context/ToastContext';
import {
  getTripOrderedStops,
  getRouteTerminals,
  getStopName,
  getStudentPickupStatus,
  normalizeDirection,
} from '../../utils/routeDirection';

const formatTime = (time) => {
  if (!time) return '—';
  const parts = String(time).split(':');
  if (parts.length < 2) return time;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const date = new Date();
  date.setHours(isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const resolveDriverName = (driver) => {
  return driver?.driverProfile?.name || driver?.name || driver?.username || 'Assigned Driver';
};

const StudentSchedule = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const isMountedRef = useRef(true);
  const pollingRef = useRef(null);

  const fetchSchedules = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: response } = await studentApi.getMySchedules();
      if (!isMountedRef.current) return;
      const payload = response?.data ?? null;
      setData(payload);
    } catch (error) {
      if (!isMountedRef.current) return;
      if (!isSilent) {
        const message = error.response?.data?.message || 'Unable to load your bus schedule.';
        addToast(message, 'error');
        setData(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSchedules(false);

    pollingRef.current = setInterval(() => {
      fetchSchedules(true);
    }, 5000);

    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchSchedules]);

  const assignment = data?.assignment || null;
  const bus = data?.bus || null;
  const driver = data?.driver || null;
  const route = data?.route || null;
  const pickupStop = data?.pickupStop || null;
  const seatNumber = data?.seatNumber ?? null;
  const todaySchedules = Array.isArray(data?.todaySchedules) ? data.todaySchedules : (Array.isArray(data?.today) ? data.today : []);
  const upcomingSchedules = Array.isArray(data?.upcoming) ? data.upcoming : [];
  const activeTrip = data?.activeTrip || null;
  const nextTrip = data?.nextTrip || null;
  const allTripsCompletedToday = Boolean(data?.allTripsCompletedToday);

  // Determine the primary trip to display in the Journey Showcase:
  // Active trip ALWAYS has priority! Otherwise nextTrip, or first schedule.
  const displayTrip = useMemo(() => {
    if (activeTrip) {
      return {
        ...activeTrip,
        isLive: true,
        tripStatus: 'ACTIVE',
        scheduledTime: activeTrip.schedule?.startTime,
        direction: activeTrip.direction || 'OUTBOUND',
      };
    }
    if (nextTrip) {
      return {
        ...nextTrip,
        isLive: false,
        tripStatus: nextTrip.tripStatus || 'NEXT',
        scheduledTime: nextTrip.startTime,
        direction: nextTrip.direction || 'OUTBOUND',
      };
    }
    if (todaySchedules.length > 0) {
      const first = todaySchedules[0];
      return {
        ...first,
        isLive: false,
        tripStatus: first.tripStatus || 'SCHEDULED',
        scheduledTime: first.startTime,
        direction: first.direction || 'OUTBOUND',
      };
    }
    return null;
  }, [activeTrip, nextTrip, todaySchedules]);

  const currentDirection = normalizeDirection(displayTrip?.direction);

  // Canonical route stops
  const canonicalStops = useMemo(() => {
    const list = route?.stops || route?.routeStops || [];
    return [...list].sort((a, b) => {
      const oA = a?.order ?? a?.stopOrder ?? 0;
      const oB = b?.order ?? b?.stopOrder ?? 0;
      return oA - oB;
    });
  }, [route]);

  // Direction-aware ordered stops traversal
  const orderedStops = useMemo(() => {
    return getTripOrderedStops(canonicalStops, currentDirection);
  }, [canonicalStops, currentDirection]);

  // Direction-aware terminals (Start Stop & End Stop)
  const terminals = useMemo(() => {
    return getRouteTerminals(canonicalStops, currentDirection);
  }, [canonicalStops, currentDirection]);

  // Current bus stop ID from active telemetry or display trip snapshot
  const currentStopId = useMemo(() => {
    if (activeTrip?.location?.currentStop?.id) return activeTrip.location.currentStop.id;
    if (activeTrip?.location?.currentStop?._id) return activeTrip.location.currentStop._id;
    if (displayTrip?.trip?.currentStopId) return displayTrip.trip.currentStopId;
    return null;
  }, [activeTrip, displayTrip]);

  // Calculate Student's Pickup Stop status along the ordered traversal
  const pickupStatusInfo = useMemo(() => {
    const isCompleted = displayTrip?.tripStatus === 'COMPLETED';
    const isActive = Boolean(activeTrip);
    const prefId = pickupStop?.id || pickupStop?._id;
    return getStudentPickupStatus({
      orderedStops,
      preferredStopId: prefId,
      currentStopId,
      isCompleted,
      isActive,
    });
  }, [orderedStops, pickupStop, currentStopId, displayTrip, activeTrip]);

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (activeTrip?.location?.routeProgress != null) {
      return Math.min(100, Math.max(0, Math.round(Number(activeTrip.location.routeProgress))));
    }
    if (displayTrip?.trip?.progress != null) {
      return Math.min(100, Math.max(0, Math.round(Number(displayTrip.trip.progress))));
    }
    if (displayTrip?.tripStatus === 'COMPLETED') return 100;
    return 0;
  }, [activeTrip, displayTrip]);

  // Current Stop Name
  const currentStopName = useMemo(() => {
    if (activeTrip?.location?.currentStop) {
      return getStopName(activeTrip.location.currentStop);
    }
    if (displayTrip?.trip?.currentStop) {
      return String(displayTrip.trip.currentStop);
    }
    if (orderedStops.length > 0) {
      return getStopName(orderedStops[0]);
    }
    return '—';
  }, [activeTrip, displayTrip, orderedStops]);

  // Next Stop Name
  const nextStopName = useMemo(() => {
    if (activeTrip?.location?.nextStop) {
      return getStopName(activeTrip.location.nextStop);
    }
    if (activeTrip?.location?.routeCompleted) {
      return 'Trip Completed';
    }
    if (displayTrip?.trip?.nextStop) {
      return String(displayTrip.trip.nextStop);
    }
    if (orderedStops.length > 1) {
      return getStopName(orderedStops[1]);
    }
    return '—';
  }, [activeTrip, displayTrip, orderedStops]);

  // Pickup Stop Name
  const pickupStopName = useMemo(() => {
    return pickupStop?.stopName || pickupStop?.name || 'Not assigned';
  }, [pickupStop]);

  // Today formatted string
  const todayDateString = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Bus Journey & Schedule</h1>
            <p className="text-sm text-slate-500">Loading your personalized schedule…</p>
          </div>
        </div>
        <div className="grid gap-5 animate-pulse">
          <div className="h-64 bg-slate-100 rounded-3xl" />
          <div className="h-80 bg-slate-100 rounded-3xl" />
          <div className="h-44 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Edge case: No approved transport assignment
  if (!assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Bus Journey & Schedule</h1>
            <p className="text-sm text-slate-500">{todayDateString}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 flex items-center justify-center mb-5 text-indigo-600">
            <Bus className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Bus Assignment Found</h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            You do not currently have an approved university transport assignment. Once an administrator approves your request, your live schedule, assigned bus, and pickup tracking will appear here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/student/transport"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Go to Transport Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Campus Transit</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">{todayDateString}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Today's Bus Journey
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSchedules(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/student/track-bus"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Track Bus</span>
          </Link>
        </div>
      </header>

      {/* ── SECTION A: TODAY'S BUS JOURNEY HERO CARD ── */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-6 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  <Bus className="w-3.5 h-3.5" />
                  {bus?.busNumber || 'Assigned Bus'}
                </span>

                {/* Direction pill */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest shadow-sm ${
                  currentDirection === 'RETURN'
                    ? 'bg-purple-500/90 text-white border border-purple-300/40'
                    : 'bg-emerald-500/90 text-white border border-emerald-300/40'
                }`}>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {currentDirection} TRIP
                </span>

                {/* Trip State Pill */}
                {activeTrip ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 text-emerald-950 px-3 py-1 text-xs font-black uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-900 animate-ping" />
                    LIVE NOW
                  </span>
                ) : allTripsCompletedToday ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TODAY'S RUNS COMPLETED
                  </span>
                ) : displayTrip?.tripStatus === 'NEXT' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-amber-950 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    NEXT TRIP • {formatTime(displayTrip?.scheduledTime)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    SCHEDULED • {formatTime(displayTrip?.scheduledTime)}
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {route?.routeName || 'University Express Route'}
              </h2>
              <p className="mt-1 text-xs font-medium text-indigo-100 flex items-center gap-2">
                <span>Code: {route?.routeCode || 'R-01'}</span>
                <span>•</span>
                <span>Driver: {resolveDriverName(driver)}</span>
                {seatNumber && (
                  <>
                    <span>•</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold">Seat #{seatNumber}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick action or live telemetry badge */}
            <div className="flex flex-col sm:items-end gap-2">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Scheduled Departure</p>
                <p className="text-xl font-extrabold text-white mt-0.5">
                  {formatTime(displayTrip?.scheduledTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-Pillar Terminal Showcase: START -> YOUR PICKUP -> END ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60">
          {/* 1. Origin (Start Stop) */}
          <div className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Trip Origin</span>
              <p className="text-base font-bold text-slate-900 truncate mt-0.5">
                {getStopName(terminals.origin)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentDirection === 'RETURN' ? 'Campus Terminal' : 'First Route Stop'}
              </p>
            </div>
          </div>

          {/* 2. Student's Pickup Stop (Prominently Highlighted) */}
          <div className="p-5 flex items-start gap-3.5 bg-amber-50/70 border-x-2 border-amber-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-amber-300">
              <Star className="w-5 h-5 text-amber-700 fill-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">Your Pickup Stop</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <p className="text-base font-black text-amber-950 truncate mt-0.5">
                {pickupStopName}
              </p>
              <p className="text-xs font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                <span>Status:</span>
                <strong className="underline underline-offset-2">{pickupStatusInfo.badgeText}</strong>
              </p>
            </div>
          </div>

          {/* 3. Destination (End Stop) */}
          <div className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Trip Destination</span>
              <p className="text-base font-bold text-slate-900 truncate mt-0.5">
                {getStopName(terminals.destination)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentDirection === 'RETURN' ? 'City Terminal' : 'University Campus'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Real-time Status Banner ── */}
        <div className="p-5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              activeTrip ? 'bg-emerald-500 animate-ping' : allTripsCompletedToday ? 'bg-slate-400' : 'bg-indigo-500'
            }`} />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {activeTrip
                  ? `Trip is in progress (${progressPercent}% completed)`
                  : allTripsCompletedToday
                  ? "All trips for today have concluded."
                  : displayTrip?.tripStatus === 'NEXT'
                  ? `Next trip is queued for ${formatTime(displayTrip?.scheduledTime)}.`
                  : "Trip is scheduled."}
              </p>
              <p className="text-xs text-slate-500">
                {pickupStatusInfo.message}
              </p>
            </div>
          </div>

          {activeTrip && (
            <Link
              to="/student/track-bus"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Watch Live Telemetry
            </Link>
          )}
        </div>
      </section>

      {/* ── SECTION B & C: ROUTE PROGRESS & YOUR PICKUP STOP ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Direction-Aware Traversal</span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                currentDirection === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {currentDirection}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Route Progress & Stops</h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Origin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200" /> Your Pickup
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Destination
            </span>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Journey Completion</span>
            <span className="text-indigo-600 font-extrabold text-sm">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Current & Next Stop Stat Widgets ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Stop</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">{currentStopName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTrip ? 'Current live stop' : 'Starting station'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next Stop</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">{nextStopName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTrip ? 'Approaching next' : 'Second station on route'}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Your Pickup Station</p>
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            </div>
            <p className="text-base font-black text-amber-950 mt-1 truncate">{pickupStopName}</p>
            <p className="text-[11px] font-bold text-amber-700 mt-0.5">
              {pickupStatusInfo.badgeText}
            </p>
          </div>
        </div>

        {/* ── Direction-Aware Stops Timeline ── */}
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Stop Sequence ({orderedStops.length} Total Stops)
          </p>

          <div className="space-y-0">
            {orderedStops.map((stopItem, index) => {
              const stopObj = stopItem?.stop || stopItem;
              const stopId = stopObj?._id || stopObj?.id;
              const prefId = pickupStop?.id || pickupStop?._id;
              const isMyStop = prefId && String(stopId) === String(prefId);
              const isCurrent = currentStopId && String(stopId) === String(currentStopId);
              const isFirst = index === 0;
              const isLast = index === orderedStops.length - 1;
              const name = getStopName(stopItem);

              return (
                <div key={stopId || index} className="flex gap-4 items-stretch group">
                  {/* Timeline connector column */}
                  <div className="flex flex-col items-center w-7 flex-shrink-0 pt-1">
                    <div className={`rounded-full flex items-center justify-center transition-all ${
                      isMyStop
                        ? 'w-6 h-6 bg-amber-400 text-amber-950 ring-4 ring-amber-100 font-black text-xs'
                        : isCurrent
                        ? 'w-6 h-6 bg-indigo-600 text-white ring-4 ring-indigo-100 font-bold text-xs'
                        : isFirst
                        ? 'w-4 h-4 bg-emerald-500 ring-2 ring-emerald-100'
                        : isLast
                        ? 'w-4 h-4 bg-rose-500 ring-2 ring-rose-100'
                        : 'w-3 h-3 bg-slate-300 ring-2 ring-slate-100'
                    }`}>
                      {isMyStop ? '★' : isCurrent ? '•' : ''}
                    </div>

                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[28px] ${
                        isMyStop ? 'bg-amber-300' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>

                  {/* Stop item details */}
                  <div className="flex-1 pb-4">
                    {isMyStop ? (
                      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base">⭐</span>
                            <div>
                              <p className="text-base font-black text-amber-950">{name}</p>
                              <span className="inline-flex items-center gap-1 rounded bg-amber-200/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900 mt-0.5">
                                Your Designated Pickup Stop
                              </span>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm">
                            {pickupStatusInfo.badgeText}
                          </span>
                        </div>
                      </div>
                    ) : isCurrent ? (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🚌</span>
                            <div>
                              <p className="text-sm font-bold text-indigo-900">{name}</p>
                              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                                Current Bus Position
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                            Active Here
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <p className={`text-sm font-medium ${
                          isFirst ? 'text-emerald-700 font-bold' : isLast ? 'text-rose-700 font-bold' : 'text-slate-700'
                        }`}>
                          {name}
                          {isFirst && (
                            <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                              Origin
                            </span>
                          )}
                          {isLast && (
                            <span className="ml-2 rounded bg-rose-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-700">
                              Destination
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-slate-400 font-medium">
                          Stop #{index + 1}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION D: TODAY'S SCHEDULE TIMELINE ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Today's Schedule Timeline</h3>
              <p className="text-xs text-slate-500">All planned service runs for {data?.todayName || 'Today'}</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {todaySchedules.length} {todaySchedules.length === 1 ? 'Trip' : 'Trips'} Today
          </span>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="space-y-3">
            {todaySchedules.map((schedule, idx) => {
              const tripState = schedule.tripState || (schedule.trip?.status === 'Active' ? 'ACTIVE' : schedule.trip?.status === 'Completed' ? 'COMPLETED' : 'SCHEDULED');
              const isLive = tripState === 'ACTIVE';
              const isCompleted = tripState === 'COMPLETED';
              const isNext = tripState === 'NEXT';
              const dir = normalizeDirection(schedule.direction);

              return (
                <div
                  key={schedule._id || idx}
                  className={`rounded-2xl border p-4 transition-all ${
                    isLive
                      ? 'border-emerald-300 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-200'
                      : isNext
                      ? 'border-indigo-300 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-200'
                      : isCompleted
                      ? 'border-slate-200 bg-slate-50/50 opacity-80'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      {/* Time pill */}
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isLive ? 'bg-emerald-600 text-white' : isNext ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <span className="text-xs font-bold leading-tight">{schedule.startTime?.split(':')[0] || '—'}</span>
                        <span className="text-[10px] font-semibold opacity-80">:{schedule.startTime?.split(':')[1] || '00'}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            dir === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {dir}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatTime(schedule.startTime)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {dir === 'RETURN' ? 'Campus Terminal → City Stops' : 'City Stops → Campus Terminal'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          LIVE NOW
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                          <ArrowRight className="w-3.5 h-3.5" />
                          NEXT TRIP
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          UPCOMING
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No schedule configured for today.
          </div>
        )}
      </section>

      {/* ── SECTION E: LIVE BUS TELEMETRY (Only when trip is active) ── */}
      {activeTrip && (
        <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-950">Live Bus Telemetry</h3>
                <p className="text-xs text-emerald-700">Real-time GPS satellite feed for {bus?.busNumber}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200 text-emerald-900 px-3 py-1 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              Active Feed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Current Speed</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {activeTrip?.location?.speed != null ? `${Math.round(activeTrip.location.speed)} km/h` : '0 km/h'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Movement State</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {activeTrip?.location?.isMoving ? 'In Transit' : 'At Station'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Next Approaching</p>
              <p className="text-sm font-black text-slate-900 mt-1 truncate">
                {nextStopName}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Progress</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {progressPercent}%
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming Schedules for other days ── */}
      {upcomingSchedules.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Other Timetable Schedules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingSchedules.slice(0, 6).map((sch, i) => (
              <div key={sch._id || i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-sm">
                <div>
                  <span className="font-bold text-slate-900">{sch.dayOfWeek}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{formatTime(sch.startTime)} • {sch.direction}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentSchedule;
