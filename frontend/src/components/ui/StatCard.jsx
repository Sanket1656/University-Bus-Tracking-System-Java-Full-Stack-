import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-purple-50',
  iconColor = 'text-purple-600',
  sub,
  trend,
  className = '',
}) => (
  <div
    className={`bg-white rounded-xl border border-gray-200/80 p-5 flex items-start gap-4 shadow-xs hover:border-gray-300/80 transition-all ${className}`}
  >
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${iconBg}`}
    >
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-1 leading-none tracking-tight">
        {value ?? '—'}
      </p>
      {(sub || trend) && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 truncate">
          {trend && (
            <span
              className={`font-semibold ${
                trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </p>
      )}
    </div>
  </div>
);

export const AdminStatCard = StatCard;
export default StatCard;
