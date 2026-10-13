import React from 'react';

export const LoadingState = ({ rows = 5, cols = 5, showKpi = false, className = '' }) => (
  <div className={`space-y-4 animate-pulse ${className}`}>
    {showKpi && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-6 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
      <div className="divide-y divide-gray-50">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div
                className="h-3.5 bg-gray-100 rounded"
                style={{ width: `${Math.min(90, 45 + (i % 3) * 20)}%` }}
              />
              <div
                className="h-2.5 bg-gray-100 rounded"
                style={{ width: `${Math.min(60, 25 + (i % 3) * 15)}%` }}
              />
            </div>
            {[...Array(Math.max(1, cols - 2))].map((_, j) => (
              <div
                key={j}
                className="hidden sm:block h-3 bg-gray-100 rounded w-20"
                style={{ opacity: 1 - j * 0.2 }}
              />
            ))}
            <div className="w-16 h-6 bg-gray-100 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AdminLoadingState = LoadingState;
export default LoadingState;
