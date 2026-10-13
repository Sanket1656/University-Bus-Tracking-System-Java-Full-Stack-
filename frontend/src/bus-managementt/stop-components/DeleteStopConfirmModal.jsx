import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteStopConfirmModal = ({ isOpen, onClose, onConfirm, stopName, dependencies = null }) => {
  if (!isOpen) return null;

  const isBlocked = Boolean(dependencies && (
    dependencies.routes?.length || dependencies.studentsUsingStop
  ));

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

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Warning Header */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 px-6 pt-8 pb-6 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg mb-4"
              >
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900">{isBlocked ? 'Cannot Delete Bus Stop' : 'Delete Stop?'}</h3>
              <p className="text-sm text-gray-600 text-center mt-2">
                {isBlocked ? (
                  <><span className="font-semibold text-gray-900">"{stopName}"</span> is currently being used.</>
                ) : (
                  <>You are about to delete <span className="font-semibold text-gray-900">"{stopName}"</span>.<br />This action cannot be undone.</>
                )}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
              {/* Warning notice */}
              <div className={`${isBlocked ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-xl p-4 mt-5 mb-6`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-5 h-5 ${isBlocked ? 'text-amber-500' : 'text-red-500'} flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    {isBlocked ? (
                      <>
                        <p className="font-semibold mb-1">Used by:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>{dependencies.routes?.length || 0} route{dependencies.routes?.length === 1 ? '' : 's'}</li>
                          <li>{dependencies.studentsUsingStop || 0} student{dependencies.studentsUsingStop === 1 ? '' : 's'} as pickup stop</li>
                        </ul>
                        <p className="text-xs mt-2">Remove this stop from routes and update affected student requests before deleting it.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold mb-1">This will permanently delete:</p>
                        <ul className="list-disc list-inside space-y-1 text-red-700 text-xs">
                          <li>Stop name, coordinates and description</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isBlocked && <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </motion.button>}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={isBlocked ? onClose : onConfirm}
                  className={`${isBlocked ? 'w-full bg-gray-700 hover:bg-gray-800' : 'flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-lg'} px-5 py-3 text-white rounded-xl transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {isBlocked ? 'Close' : 'Delete Stop'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteStopConfirmModal;

// Made with Bob
