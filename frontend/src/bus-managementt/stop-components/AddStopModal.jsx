import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddStopModal = ({ isOpen, onClose, onSubmit, editStop }) => {
  const [formData, setFormData] = useState({
    stopName: '',
    latitude: '',
    longtitude: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editStop) {
      setFormData({
        stopName: editStop.stopName || '',
        latitude: editStop.latitude ?? '',
        longtitude: editStop.longtitude ?? '',
      });
    } else {
      resetForm();
    }
  }, [editStop, isOpen]);

  const resetForm = () => {
    setFormData({ stopName: '', latitude: '', longtitude: '' });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.stopName.trim()) newErrors.stopName = 'Stop name is required';
    if (String(formData.latitude).trim() === '') newErrors.latitude = 'Latitude is required';
    if (String(formData.longtitude).trim() === '') newErrors.longtitude = 'Longitude is required';
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longtitude);
    if (formData.latitude !== '' && (isNaN(lat) || lat < -90 || lat > 90))
      newErrors.latitude = 'Latitude must be between -90 and 90';
    if (formData.longtitude !== '' && (isNaN(lng) || lng < -180 || lng > 180))
      newErrors.longtitude = 'Longitude must be between -180 and 180';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        stopName: formData.stopName.trim(),
        latitude: parseFloat(formData.latitude),
        longtitude: parseFloat(formData.longtitude),
      });
      resetForm();
    } catch {
      // error handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'
    }`;

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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editStop ? 'Edit Bus Stop' : 'Add New Bus Stop'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{editStop ? 'Update stop information' : 'Fill in stop details'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Stop Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Stop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="stopName"
                  value={formData.stopName}
                  onChange={handleChange}
                  className={inputCls('stopName')}
                  placeholder="e.g., Main Gate, Library Block"
                />
                {errors.stopName && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.stopName}
                  </p>
                )}
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="any"
                    className={inputCls('latitude')}
                    placeholder="e.g., 3.1390"
                  />
                  {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="longtitude"
                    value={formData.longtitude}
                    onChange={handleChange}
                    step="any"
                    className={inputCls('longtitude')}
                    placeholder="e.g., 101.6869"
                  />
                  {errors.longtitude && <p className="mt-1 text-xs text-red-500">{errors.longtitude}</p>}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>{editStop ? 'Update Stop' : 'Add Stop'}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AddStopModal;

// Made with Bob
