import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const BusCard = ({ bus, onView, onEdit, onDelete, index }) => {
  const [showActions, setShowActions] = useState(false);

  const statusColors = {
    active: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500'
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      dot: 'bg-gray-500'
    },
    maintenance: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500'
    }
  };

  const status = statusColors[bus.busStatus] || statusColors.inactive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl group"
    >
          

      {/* Bus Image */}
      <div className="relative h-48 bg-linear-to-br from-indigo-100 to-blue-100 overflow-hidden">
        {bus.busPhoto ? (
          <img
            src={resolveMediaUrl(bus.busPhoto)}
            alt={bus.busName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-24 h-24 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text} backdrop-blur-sm`}>
            <span className={`w-2 h-2 rounded-full ${status.dot} mr-2 animate-pulse`}></span>
            {bus.busStatus.charAt(0).
            
            
            toUpperCase() + bus.busStatus.slice(1)}
          </span>
        </div>

        {/* Quick Actions Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all"
          >
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Actions Dropdown */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-12 left-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-10"
              >
                <button
                  onClick={() => {
                    onView();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center text-gray-700 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center text-gray-700 hover:text-blue-600"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Bus
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center text-gray-700 hover:text-red-600"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete Bus
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bus Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {bus.busName}
        </h3>

        <div className="space-y-3">
          {/* Bus Number */}
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">
              <span className="font-medium text-gray-700">Bus No:</span> {bus.busNumber}
            </span>
          </div>

          {/* Registration Number */}
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3.586l-.707.707a1 1 0 01-1.414 0L9.586 18H6a1 1 0 110-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">
              <span className="font-medium text-gray-700">Reg:</span> {bus.busRegistrationNumber}
            </span>
          </div>

          {/* Bus Type & Capacity */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg mr-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{bus.busType}</span>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-lg mr-2">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{bus.busCapacity} Seats</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onView}
            className="flex-1 px-4 py-2 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          >
            View Details
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BusCard;

// Made with Bob
