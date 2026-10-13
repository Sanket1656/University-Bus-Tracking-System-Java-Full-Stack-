import React, { useEffect, useState } from 'react';
import { Bus, Calendar, Eye, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import tripApi from '../../api/tripApi';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDuration, formatTime } from '../../utils/tripFormatting';

const FilterSelect = ({ label, value, onChange, children }) => (
  <label className="flex min-w-36.25 flex-1 flex-col gap-1.5">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    >
      {children}
    </select>
  </label>
);

const TripRow = ({ trip }) => {
  const bus = trip.bus || {};
  const route = trip.route || {};
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Bus className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-gray-900">{bus.busNumber || 'Bus unavailable'}</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{trip.direction}</span>
            </div>
            <p className="mt-1 truncate text-sm text-gray-600">{route.routeName || 'Route unavailable'}{route.routeCode ? ` - ${route.routeCode}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:min-w-135">
          <div><p className="text-xs text-gray-400">Date</p><p className="mt-0.5 font-semibold text-gray-800">{formatDate(trip.startedAt || trip.createdAt)}</p></div>
          <div><p className="text-xs text-gray-400">Started</p><p className="mt-0.5 font-semibold text-gray-800">{formatTime(trip.startedAt)}</p></div>
          <div><p className="text-xs text-gray-400">Ended</p><p className="mt-0.5 font-semibold text-gray-800">{formatTime(trip.endedAt)}</p></div>
          <div><p className="text-xs text-gray-400">Duration</p><p className="mt-0.5 font-semibold text-gray-800">{formatDuration(trip.startedAt, trip.endedAt)}</p></div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:min-w-37.5 lg:justify-end">
          <StatusBadge status={trip.status} />
          <Link
            to={`/driver/trip-history/${trip.tripId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

const DriverTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('');
  const [direction, setDirection] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const params = {};
        if (status) params.status = status;
        if (direction) params.direction = direction;
        if (date) params.date = date;
        const response = await tripApi.getMyHistory(params);
        if (active) setTrips(response.data?.data || []);
      } catch (error) {
        if (active) {
          setTrips([]);
          addToast(error.response?.data?.message || 'Unable to load trip history. Please try again.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, [status, direction, date, addToast]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl bg-linear-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-indigo-100"><History className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-widest">Driver Portal</span></div>
            <h1 className="text-3xl font-bold">Trip History</h1>
            <p className="mt-2 max-w-xl text-sm text-indigo-100">Review your completed and cancelled trips.</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-indigo-50">{loading ? 'Loading trips...' : `${trips.length} trip${trips.length === 1 ? '' : 's'}`}</div>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect label="Status" value={status} onChange={setStatus}>
            <option value="">All statuses</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
          </FilterSelect>
          <FilterSelect label="Direction" value={direction} onChange={setDirection}>
            <option value="">All directions</option><option value="OUTBOUND">OUTBOUND</option><option value="RETURN">RETURN</option>
          </FilterSelect>
          <label className="flex min-w-45 flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </label>
          {(status || direction || date) && <button type="button" onClick={() => { setStatus(''); setDirection(''); setDate(''); }} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">Clear filters</button>}
        </div>
      </section>

      {loading ? (
        <div className="space-y-3" aria-label="Loading trip history">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-white" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm"><EmptyState icon={History} title="No trip history yet" description="Completed and cancelled trips will appear here." /></div>
      ) : (
        <section className="space-y-3">
          {trips.map((trip) => <TripRow key={trip.tripId} trip={trip} />)}
        </section>
      )}
    </div>
  );
};

export default DriverTripHistory;
