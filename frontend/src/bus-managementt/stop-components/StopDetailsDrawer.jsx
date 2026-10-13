import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StopDetailsDrawer = ({ isOpen, onClose, stop, onEdit }) => {
  if (!stop) return null;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Stop Details</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Complete stop information</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Stop Identity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{stop.stopName}</h3>
                    <p className="text-xs text-gray-500">Bus Stop</p>
                  </div>
                </div>
              </motion.div>

              {/* Coordinates */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Coordinates
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Latitude</p>
                    <p className="text-base font-bold text-gray-800 font-mono">{stop.latitude ?? '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Longitude</p>
                    <p className="text-base font-bold text-gray-800 font-mono">{stop.longtitude ?? '—'}</p>
                  </div>
                </div>
              </motion.div>

              {/* Timestamps */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5"
              >
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Timestamps
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-500 font-medium">Created</span>
                    <span className="text-gray-800 font-semibold text-right">{formatDate(stop.createdAt)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-500 font-medium">Last Updated</span>
                    <span className="text-gray-800 font-semibold text-right">{formatDate(stop.updatedAt)}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => { onEdit(stop); onClose(); }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-sm"
                >
                  Edit Stop
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StopDetailsDrawer;

// Made with Bob
