import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaUtils';

/* ── SelectPreview — shows a preview chip below the dropdown ──────────────── */
const SelectPreview = ({ icon, primary, secondary }) => (
  <div className="mt-2 flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-900 truncate">{primary}</p>
      {secondary && <p className="text-[10px] text-gray-500 truncate">{secondary}</p>}
    </div>
  </div>
);

/* ── AddAssignmentModal ────────────────────────────────────────────────────── */
const AddAssignmentModal = ({ isOpen, onClose, onSubmit, editAssignment, buses = [], drivers = [], routes = [] }) => {
  const [formData, setFormData] = useState({ bus: '', driver: '', route: '', status: 'Active' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const isEdit = Boolean(editAssignment);

  // Pre-fill when editing
  useEffect(() => {
    if (isOpen) {
      if (editAssignment) {
        setFormData({
          bus:    editAssignment.bus?._id    || editAssignment.bus    || '',
          driver: editAssignment.driver?._id || editAssignment.driver || '',
          route:  editAssignment.route?._id  || editAssignment.route  || '',
          status: editAssignment.status || 'Active',
        });
      } else {
        setFormData({ bus: '', driver: '', route: '', status: 'Active' });
      }
      setErrors({});
    }
  }, [isOpen, editAssignment]);

  const validate = () => {
    const e = {};
    if (!formData.bus)    e.bus    = 'Please select a bus';
    if (!formData.driver) e.driver = 'Please select a driver';
    if (!formData.route)  e.route  = 'Please select a route';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // error handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* resolved objects for previews */
  const selBus    = buses.find((b) => b._id === formData.bus);
  const selDriver = drivers.find((d) => d._id === formData.driver);
  const selRoute  = routes.find((r) => r._id === formData.route);

  const busLabel    = (b) => `${b.busName || b.name} — ${b.busRegistrationNumber || b.plateNumber || ''}`;
  const driverLabel = (d) => d.name || d.fullName || d.driverName || 'Driver';
  const routeLabel  = (r) => `${r.routeName || r.name} — ${r.routeCode || r.code || ''}`;

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
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {isEdit ? (
                    <>
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Assignment
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Assignment
                    </>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEdit ? 'Update bus, driver, route or status' : 'Link a bus, driver and route together'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Edit: context pill */}
            {isEdit && (
              <div className="mx-6 mt-4 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-600 font-medium">
                Editing assignment #{editAssignment._id?.slice(-8).toUpperCase()}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5">

              {/* Bus */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Bus <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.bus}
                  onChange={(e) => { setFormData((p) => ({ ...p, bus: e.target.value })); setErrors((p) => ({ ...p, bus: '' })); }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 ${errors.bus ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select a bus…</option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>{busLabel(b)}</option>
                  ))}
                </select>
                {errors.bus && <p className="mt-1 text-xs text-red-500">{errors.bus}</p>}
                {selBus && (
                  <SelectPreview
                    icon={
                      selBus.busPhoto
                        ? <img src={resolveMediaUrl(selBus.busPhoto)} alt="" className="w-full h-full object-cover rounded-lg" />
                        : <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>
                    }
                    primary={selBus.busName || selBus.name}
                    secondary={`${selBus.busRegistrationNumber || ''}${selBus.busCapacity ? ` · ${selBus.busCapacity} seats` : ''}${selBus.busStatus ? ` · ${selBus.busStatus}` : ''}`}
                  />
                )}
              </div>

              {/* Driver */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Driver <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.driver}
                  onChange={(e) => { setFormData((p) => ({ ...p, driver: e.target.value })); setErrors((p) => ({ ...p, driver: '' })); }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 ${errors.driver ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select a driver…</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>{driverLabel(d)}</option>
                  ))}
                </select>
                {errors.driver && <p className="mt-1 text-xs text-red-500">{errors.driver}</p>}
                {selDriver && (
                  <SelectPreview
                    icon={
                      selDriver.photo
                        ? <img src={resolveMediaUrl(selDriver.photo)} alt="" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-xs font-bold text-indigo-600">
                            {(selDriver.name || selDriver.fullName || '?').split(' ').slice(0,2).map(w=>w[0]).join('')}
                          </span>
                    }
                    primary={driverLabel(selDriver)}
                    secondary={selDriver.licenseId ? `License: ${selDriver.licenseId}` : selDriver.email || ''}
                  />
                )}
              </div>

              {/* Route */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Route <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => { setFormData((p) => ({ ...p, route: e.target.value })); setErrors((p) => ({ ...p, route: '' })); }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 ${errors.route ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select a route…</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{routeLabel(r)}</option>
                  ))}
                </select>
                {errors.route && <p className="mt-1 text-xs text-red-500">{errors.route}</p>}
                {selRoute && (
                  <SelectPreview
                    icon={
                      <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    }
                    primary={selRoute.routeName || selRoute.name}
                    secondary={`${selRoute.routeCode || ''}${selRoute.stops?.length ? ` · ${selRoute.stops.length} stops` : ''}`}
                  />
                )}
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <div className="flex gap-3">
                    {['Active', 'Inactive'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, status: s }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          formData.status === s
                            ? s === 'Active'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {s === 'Active' && formData.status === 'Active' && '✓ '}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isEdit
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    'Create Assignment'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AddAssignmentModal;

// Made with Bob
