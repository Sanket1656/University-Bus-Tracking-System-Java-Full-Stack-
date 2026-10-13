import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RouteDetailsDrawer = ({ isOpen, onClose, route, onEdit }) => {
  if (!route) return null;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  // stops is [{stop: {stopName, ...}, order}, ...] — sort by order
  const orderedStops = [...(route.stops || [])].sort((a, b) => a.order - b.order);

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
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Route Details</h2>
                  <p className="text-violet-100 text-sm mt-0.5">Complete route information</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Identity card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{route.routeName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{route.routeCode || '—'}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {orderedStops.length} Stop{orderedStops.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>

              {/* Route path */}
              {route.invalidStopReferences?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-bold">Invalid Stop Reference</p>
                  <p className="text-xs mt-1">{route.invalidStopReferences.length} deleted stop reference{route.invalidStopReferences.length === 1 ? '' : 's'} were removed from this route. Remaining stops were renumbered.</p>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Route Path ({orderedStops.length} stops)
                </h4>

                {orderedStops.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No stops assigned</p>
                ) : (
                  <div className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-400 via-violet-300 to-violet-500 min-h-[48px]" />
                      <div className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0" />
                    </div>

                    {/* Stops list */}
                    <div className="flex-1 space-y-2 min-w-0">
                      {orderedStops.map((s, i) => {
                        const isFirst = i === 0;
                        const isLast = i === orderedStops.length - 1;
                        const stopObj = s.stop;

                        if (isFirst) {
                          return (
                            <div key={s._id || i} className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">Start Stop</p>
                              <p className="text-sm font-bold text-gray-800">{stopObj?.stopName || '—'}</p>
                            </div>
                          );
                        }

                        if (isLast) {
                          return (
                            <div key={s._id || i} className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                              <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide mb-0.5">End Stop</p>
                              <p className="text-sm font-bold text-gray-800">{stopObj?.stopName || '—'}</p>
                            </div>
                          );
                        }

                        return (
                          <div key={s._id || i} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <p className="text-sm font-medium text-gray-700">{stopObj?.stopName || '—'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    <span className="text-gray-800 font-semibold text-right">{formatDate(route.createdAt)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-500 font-medium">Last Updated</span>
                    <span className="text-gray-800 font-semibold text-right">{formatDate(route.updatedAt)}</span>
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
                  onClick={() => { onEdit(route); onClose(); }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-sm"
                >
                  Edit Route
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RouteDetailsDrawer;

// Made with Bob
