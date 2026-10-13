import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bus, Calendar, Route as RouteIcon, Timer } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import tripApi from '../../api/tripApi';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDuration, formatTime } from '../../utils/tripFormatting';

const DetailItem = ({ label, value, mono = false }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`mt-1 wrap-break-word text-sm font-bold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
  </div>
);

const DriverTripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTrip = async () => {
      setLoading(true);
      try {
        const response = await tripApi.getDetails(tripId);
        if (active) setTrip(response.data?.data || null);
      } catch (error) {
        if (active) {
          const status = error.response?.status;
          addToast(
            status === 403 ? 'You are not authorized to view this trip.' : status === 404 ? 'Trip not found.' : 'Unable to load trip details. Please try again.',
            'error'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTrip();
    return () => { active = false; };
  }, [tripId, addToast]);

  if (loading) {
    return <div className="mx-auto max-w-5xl space-y-5 animate-pulse"><div className="h-36 rounded-2xl bg-indigo-100" /><div className="h-80 rounded-2xl border border-gray-100 bg-white" /></div>;
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Trip not found.</h1>
        <p className="mt-2 text-sm text-gray-500">This trip may not belong to your account or may no longer exist.</p>
        <button type="button" onClick={() => navigate('/driver/trip-history')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">Back to Trip History</button>
      </div>
    );
  }

  const bus = trip.bus || {};
  const route = trip.route || {};
  const schedule = trip.schedule || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/driver/trip-history" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Trip History</Link>
        <StatusBadge status={trip.status} />
      </div>

      <header className="rounded-2xl bg-linear-to-r from-indigo-700 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-100">Trip Details</p>
            <h1 className="mt-2 text-3xl font-bold">{bus.busNumber || 'Trip'}</h1>
            <p className="mt-1 text-indigo-100">{route.routeName || 'Route unavailable'} - {trip.direction}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm"><span className="text-indigo-200">Trip ID</span><p className="mt-1 max-w-55 break-all font-mono text-xs">{trip.tripId}</p></div>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50"><Bus className="h-5 w-5 text-indigo-600" /></div><h2 className="font-bold text-gray-900">Bus Information</h2></div>
          <div className="grid grid-cols-2 gap-3"><DetailItem label="Bus Number" value={bus.busNumber} mono /><DetailItem label="Bus Name" value={bus.busName} /><DetailItem label="Type" value={bus.busType} /><DetailItem label="Capacity" value={bus.busCapacity ? `${bus.busCapacity} seats` : null} /></div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><RouteIcon className="h-5 w-5 text-violet-600" /></div><h2 className="font-bold text-gray-900">Route Information</h2></div>
          <div className="grid grid-cols-2 gap-3"><DetailItem label="Route Name" value={route.routeName} /><DetailItem label="Route Code" value={route.routeCode} mono /><DetailItem label="Direction" value={trip.direction} /><DetailItem label="Status" value={trip.status} /></div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Calendar className="h-5 w-5 text-amber-600" /></div><h2 className="font-bold text-gray-900">Schedule Information</h2></div>
        <div className="grid gap-3 sm:grid-cols-3"><DetailItem label="Scheduled Day" value={schedule.dayOfWeek} /><DetailItem label="Scheduled Start" value={schedule.startTime} /><DetailItem label="Direction" value={schedule.direction || trip.direction} /></div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><Timer className="h-5 w-5 text-emerald-600" /></div><h2 className="font-bold text-gray-900">Timing</h2></div>
        <div className="grid gap-3 sm:grid-cols-4"><DetailItem label="Date" value={formatDate(trip.startedAt || trip.createdAt)} /><DetailItem label="Started At" value={formatTime(trip.startedAt)} /><DetailItem label="Ended At" value={formatTime(trip.endedAt)} /><DetailItem label="Duration" value={formatDuration(trip.startedAt, trip.endedAt)} /></div>
        {!trip.endedAt && <p className="mt-4 text-sm text-gray-500">An end time is not available for this trip.</p>}
      </section>
    </div>
  );
};

export default DriverTripDetails;
