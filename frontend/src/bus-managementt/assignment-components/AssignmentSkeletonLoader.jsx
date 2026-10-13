import React from 'react';

const AssignmentSkeletonLoader = ({ type = 'card' }) => {
  if (type === 'stat') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
          <div className="w-14 h-7 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      {/* header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
          <div>
            <div className="w-28 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-20 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      {/* body */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
          <div className="w-32 h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-gray-100 rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded mt-1"></div>
        </div>
      </div>
      {/* footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex justify-between">
        <div className="w-24 h-3 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="w-12 h-7 bg-gray-200 rounded-lg"></div>
          <div className="w-12 h-7 bg-gray-200 rounded-lg"></div>
          <div className="w-14 h-7 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSkeletonLoader;

// Made with Bob
