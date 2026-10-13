import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPin,
  Navigation,
  Play,
  Route as RouteIcon,
  Square,
} from 'lucide-react';
import driverApi from '../api/driverApi';
import tripApi from '../api/tripApi';
import TrackingMap from '../components/student/tracking/TrackingMap';
import {
  getRouteSummary,
  normalizeDirection,
  getTripOrderedStops,
  getStopName,
  getRouteTerminals,
} from '../utils/routeDirection';

const formatTime = (time) => (time ? String(time).slice(0, 5) : '—');

const toMinutes = (time = '00:00') => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const getStatusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (['ACTIVE', 'READY', 'LIVE NOW'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (['UPCOMING', 'QUEUED'].includes(normalized)) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (['COMPLETED'].includes(normalized)) return 'bg-slate-100 text-slate-600 border border-slate-200';
  if (['CANCELLED'].includes(normalized)) return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
};

const DriverHome = () => {
  const [assignment, setAssignment] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);
  const [simulationResetSignal, setSimulationResetSignal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const pollRef = useRef(null);
  const isMountedRef = useRef(true);
  const actionLoadingRef = useRef(false);

  useEffect(() => {
    actionLoadingRef.current = actionLoading;
  }, [actionLoading]);

  const fetchHomeData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');

    try {
      const [assignmentRes, scheduleRes, tripRes] = await Promise.allSettled([
        driverApi.getMyAssignment(),
        driverApi.getTodaySchedule(),
        tripApi.getCurrent(),
      ]);

      if (!isMountedRef.current) return;

      if (assignmentRes.status === 'fulfilled' && assignmentRes.value?.data?.success) {
        setAssignment(assignmentRes.value.data.data || null);
      } else if (assignmentRes.status === 'rejected' && assignmentRes.reason?.response?.status === 404) {
        setAssignment(null);
      } else if (!isBackground) {
        throw assignmentRes.reason || new Error('Failed to load assignment');
      }

      if (scheduleRes.status === 'fulfilled') {
        setTodaySchedules(Array.isArray(scheduleRes.value?.data?.data) ? scheduleRes.value.data.data : []);
      } else if (!isBackground) {
        setTodaySchedules([]);
      }

      if (tripRes.status === 'fulfilled') {
        const trip = tripRes.value?.data?.data || null;
        setCurrentTrip(trip);
      } else if (!isBackground) {
        setCurrentTrip(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Driver home data fetch error:', err);
      if (!isBackground) {
        setError(err?.response?.data?.message || 'Unable to load today\'s trip data');
      }
    } finally {
      if (isMountedRef.current && !isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchHomeData(false);

    pollRef.current = setInterval(() => {
      if (isMountedRef.current && !actionLoadingRef.current) {
        fetchHomeData(true);
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchHomeData]);

  // Canonical route stops parsed from driver's active assignment
  const mapStops = useMemo(() => {
    const stops = assignment?.route?.stops || assignment?.route?.routeStops || [];
    return [...stops]
      .map((stopItem) => {
        const stop = stopItem?.stop || stopItem;
        const latitude = Number(stop?.latitude ?? stopItem?.latitude);
        const longitude = Number(stop?.longtitude ?? stop?.longitude ?? stopItem?.longtitude ?? stopItem?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return {
          _id: stop?._id || stop?.id || stopItem?._id || stopItem?.id || `${stopItem?.order ?? 0}`,
          id: stop?.id || stop?._id || stopItem?.id,
          stopName: stop?.stopName || stop?.name || `Stop ${stopItem?.order ?? 1}`,
          name: stop?.stopName || stop?.name,
          latitude,
          longtitude: longitude,
          longitude,
          order: stopItem?.order ?? stopItem?.stopOrder ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [assignment]);

  // Next chronological non-completed schedule
  const nextSchedule = useMemo(() => {
    if (!todaySchedules.length) return null;
    return [...todaySchedules]
      .filter((schedule) => !['COMPLETED', 'CANCELLED'].includes(String(schedule.status || '').toUpperCase()))
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0] || null;
  }, [todaySchedules]);

  // Active schedule if an active trip is running
  const activeSchedule = useMemo(() => {
    if (!currentTrip) return null;
    const currentSchedId = String(currentTrip.schedule?._id || currentTrip.schedule?.id || '');
    return todaySchedules.find((schedule) =>
      String(schedule._id || schedule.id) === currentSchedId
    ) || null;
  }, [currentTrip, todaySchedules]);

  // Active trip always has priority over scheduled next trip
  const hasActiveTrip = Boolean(currentTrip);
  const selectedSchedule = hasActiveTrip ? (activeSchedule || currentTrip?.schedule) : nextSchedule;
  const isTripAvailable = hasActiveTrip || Boolean(nextSchedule);

  // Direction: driven by active trip or next schedule
  const displayDirection = useMemo(() => {
    if (hasActiveTrip) {
      return normalizeDirection(currentTrip.direction || activeSchedule?.direction || selectedSchedule?.direction);
    }
    if (nextSchedule) {
      return normalizeDirection(nextSchedule.direction);
    }
    return 'OUTBOUND';
  }, [hasActiveTrip, currentTrip, activeSchedule, selectedSchedule, nextSchedule]);

  // Direction-aware ordered route stops (traversal order)
  const orderedStops = useMemo(() => {
    return getTripOrderedStops(mapStops, displayDirection);
  }, [mapStops, displayDirection]);

  // Direction-aware Start and End stops
  const startStopName = orderedStops.length > 0 ? getStopName(orderedStops[0]) : '—';
  const endStopName = orderedStops.length > 0 ? getStopName(orderedStops[orderedStops.length - 1]) : '—';
  const displayRouteSummary = getRouteSummary(displayDirection, mapStops);

  // Direction-aware Current Stop
  const currentStopName = useMemo(() => {
    if (mapStops.length === 0) return 'Route stops are not configured.';
    if (hasActiveTrip) {
      if (routeProgress?.currentStop) {
        return getStopName(routeProgress.currentStop);
      }
      return startStopName;
    }
    if (nextSchedule) {
      return startStopName;
    }
    return '—';
  }, [mapStops.length, hasActiveTrip, routeProgress, startStopName, nextSchedule]);

  // Direction-aware Next Stop
  const nextStopName = useMemo(() => {
    if (mapStops.length < 2) return '—';
    if (hasActiveTrip) {
      if (routeProgress?.routeCompleted) {
        return 'Destination Reached';
      }
      if (routeProgress?.nextStop) {
        return getStopName(routeProgress.nextStop);
      }
      return orderedStops.length > 1 ? getStopName(orderedStops[1]) : '—';
    }
    if (nextSchedule) {
      return orderedStops.length > 1 ? getStopName(orderedStops[1]) : '—';
    }
    return '—';
  }, [mapStops.length, hasActiveTrip, routeProgress, orderedStops, nextSchedule]);

  const progressValue = useMemo(() => {
    if (!hasActiveTrip) return 0;
    const completedProgress = routeProgress?.progress ?? 0;
    return Math.min(Math.max(Number(completedProgress) || 0, 0), 100);
  }, [hasActiveTrip, routeProgress]);

  const speedValue = useMemo(() => {
    if (!hasActiveTrip) return '—';
    if (routeProgress?.speed != null && Number.isFinite(Number(routeProgress.speed))) {
      return `${Math.round(routeProgress.speed)} km/h`;
    }
    return '0 km/h';
  }, [hasActiveTrip, routeProgress]);

  const scheduledTimeDisplay = useMemo(() => {
    if (hasActiveTrip) {
      return selectedSchedule?.startTime ? formatTime(selectedSchedule.startTime) : 'Active';
    }
    if (nextSchedule) {
      return formatTime(nextSchedule.startTime);
    }
    return '—';
  }, [hasActiveTrip, selectedSchedule, nextSchedule]);

  const tripStatusBadge = useMemo(() => {
    if (hasActiveTrip) {
      return {
        label: 'ON TRIP',
        tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500 animate-pulse',
      };
    }
    if (nextSchedule) {
      const isReady = String(nextSchedule.status || '').toUpperCase() === 'READY';
      return {
        label: isReady ? 'READY' : 'QUEUED',
        tone: isReady ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: isReady ? 'bg-indigo-500' : 'bg-amber-500',
      };
    }
    return {
      label: 'COMPLETED',
      tone: 'bg-slate-100 text-slate-600 border border-slate-200',
      dot: 'bg-slate-400',
    };
  }, [hasActiveTrip, nextSchedule]);

  const busNumber = assignment?.bus?.busNumber || assignment?.bus?.busName || 'BUS';
  const routeName = assignment?.route?.routeName || selectedSchedule?.route?.routeName || 'No route assigned';
  const driverName = assignment?.driver?.name || assignment?.driver?.username || 'Driver';

  const handleStartTrip = async () => {
    if (!nextSchedule?._id && !nextSchedule?.id) return;
    if (mapStops.length < 2) {
      setError('Route stops are not configured. Cannot start trip.');
      return;
    }
    const scheduleId = nextSchedule._id || nextSchedule.id;
    setActionLoading(true);
    setError('');
    try {
      await tripApi.start(scheduleId);
      setRouteProgress(null);
      setSimulationResetSignal((prev) => prev + 1);
      await fetchHomeData(true);
    } catch (err) {
      console.error('Start trip error:', err);
      setError(err?.response?.data?.message || 'Unable to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!currentTrip) return;
    setActionLoading(true);
    setError('');
    try {
      await tripApi.end();
      setRouteProgress(null);
      setSimulationResetSignal((prev) => prev + 1);
      await fetchHomeData(true);
    } catch (err) {
      console.error('End trip error:', err);
      setError(err?.response?.data?.message || 'Unable to end trip');
    } finally {
      setActionLoading(false);
    }
  };

  const primaryAction = useMemo(() => {
    if (hasActiveTrip) {
      return {
        label: 'END TRIP',
        icon: Square,
        tone: 'bg-rose-600 text-white hover:bg-rose-700',
        disabled: false,
      };
    }
    if (nextSchedule) {
      const hasStops = mapStops.length >= 2;
      return {
        label: 'START TRIP',
        icon: Play,
        tone: hasStops
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-slate-300 text-slate-500 cursor-not-allowed',
        disabled: !hasStops,
      };
    }
    return null;
  }, [hasActiveTrip, nextSchedule, mapStops.length]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-5 p-4 md:p-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">Driver Today</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{driverName}</h1>
            <p className="mt-1 text-sm text-slate-500">{formatDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${tripStatusBadge.tone}`}>
              <span className={`mr-2 h-2.5 w-2.5 rounded-full ${tripStatusBadge.dot}`} />
              {tripStatusBadge.label}
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!assignment ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Bus className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No trip scheduled today</h2>
          <p className="mt-2 text-sm text-slate-500">You have no active assignment for today. Please contact your administrator.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {hasActiveTrip ? 'ACTIVE TRIP' : isTripAvailable ? 'CURRENT / NEXT TRIP' : "TODAY'S OPERATIONS"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {hasActiveTrip ? 'CURRENT TRIP' : isTripAvailable ? 'NEXT TRIP' : 'OPERATIONS COMPLETE'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-indigo-50 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-500">Bus</div>
                    <div className="text-base font-bold text-indigo-700">{busNumber}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold ${tripStatusBadge.tone}`}>
                    <span className={`mr-2 h-2 w-2 rounded-full ${tripStatusBadge.dot}`} />
                    {tripStatusBadge.label}
                  </span>
                </div>
              </div>

              {isTripAvailable ? (
                <>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Direction</p>
                      <p className="mt-2 text-lg font-bold uppercase text-slate-900">{displayDirection}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Route</p>
                      <p className="mt-2 text-lg font-bold text-slate-900 truncate" title={routeName}>{routeName}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Scheduled Time</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{scheduledTimeDisplay}</p>
                    </div>
                  </div>

                  {/* Route Terminals: Start & End Stops */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Start Stop
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-800">{startStopName}</p>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        End Stop
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-800">{endStopName}</p>
                    </div>
                  </div>

                  {/* Dynamic Stop & Progress Panel */}
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Current stop</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{currentStopName}</p>
                      </div>
                      <div className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasActiveTrip ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${hasActiveTrip ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {hasActiveTrip ? 'Live' : 'Queued'}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Next stop</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800 truncate" title={nextStopName}>{nextStopName}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Progress</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{Math.round(progressValue)}%</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Speed</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{speedValue}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {primaryAction && (
                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={primaryAction.label === 'END TRIP' ? handleEndTrip : handleStartTrip}
                        disabled={actionLoading || primaryAction.disabled}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition ${primaryAction.tone} ${actionLoading || primaryAction.disabled ? 'cursor-not-allowed opacity-75' : ''}`}
                      >
                        {primaryAction.label === 'END TRIP' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {actionLoading ? 'Processing...' : primaryAction.label}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No more trips scheduled today.</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    All scheduled operations for today have been completed. Check back tomorrow or contact your administrator.
                  </p>
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Trip Summary</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Direction', value: isTripAvailable ? displayDirection : '—' },
                  { label: 'Current stop', value: currentStopName },
                  { label: 'Next stop', value: nextStopName },
                  { label: 'Progress', value: `${Math.round(progressValue)}%` },
                  { label: 'Speed', value: speedValue },
                  { label: 'Status', value: tripStatusBadge.label },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Map</h3>
                  <p className="text-xs text-slate-500">{displayRouteSummary}</p>
                </div>
              </div>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                {hasActiveTrip ? 'tracking' : 'route'}
              </span>
            </div>

            {mapStops.length > 0 ? (
              <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200">
                <TrackingMap
                  stops={mapStops}
                  preferredStopId={null}
                  busId={assignment?.bus?._id || assignment?.bus?.id}
                  busLabel={busNumber}
                  enableSimulation={hasActiveTrip}
                  autoStartSimulation={hasActiveTrip}
                  simulationResetSignal={simulationResetSignal}
                  initialPosition={null}
                  direction={displayDirection}
                  onSimulationProgress={(progress) => setRouteProgress(progress)}
                />
              </div>
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Route stops are not configured for this route.
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h3>
                  <p className="text-xs text-slate-500">Operations timeline for today</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {todaySchedules.length ? (
                  todaySchedules
                    .slice()
                    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
                    .map((schedule) => {
                      const scheduleDirection = schedule.direction || 'OUTBOUND';
                      const isCurrentTripSchedule = currentTrip && String(currentTrip.schedule?._id || currentTrip.schedule?.id) === String(schedule._id || schedule.id);
                      const isNextTripSchedule = !currentTrip && nextSchedule && String(nextSchedule._id || nextSchedule.id) === String(schedule._id || schedule.id);
                      const isHighlighted = isCurrentTripSchedule || isNextTripSchedule;
                      const scheduleSummary = getRouteSummary(scheduleDirection, mapStops);
                      const normalized = String(schedule.status || '').toUpperCase();

                      return (
                        <div
                          key={schedule._id || schedule.id}
                          className={`rounded-xl border p-3 ${isHighlighted ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-200 bg-slate-50'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold text-slate-900">{formatTime(schedule.startTime)}</p>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{scheduleDirection}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusTone(schedule.status)}`}>
                              {normalized}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                            <RouteIcon className="h-4 w-4 text-slate-400" />
                            {scheduleSummary}
                          </div>
                          {isCurrentTripSchedule && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Active trip
                            </div>
                          )}
                          {isNextTripSchedule && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                              <Clock3 className="h-4 w-4" />
                              Next scheduled trip
                            </div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No trips scheduled today.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Route Progress</h3>
                  <p className="text-xs text-slate-500">Live completion level</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-semibold text-slate-900">{Math.round(progressValue)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${progressValue}%` }} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Current stop</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{currentStopName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Next stop</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{nextStopName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Direction</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-800">{displayDirection.toLowerCase()}</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default DriverHome;
