import React from 'react';

const STATUS_MAP = {
  // Operational - Active / Success (Green)
  active:      { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500 animate-pulse' },
  Active:      { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500 animate-pulse' },
  live:        { label: 'Live',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500 animate-pulse' },
  Live:        { label: 'Live',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500 animate-pulse' },
  LIVE:        { label: 'Live',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500 animate-pulse' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  Completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  available:   { label: 'Available',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  Available:   { label: 'Available',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  approved:    { label: 'Approved',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  Approved:    { label: 'Approved',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },
  success:     { label: 'Success',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', dotCls: 'bg-emerald-500' },

  // Operational - Pending / Warning / Maintenance (Amber)
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500 animate-pulse' },
  Pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500 animate-pulse' },
  maintenance: { label: 'Maintenance', cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  Maintenance: { label: 'Maintenance', cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  warning:     { label: 'Warning',     cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  Warning:     { label: 'Warning',     cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  stale:       { label: 'Stale',       cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  Stale:       { label: 'Stale',       cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  scheduled:   { label: 'Scheduled',   cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  Scheduled:   { label: 'Scheduled',   cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },
  RETURN:      { label: 'Return',      cls: 'bg-amber-50 text-amber-700 ring-amber-200/80', dotCls: 'bg-amber-500' },

  // Operational - Cancelled / Error / Rejected (Red)
  cancelled:   { label: 'Cancelled',   cls: 'bg-rose-50 text-rose-700 ring-rose-200/80', dotCls: 'bg-rose-500' },
  Cancelled:   { label: 'Cancelled',   cls: 'bg-rose-50 text-rose-700 ring-rose-200/80', dotCls: 'bg-rose-500' },
  rejected:    { label: 'Rejected',    cls: 'bg-rose-50 text-rose-700 ring-rose-200/80', dotCls: 'bg-rose-500' },
  Rejected:    { label: 'Rejected',    cls: 'bg-rose-50 text-rose-700 ring-rose-200/80', dotCls: 'bg-rose-500' },
  error:       { label: 'Error',       cls: 'bg-rose-50 text-rose-700 ring-rose-200/80', dotCls: 'bg-rose-500' },

  // Operational - Inactive / Offline / Disabled (Gray)
  inactive:    { label: 'Inactive',    cls: 'bg-gray-100 text-gray-600 ring-gray-200/80', dotCls: 'bg-gray-400' },
  Inactive:    { label: 'Inactive',    cls: 'bg-gray-100 text-gray-600 ring-gray-200/80', dotCls: 'bg-gray-400' },
  offline:     { label: 'Offline',     cls: 'bg-gray-100 text-gray-600 ring-gray-200/80', dotCls: 'bg-gray-400' },
  Offline:     { label: 'Offline',     cls: 'bg-gray-100 text-gray-600 ring-gray-200/80', dotCls: 'bg-gray-400' },
  disabled:    { label: 'Disabled',    cls: 'bg-gray-100 text-gray-600 ring-gray-200/80', dotCls: 'bg-gray-400' },

  // Operational - Directions / Info (Blue)
  OUTBOUND:    { label: 'Outbound',    cls: 'bg-blue-50 text-blue-700 ring-blue-200/80', dotCls: 'bg-blue-500' },
  info:        { label: 'Info',        cls: 'bg-blue-50 text-blue-700 ring-blue-200/80', dotCls: 'bg-blue-500' },
  Driver:      { label: 'Driver',      cls: 'bg-blue-50 text-blue-700 ring-blue-200/80', dotCls: 'bg-blue-500' },

  // UniTrack Purple Roles
  Admin:       { label: 'Admin',       cls: 'bg-purple-50 text-purple-700 ring-purple-200/80', dotCls: 'bg-purple-500' },
  Student:     { label: 'Student',     cls: 'bg-purple-50 text-purple-700 ring-purple-200/80', dotCls: 'bg-purple-500' },
};

export const StatusBadge = ({ status, dot = true, size = 'sm', className = '' }) => {
  const cfg = STATUS_MAP[status] ?? {
    label: status || '—',
    cls: 'bg-gray-100 text-gray-600 ring-gray-200/80',
    dotCls: 'bg-gray-400',
  };

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[11px] font-semibold gap-1'
    : 'px-2.5 py-1 text-xs font-semibold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 select-none whitespace-nowrap transition-colors ${sizeClasses} ${cfg.cls} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotCls || 'bg-current opacity-70'}`}
        />
      )}
      <span>{cfg.label}</span>
    </span>
  );
};

export const AdminStatusBadge = StatusBadge;
export default StatusBadge;
