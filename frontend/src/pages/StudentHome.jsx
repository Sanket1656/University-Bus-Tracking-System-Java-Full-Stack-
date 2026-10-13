import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  Bus,
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Star,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import studentApi from '../api/studentApi';
import transportRequestApi from '../api/transportRequestApi';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  getRouteSummary,
  getStopName,
  getRouteTerminals,
  getTripOrderedStops,
  normalizeDirection,
  getStudentPickupStatus,
} from '../utils/routeDirection';

const getDisplayStatus = (status) => {
  if (!status) return 'Not applied';
  if (status === 'Approved') return 'Approved';
  if (status === 'Pending') return 'Pending';
  if (status === 'Rejected') return 'Rejected';
  if (status === 'Cancelled') return 'Cancelled';
  return status;
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'Approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Pending':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'Rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'Cancelled':
      return 'border-slate-200 bg-slate-100 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
};

const formatTime = (value) => {
  if (!value) return '—';
  const parts = String(value).split(':');
  if (parts.length < 2) return value;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  const date = new Date();
  date.setHours(isNaN(hour) ? 0 : hour, isNaN(minute) ? 0 : minute, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatRelativeTime = (createdAt) => {
  if (!createdAt) return 'Just now';
  const elapsedSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
};

const StudentHome = () => {
  const { addToast } = useToast();
  const { notifications = [], unreadCount = 0, loading: loadingNotifications } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [transportRequest, setTransportRequest] = useState(null);
  const [schedules, setSchedules] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTransport, setLoadingTransport] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const isMountedRef = useRef(true);
  const pollingRef = useRef(null);

  const fetchStudentProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const { data } = await studentApi.getProfile();
      if (isMountedRef.current) {
        setProfile(data?.data ?? data ?? null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        addToast(error.response?.data?.message || 'Unable to load your profile.', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingProfile(false);
      }
    }
  }, [addToast]);

  const fetchTransportRequest = useCallback(async () => {
    setLoadingTransport(true);
    try {
      const { data } = await transportRequestApi.getMyTransportRequest();
      if (isMountedRef.current) {
        setTransportRequest(data?.data ?? null);
      }
    } catch (error) {
      const status = error.response?.status;
      if (status !== 404 && isMountedRef.current) {
        addToast(error.response?.data?.message || 'Unable to load transport data.', 'error');
      }
      if (isMountedRef.current) {
        setTransportRequest(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingTransport(false);
      }
    }
  }, [addToast]);

  const fetchSchedules = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingSchedule(true);
    try {
      const { data } = await studentApi.getMySchedules();
      if (isMountedRef.current) {
        setSchedules(data?.data ?? data ?? null);
      }
    } catch (error) {
      if (!isSilent && isMountedRef.current) {
        addToast(error.response?.data?.message || 'Unable to load your schedules.', 'error');
        setSchedules(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingSchedule(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStudentProfile();
    fetchTransportRequest();
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
  }, [fetchStudentProfile, fetchTransportRequest, fetchSchedules]);

  const assignment = transportRequest?.assignment ?? schedules?.assignment ?? null;
  const bus = assignment?.bus ?? schedules?.bus ?? null;
  const route = assignment?.route ?? schedules?.route ?? null;
  const preferredStop = schedules?.pickupStop ?? transportRequest?.preferredStop ?? null;
  const requestStatus = transportRequest?.status ?? schedules?.requestStatus ?? null;
  const todaySchedules = Array.isArray(schedules?.todaySchedules) ? schedules.todaySchedules : (Array.isArray(schedules?.today) ? schedules.today : []);
  const upcomingSchedules = Array.isArray(schedules?.upcoming) ? schedules.upcoming : [];
  const allTripsCompletedToday = Boolean(schedules?.allTripsCompletedToday);

  const statusLabel = getDisplayStatus(requestStatus);

  // Active trip ALWAYS has priority over any scheduled trip
  const activeTrip = schedules?.activeTrip || todaySchedules.find((entry) => entry?.trip?.status === 'Active' || entry?.tripState === 'ACTIVE') || null;
  const nextTrip = schedules?.nextTrip || (todaySchedules.find((entry) => entry?.tripState === 'NEXT') || todaySchedules[0] || upcomingSchedules[0] || null);

  const displayDirection = normalizeDirection(activeTrip?.direction || nextTrip?.direction || 'OUTBOUND');

  // Canonical route stops
  const canonicalStops = route?.stops || route?.routeStops || [];
  const orderedStops = getTripOrderedStops(canonicalStops, displayDirection);
  const terminals = getRouteTerminals(canonicalStops, displayDirection);

  // Stop names
  const originStopName = getStopName(terminals.origin);
  const destStopName = getStopName(terminals.destination);
  const prefStopId = preferredStop?.id || preferredStop?._id;
  const stopName = preferredStop?.stopName || preferredStop?.name || 'Not selected';

  // Current bus stop ID from telemetry
  const currentStopId = activeTrip?.location?.currentStop?.id || activeTrip?.location?.currentStop?._id || null;

  // Pickup status
  const pickupStatus = getStudentPickupStatus({
    orderedStops,
    preferredStopId: prefStopId,
    currentStopId,
    isCompleted: allTripsCompletedToday,
    isActive: Boolean(activeTrip),
  });

  // Current and Next stop names
  const activeCurrentStop = activeTrip?.location?.currentStop
    ? getStopName(activeTrip.location.currentStop)
    : (activeTrip?.currentStop || (orderedStops.length > 0 ? getStopName(orderedStops[0]) : '—'));

  const activeNextStop = activeTrip?.location?.nextStop
    ? getStopName(activeTrip.location.nextStop)
    : (activeTrip?.location?.routeCompleted
      ? 'Trip Completed'
      : (activeTrip?.nextStop || (orderedStops.length > 1 ? getStopName(orderedStops[1]) : '—')));

  const nextTripCurrentStop = nextTrip?.trip?.currentStop
    ? String(nextTrip.trip.currentStop)
    : (orderedStops.length > 0 ? getStopName(orderedStops[0]) : '—');

  const nextTripNextStop = nextTrip?.trip?.nextStop
    ? String(nextTrip.trip.nextStop)
    : (orderedStops.length > 1 ? getStopName(orderedStops[1]) : '—');

  const tripProgress = activeTrip
    ? Number(activeTrip?.location?.routeProgress ?? activeTrip?.progress ?? 0)
    : (allTripsCompletedToday ? 100 : 0);

  const busNumber = bus?.busNumber || bus?.busName || 'Not assigned';
  const routeName = route?.routeName || route?.name || 'Not assigned';
  const seatLabel = (transportRequest?.seatNumber != null || schedules?.seatNumber != null)
    ? `Seat ${transportRequest?.seatNumber ?? schedules?.seatNumber}`
    : 'Not assigned';

  const earlyLoading = loadingProfile || loadingTransport || loadingSchedule;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Student Portal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Good morning, {loadingProfile ? '...' : profile?.name || 'Student'}
          </h1>
        </div>
        <Link to="/student/track-bus" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <Navigation className="h-4 w-4" />
          Track my bus
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Transport status',
            value: earlyLoading ? 'Loading...' : statusLabel,
            icon: ShieldCheck,
            tint: 'bg-emerald-50 text-emerald-600',
            chip: statusLabel ? getStatusClasses(statusLabel) : 'border-slate-200 bg-slate-100 text-slate-600',
          },
          {
            label: 'Assigned bus',
            value: earlyLoading ? 'Loading...' : busNumber,
            icon: Bus,
            tint: 'bg-blue-50 text-blue-600',
            chip: 'border-blue-200 bg-blue-50 text-blue-700',
          },
          {
            label: 'Preferred stop',
            value: earlyLoading ? 'Loading...' : stopName,
            icon: MapPin,
            tint: 'bg-violet-50 text-violet-600',
            chip: 'border-violet-200 bg-violet-50 text-violet-700',
          },
          {
            label: 'Seat',
            value: earlyLoading ? 'Loading...' : seatLabel,
            icon: Route,
            tint: 'bg-amber-50 text-amber-600',
            chip: 'border-amber-200 bg-amber-50 text-amber-700',
          },
        ].map(({ label, value, icon: Icon, tint, chip }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${chip}`}>
                {label}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Today</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Trip overview</h2>
            </div>
            <Link to="/student/schedule" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              View schedule
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {earlyLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-2xl bg-slate-100" />
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ) : activeTrip ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Live Journey</span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                        <ArrowLeftRight className="h-3 w-3" /> {displayDirection}
                      </span>
                    </div>
                    <h3 className="mt-2 text-2xl font-extrabold text-emerald-950">{routeName}</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Origin: {originStopName} → Destination: {destStopName}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Active Trip
                  </span>
                </div>
              </div>

              {/* Live Stops Grid */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current stop</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 truncate">{activeCurrentStop}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Next stop</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 truncate">{activeNextStop}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">Your pickup</p>
                    <Star className="h-3 w-3 text-amber-600 fill-amber-500" />
                  </div>
                  <p className="mt-2 text-lg font-bold text-amber-950 truncate">{stopName}</p>
                  <p className="text-[11px] font-semibold text-amber-700 mt-0.5">{pickupStatus.badgeText}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Route progress</span>
                  <span className="font-semibold text-slate-900">{Math.round(tripProgress)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${Math.min(tripProgress, 100)}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/student/track-bus" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-sm">
                  <Navigation className="h-4 w-4" />
                  Track Live on Map
                </Link>
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  {activeTrip?.updatedAt || activeTrip?.location?.updatedAt
                    ? `Updated ${formatRelativeTime(activeTrip.updatedAt || activeTrip.location.updatedAt)}`
                    : 'Real-time telemetry connected'}
                </span>
              </div>
            </div>
          ) : allTripsCompletedToday ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Today's Trips Completed</h3>
              <p className="mt-2 text-sm text-slate-500">
                All scheduled trips for {busNumber} on {routeName} have finished for today.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <Link to="/student/schedule" className="hover:underline">View upcoming timetable →</Link>
              </div>
            </div>
          ) : nextTrip ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Next Scheduled Trip</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  displayDirection === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <ArrowLeftRight className="h-3 w-3" /> {displayDirection}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatTime(nextTrip.startTime)}</p>
                  <p className="text-sm text-slate-600">{routeName} • {busNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Starts From</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{originStopName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Next Station</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{nextTripNextStop}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-amber-800">Your Pickup</p>
                    <Star className="h-3 w-3 text-amber-600 fill-amber-500" />
                  </div>
                  <p className="text-xs font-black text-amber-950 truncate mt-0.5">{stopName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{originStopName} → {destStopName}</span>
                </div>
                <Link to="/student/schedule" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
                  Full Timeline →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <Bus className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">No trip scheduled today</h3>
              <p className="mt-2 text-sm text-slate-500">Your trip timetable will appear when service runs are scheduled for your route.</p>
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Updates</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Notifications</h2>
            </div>
            <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {unreadCount} unread
            </div>
          </div>

          {loadingNotifications ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification._id || notification.id} className={`rounded-2xl border p-4 ${notification.isRead ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 bg-indigo-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                      <BellRing className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{notification.title || 'Campus update'}</p>
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{notification.message || 'New update available.'}</p>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StudentHome;