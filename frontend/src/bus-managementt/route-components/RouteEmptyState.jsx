import React from 'react';
import { motion } from 'framer-motion';

const RouteEmptyState = ({ onAddRoute }) => {
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
            className="absolute inset-0 bg-gradient-to-br from-violet-200 to-indigo-200 rounded-full blur-3xl"
          />
          <div className="relative w-32 h-32 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
            <motion.svg
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </motion.svg>
          </div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Routes Found</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create your first Bus Route to start connecting stops and assigning buses to university schedules.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onAddRoute}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Create your first Route
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
              <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ),
            bg: 'bg-violet-100',
            title: 'Stop Linking',
            desc: 'Connect start, end and intermediate stops',
          },
          {
            icon: (
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            ),
            bg: 'bg-indigo-100',
            title: 'Distance & Time',
            desc: 'Track estimated distance and travel time',
          },
          {
            icon: (
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ),
            bg: 'bg-emerald-100',
            title: 'Status Control',
            desc: 'Set routes as active, assigned or inactive',
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

export default RouteEmptyState;

// Made with Bob
