import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteAssignmentConfirmModal = ({ isOpen, onClose, onConfirm, assignment }) => {
  if (!isOpen) return null;

  const bus    = assignment?.bus    || {};
  const driver = assignment?.driver || {};
  const route  = assignment?.route  || {};

  const busName    = bus.busName   || bus.name  || 'Unknown Bus';
  const driverName = driver.name   || driver.fullName || driver.driverName || 'Unassigned';
  const routeName  = route.routeName  || route.name  || 'Unknown Route';
  const routeCode  = route.routeCode  || route.code  || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Icon header */}
            <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 220 }}
                className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </motion.div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Assignment?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This action cannot be undone. The bus, driver and route will become available for reassignment.
              </p>
            </div>

            {/* Assignment preview */}
            <div className="mx-6 mb-5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{busName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {driverName} · {routeName}{routeCode ? ` (${routeCode})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteAssignmentConfirmModal;

// Made with Bob
