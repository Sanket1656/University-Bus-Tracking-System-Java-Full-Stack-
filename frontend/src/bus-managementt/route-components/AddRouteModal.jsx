import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Drag-sortable stop row ───────────────────────────────────────────────────
const StopRow = ({ stop, index, total, onRemove, onMoveUp, onMoveDown }) => (
  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
      {index + 1}
    </span>
    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{stop.stopName}</span>
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={index === 0}
        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Move up"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={index === total - 1}
        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Move down"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
        title="Remove stop"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
);

// ─── Stop search dropdown ─────────────────────────────────────────────────────
const StopSearchDropdown = ({ allStops, selectedIds, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const available = allStops.filter(
    (s) =>
      !selectedIds.includes(s._id) &&
      s.stopName.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 border border-dashed border-violet-300 rounded-xl text-sm text-violet-600 hover:bg-violet-50 transition-colors ${open ? 'bg-violet-50' : ''}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Stop to Route
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[60] mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search stops…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {available.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  {allStops.length === 0 ? 'No stops created yet' : 'All stops already added'}
                </div>
              ) : (
                available.map((opt) => (
                  <button
                    key={opt._id}
                    type="button"
                    onClick={() => { onAdd(opt); setOpen(false); setQuery(''); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {opt.stopName}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── AddRouteModal ────────────────────────────────────────────────────────────
const AddRouteModal = ({ isOpen, onClose, onSubmit, editRoute, stops = [] }) => {
  // selectedStops: array of full stop objects in order
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [selectedStops, setSelectedStops] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (editRoute) {
      setRouteName(editRoute.routeName || '');
      setRouteCode(editRoute.routeCode || '');

      // editRoute.stops is [{stop: {_id, stopName, ...}, order}, ...]
      // sorted by order ascending
      const ordered = [...(editRoute.stops || [])]
        .sort((a, b) => a.order - b.order)
        .map((s) => s.stop)
        .filter(Boolean);
      setSelectedStops(ordered);
    } else {
      resetForm();
    }
  }, [editRoute, isOpen]);

  const resetForm = () => {
    setRouteName('');
    setRouteCode('');
    setSelectedStops([]);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!routeName.trim()) e.routeName = 'Route name is required';
    if (!routeCode.trim()) e.routeCode = 'Route code is required';
    if (selectedStops.length < 2) e.stops = 'At least 2 stops are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Backend expects: { routeName, routeCode, stops: [id1, id2, ...] }
      await onSubmit({
        routeName: routeName.trim(),
        routeCode: routeCode.trim(),
        stops: selectedStops.map((s) => s._id),
      });
      resetForm();
    } catch {
      // error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const addStop = (stop) => {
    setSelectedStops((prev) => [...prev, stop]);
    if (errors.stops) setErrors((prev) => ({ ...prev, stops: '' }));
  };

  const removeStop = (index) => {
    setSelectedStops((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStop = (from, to) => {
    if (to < 0 || to >= selectedStops.length) return;
    const next = [...selectedStops];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSelectedStops(next);
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-violet-300'
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
                <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editRoute ? 'Edit Route' : 'Add New Route'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{editRoute ? 'Update route information' : 'Fill in route details'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Route Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Route Name <span className="text-red-500">*</span>
                </label>

                {editRoute?.invalidStopReferences?.length > 0 && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Invalid Stop Reference: a deleted stop was removed. Select a replacement if this route needs at least two stops.
                  </div>
                )}
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => { setRouteName(e.target.value); if (errors.routeName) setErrors((p) => ({ ...p, routeName: '' })); }}
                  className={inputCls('routeName')}
                  placeholder="e.g., Campus Main Loop"
                />
                {errors.routeName && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.routeName}
                  </p>
                )}
              </div>

              {/* Route Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Route Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={routeCode}
                  onChange={(e) => { setRouteCode(e.target.value); if (errors.routeCode) setErrors((p) => ({ ...p, routeCode: '' })); }}
                  className={inputCls('routeCode')}
                  placeholder="e.g., RT-001"
                />
                {errors.routeCode && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.routeCode}
                  </p>
                )}
              </div>

              {/* Stops */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Stops <span className="text-red-500">*</span>
                  <span className="ml-1.5 text-gray-400 font-normal text-xs">(min. 2, ordered top → bottom)</span>
                </label>

                {/* Selected stop list */}
                {selectedStops.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {selectedStops.map((stop, i) => (
                      <StopRow
                        key={stop._id}
                        stop={stop}
                        index={i}
                        total={selectedStops.length}
                        onRemove={() => removeStop(i)}
                        onMoveUp={() => moveStop(i, i - 1)}
                        onMoveDown={() => moveStop(i, i + 1)}
                      />
                    ))}
                  </div>
                )}

                <StopSearchDropdown
                  allStops={stops}
                  selectedIds={selectedStops.map((s) => s._id)}
                  onAdd={addStop}
                />

                {errors.stops && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.stops}
                  </p>
                )}
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
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>{editRoute ? 'Update Route' : 'Add Route'}</>
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

export default AddRouteModal;

// Made with Bob
