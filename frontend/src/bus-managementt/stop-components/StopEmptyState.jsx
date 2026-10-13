import React from 'react';
import { motion } from 'framer-motion';

const StopEmptyState = ({ onAddStop }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-14 text-center"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        className="mb-8 flex justify-center"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-3xl"
          />
          <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
            <motion.svg
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </motion.svg>
          </div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Stops Found</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create your first Bus Stop to start managing pick-up and drop-off locations for university routes.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onAddStop}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Create your first Bus Stop
      </motion.button>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
      >
        {[
          {
            icon: (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            ),
            bg: 'bg-blue-100',
            title: 'GPS Coordinates',
            desc: 'Store precise lat/lng for every stop',
          },
          {
            icon: (
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            ),
            bg: 'bg-indigo-100',
            title: 'Route Linking',
            desc: 'Connect stops to bus routes easily',
          },
          {
            icon: (
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ),
            bg: 'bg-emerald-100',
            title: 'Status Tracking',
            desc: 'Mark stops as active or inactive',
          },
        ].map((f, i) => (
          <div key={i} className="text-center">
            <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              {f.icon}
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h4>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default StopEmptyState;

// Made with Bob
