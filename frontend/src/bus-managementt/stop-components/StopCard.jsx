import React from 'react';
import { motion } from 'framer-motion';

const StopCard = ({ stop, onView, onEdit, onDelete, index }) => {
  const routeCount = stop.dependencies?.routes?.length || 0;
  const studentCount = stop.dependencies?.studentsUsingStop || 0;
  const canDelete = stop.canDelete ?? (routeCount === 0 && studentCount === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, boxShadow: '0 20px 30px -8px rgba(37,99,235,0.12)' }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl group"
    >
      {/* Card Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate leading-tight">
              {stop.stopName}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Bus Stop</p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-6 py-4 space-y-3">
        <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
          canDelete
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {canDelete ? 'Status: Not Used · Delete enabled' : `Status: In Use · ${routeCount} route${routeCount === 1 ? '' : 's'}, ${studentCount} student${studentCount === 1 ? '' : 's'}`}
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Latitude</p>
            <p className="text-sm font-semibold text-gray-800 font-mono">{stop.latitude ?? '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Longitude</p>
            <p className="text-sm font-semibold text-gray-800 font-mono">{stop.longtitude ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Card Footer — Actions */}
      <div className="px-6 pb-5 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all duration-200"
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
          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          title="Edit Stop"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={onDelete}
          className={`p-2.5 rounded-xl transition-colors ${canDelete ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700'}`}
          title={canDelete ? 'Delete Stop' : 'Stop is in use'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StopCard;

// Made with Bob
