import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100'
    },
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100'
    },
    gray: {
      bg: 'from-gray-500 to-gray-600',
      light: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-100'
    },
    amber: {
      bg: 'from-amber-500 to-amber-600',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100'
    }
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  const icons = {
    bus: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    times: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  };

  const isPositive = trend?.startsWith('+');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-2xl shadow-lg border ${colors.border} p-6 transition-all duration-300 hover:shadow-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} shadow-lg`}>
          <div className="text-white">
            {icons[icon]}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            <svg className={`w-4 h-4 mr-1 ${isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {trend}
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className={`text-3xl font-bold ${colors.text}`}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default StatCard;

// Made with Bob
