import React from 'react';
import {
  Bus, MapPin, XCircle, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import ApprovedTransportCard from './ApprovedTransportCard';

/* ── Skeleton loader ── */
const Skeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
    <div className="h-28 bg-gray-100 rounded-2xl" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
      ))}
    </div>
    <div className="h-40 bg-gray-100 rounded-2xl" />
  </div>
);

/* ── No-request empty state ── */
const NoRequest = ({ onApply }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center">
    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-5">
      <Bus className="w-10 h-10 text-indigo-300" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">No Transport Request</h3>
    <p className="text-sm text-gray-500 max-w-xs mb-7 leading-relaxed">
      You haven't applied for university transport yet. Submit a request to get assigned a bus, route, and seat.
    </p>
    <button
      onClick={onApply}
      className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
    >
      Apply for Transport
    </button>
  </div>
);

/* ── Pending state ── */
const PendingCard = ({ request, onChangeStop, onCancel }) => {
  const stopName =
    request?.preferredStop?.stopName ||
    request?.preferredStop?.name ||
    '—';

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest">Transport Request</p>
              <h2 className="text-white text-lg font-extrabold mt-0.5">Waiting for Assignment</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white ring-1 ring-white/30 rounded-full px-3 py-1 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            PENDING
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Request Submitted</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              Your request has been submitted successfully. The university administrator will assign your bus, route, and seat.
            </p>
          </div>
        </div>

        {/* Preferred stop */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Preferred Stop</p>
            <p className="text-sm font-bold text-gray-900">{stopName}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex flex-wrap gap-3">
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
          Cancel Request
        </button>
      </div>
    </div>
  );
};

/* ── Rejected state ── */
const RejectedCard = ({ request }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-red-200 text-xs font-semibold uppercase tracking-widest">Transport Request</p>
          <h2 className="text-white text-lg font-extrabold mt-0.5">Request Rejected</h2>
        </div>
      </div>
    </div>
    <div className="px-6 py-5">
      <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-4">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">Your transport request was rejected.</p>
          {request?.remarks && (
            <p className="text-xs text-red-600 mt-1 leading-relaxed">{request.remarks}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ── Cancelled state ── */
const CancelledCard = ({ request }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-gray-200 text-xs font-semibold uppercase tracking-widest">Transport Request</p>
          <h2 className="text-white text-lg font-extrabold mt-0.5">Request Cancelled</h2>
        </div>
      </div>
    </div>
    <div className="px-6 py-5">
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-700">Your transport request has been cancelled.</p>
          {request?.cancellationReason && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Reason: {request.cancellationReason}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * TransportStatusCard — top-level router for all transport states
 *
 * Props:
 *   request      – transport request object or null
 *   loading      – boolean
 *   onApply      – () => void
 *   onChangeStop – () => void
 *   onCancel     – () => void
 */
const TransportStatusCard = ({ request, loading, onApply, onChangeStop, onCancel }) => {
  if (loading)          return <Skeleton />;
  if (!request)         return <NoRequest onApply={onApply} />;

  const { status } = request;

  if (status === 'Approved')  return <ApprovedTransportCard request={request} onChangeStop={onChangeStop} onCancel={onCancel} />;
  if (status === 'Pending')   return <PendingCard  request={request} onChangeStop={onChangeStop} onCancel={onCancel} />;
  if (status === 'Rejected')  return <RejectedCard  request={request} />;
  if (status === 'Cancelled') return <CancelledCard request={request} />;

  /* Fallback for unknown statuses */
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 text-center">
      <p className="text-sm text-gray-500">Transport status: <strong>{status}</strong></p>
    </div>
  );
};

export default TransportStatusCard;
