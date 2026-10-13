import React from 'react';
import { motion } from 'framer-motion';

const RouteCard = ({ route, onView, onEdit, onDelete, index }) => {
  // stops is [{stop: {stopName, ...}, order}, ...]
  const orderedStops = [...(route.stops || [])].sort((a, b) => a.order - b.order);
  const startStop = orderedStops[0]?.stop;
  const endStop = orderedStops[orderedStops.length - 1]?.stop;
  const stopCount = orderedStops.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, boxShadow: '0 20px 30px -8px rgba(37,99,235,0.12)' }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl group"
    >
      {/* Card Header */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate leading-tight">
              {route.routeName}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{route.routeCode || '—'}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 flex-shrink-0">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {stopCount} Stop{stopCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-6 py-4 space-y-3">
        {route.invalidStopReferences?.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Invalid Stop Reference: {route.invalidStopReferences.length} deleted stop{route.invalidStopReferences.length === 1 ? '' : 's'} removed.
          </div>
        )}
        {/* Route path visual */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-violet-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Start</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {startStop?.stopName || '—'}
              </p>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5">
              <p className="text-xs text-violet-600 font-medium uppercase tracking-wide mb-0.5">End</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {endStop?.stopName || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer — Actions */}
      <div className="px-6 pb-5 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          View
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={onEdit}
          className="p-2.5 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition-colors"
          title="Edit Route"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={onDelete}
          className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
          title="Delete Route"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RouteCard;

// Made with Bob
