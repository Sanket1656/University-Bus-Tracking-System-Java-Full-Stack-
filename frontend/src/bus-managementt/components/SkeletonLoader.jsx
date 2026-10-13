import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'stat') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
          <div className="w-16 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Image Skeleton */}
        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse relative">
          <div className="absolute top-4 right-4 w-20 h-6 bg-gray-300 rounded-full"></div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
              <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;

// Made with Bob
