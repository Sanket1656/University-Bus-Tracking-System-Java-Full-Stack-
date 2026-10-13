import React from 'react';
import { AlertTriangle, ShieldAlert, Power, CheckCircle2, XCircle, Info, Calendar, Navigation, Bus, User, MapPin } from 'lucide-react';
import Modal from './Modal';

const getDependencyIcon = (type) => {
  switch (type) {
    case 'ACTIVE_TRIP':
      return <Navigation className="w-4 h-4 text-rose-500" />;
    case 'ACTIVE_ASSIGNMENT':
    case 'INACTIVE_ASSIGNMENT':
      return <Bus className="w-4 h-4 text-purple-500" />;
    case 'SCHEDULE':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'HISTORICAL_TRIP':
      return <Navigation className="w-4 h-4 text-gray-500" />;
    case 'LOCATION_RECORD':
      return <MapPin className="w-4 h-4 text-amber-500" />;
    case 'ROUTE':
      return <Navigation className="w-4 h-4 text-emerald-500" />;
    case 'STUDENT_REQUEST':
    case 'SEAT_ASSIGNMENT':
    case 'ACTIVE_TRANSPORT':
    case 'TRANSPORT_REQUEST':
      return <User className="w-4 h-4 text-indigo-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

export const DependencyModal = ({
  isOpen,
  onClose,
  dependencyData,
  onDeactivate,
  deactivating = false,
  onConfirmDelete,
  deleting = false,
}) => {
  if (!isOpen || !dependencyData) return null;

  const {
    resourceType = 'RESOURCE',
    resourceName = '',
    canDelete = false,
    canDeactivate = false,
    code = 'RESOURCE_IN_USE',
    message = '',
    dependencies = [],
  } = dependencyData;

  const isActiveTrip = code === 'ACTIVE_TRIP_EXISTS';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        isActiveTrip
          ? 'Active Trip In Progress'
          : canDelete
          ? 'Confirm Permanent Deletion'
          : 'Resource Cannot Be Deleted'
      }
      subtitle={`Referential integrity check for ${resourceType.toLowerCase()} "${resourceName}"`}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={deactivating || deleting}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {canDelete && onConfirmDelete && (
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleting && (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              )}
              Delete Permanently
            </button>
          )}

          {!canDelete && canDeactivate && onDeactivate && (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={deactivating}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {deactivating && (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              )}
              <Power className="w-4 h-4" />
              Deactivate Instead
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner Alert */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isActiveTrip
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : canDelete
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {isActiveTrip ? (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            ) : canDelete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold">
              {isActiveTrip
                ? 'Action Blocked: Active Trip Operating'
                : canDelete
                ? 'Safe to Delete'
                : 'Blocking Dependencies Detected'}
            </p>
            <p className="mt-0.5 opacity-90 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Dependencies Breakdown */}
        {dependencies.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Referenced Database Records ({dependencies.length})
            </h4>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden bg-gray-50/50">
              {dependencies.map((dep, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white border border-gray-200/60 shadow-2xs mt-0.5">
                      {getDependencyIcon(dep.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 leading-snug">{dep.message}</p>
                      <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
                        {dep.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-white border border-gray-200 text-gray-700">
                    {dep.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Note */}
        {!canDelete && canDeactivate && (
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5 text-xs text-purple-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Why Deactivate?</span> Physical deletion is blocked to protect historical audit trails and database integrity. Deactivating marks the resource as <code className="px-1 py-0.5 bg-purple-100 rounded text-purple-800 font-semibold">INACTIVE</code>, pauses active schedules/assignments, and automatically sends alerts to affected drivers and students.
            </div>
          </div>
        )}

        {isActiveTrip && (
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Active Trip Safety:</span> An active trip is currently receiving GPS coordinates and carrying passengers. Deactivating or deleting during an active trip is strictly forbidden. Please coordinate with the driver to end or cancel the trip first.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DependencyModal;
