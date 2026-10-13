import React from 'react';

const RouteSkeletonLoader = ({ type = 'card' }) => {
  if (type === 'stat') {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 bg-gray-200 rounded-xl" />
          <div className="w-14 h-5 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-3.5 bg-gray-200 rounded" />
          <div className="w-12 h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-5 flex items-center gap-3 border-b border-gray-100">
          <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            <div className="h-3 bg-gray-200 rounded w-2/5" />
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded-full" />
        </div>
        {/* Route Path */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-1 pt-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
              <div className="w-0.5 h-10 bg-gray-200" />
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded w-10" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded w-10" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="h-2.5 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-14" />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="h-2.5 bg-gray-200 rounded w-10" />
              <div className="h-4 bg-gray-200 rounded w-8" />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return null;
};

export default RouteSkeletonLoader;

// Made with Bob
