import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Route as RouteIcon,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  ArrowRight,
  MapPin,
  Compass,
  Search,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import routeApi from '../../api/routeApi';
import stopApi from '../../api/stopApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import RouteTimeline from '../../components/ui/RouteTimeline';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import FormInput from '../../components/ui/FormInput';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';

/* ── Route Detail Drawer ─────────────────────────────────────────────────── */
const RouteDetailDrawer = ({ route, onClose, onEdit }) => {
  if (!route) return null;
  const sorted = [...(route.stops || [])].sort((a, b) => a.order - b.order);
  const first = sorted[0]?.stop?.stopName ?? '—';
  const last = sorted[sorted.length - 1]?.stop?.stopName ?? '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{route.routeName}</h2>
              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {route.routeCode}
              </span>
            </div>
            <p className="text-purple-200 text-xs mt-0.5">Ordered transit corridor</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              title="Edit route"
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
              <p className="text-lg font-bold text-gray-900">{route.stops?.length ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Stops</p>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-800 truncate" title={first}>
                {first}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-medium uppercase tracking-wider">
                Start
              </p>
            </div>
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3">
              <p className="text-xs font-bold text-rose-800 truncate" title={last}>
                {last}
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5 font-medium uppercase tracking-wider">
                Terminal
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sequential Route Timeline
            </p>
            <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4">
              <RouteTimeline stops={sorted} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Route Builder Form ───────────────────────────────────────────────────── */
const RouteForm = ({
  initial,
  allStops = [],
  stopsLoading = false,
  stopsError = false,
  onRetryStops,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const { addToast } = useToast();
  const [routeName, setName] = useState(initial?.routeName || '');
  const [routeCode, setCode] = useState(initial?.routeCode || '');
  const [selected, setSelected] = useState(() => {
    if (!initial?.stops || !Array.isArray(initial.stops)) return [];
    return [...initial.stops]
      .sort((a, b) => (a.order || a.stopOrder || 0) - (b.order || b.stopOrder || 0))
      .map((s) => {
        const stopObj = s.stop || s;
        const sId = String(stopObj._id || stopObj.id || s._id || s.id);
        const matched = allStops.find((as) => String(as._id || as.id) === sId);
        return {
          id: stopObj.id || matched?.id,
          _id: sId,
          stopName:
            stopObj.stopName ||
            stopObj.name ||
            matched?.stopName ||
            matched?.name ||
            'Bus Stop',
          latitude: stopObj.latitude ?? matched?.latitude ?? null,
          longitude:
            stopObj.longitude ??
            stopObj.longtitude ??
            matched?.longitude ??
            matched?.longtitude ??
            null,
        };
      });
  });
  const [stopSearch, setStopSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Synchronize stop metadata if allStops finishes loading after mount
  useEffect(() => {
    if (initial?.stops && allStops.length > 0) {
      setSelected((prev) =>
        prev.map((sel) => {
          const matched = allStops.find(
            (as) => String(as._id || as.id) === String(sel._id || sel.id)
          );
          if (matched) {
            return {
              ...sel,
              stopName: sel.stopName || matched.stopName || matched.name,
              latitude: sel.latitude ?? matched.latitude,
              longitude:
                sel.longitude ?? matched.longitude ?? matched.longtitude,
            };
          }
          return sel;
        })
      );
    }
  }, [allStops, initial]);

  const validate = () => {
    const e = {};
    if (!routeName.trim()) e.routeName = 'Route name is required';
    if (!routeCode.trim()) e.routeCode = 'Route code is required';
    if (selected.length < 2) {
      e.stops = 'Please select at least 2 bus stops to form a valid route.';
      addToast('Please select at least 2 bus stops to form a route.', 'error');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const toggleStop = (stop) => {
    const sId = String(stop._id || stop.id);
    const existingIndex = selected.findIndex(
      (s) => String(s._id || s.id) === sId
    );
    if (existingIndex !== -1) {
      setSelected((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const newStop = {
        id: stop.id,
        _id: sId,
        stopName: stop.stopName || stop.name || 'Bus Stop',
        latitude: stop.latitude ?? null,
        longitude: stop.longitude ?? stop.longtitude ?? null,
      };
      setSelected((prev) => [...prev, newStop]);
    }
    setErrors((prev) => ({ ...prev, stops: '' }));
  };

  const removeStop = (stopId) => {
    const sId = String(stopId);
    setSelected((prev) => prev.filter((s) => String(s._id || s.id) !== sId));
  };

  const moveStop = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selected.length) return;
    setSelected((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const clearAllSelected = () => {
    setSelected([]);
    setErrors((prev) => ({ ...prev, stops: '' }));
  };

  const filteredAvailableStops = useMemo(() => {
    if (!stopSearch.trim()) return allStops;
    const query = stopSearch.toLowerCase().trim();
    return allStops.filter((stop) => {
      const name = (stop.stopName || stop.name || '').toLowerCase();
      const lat = stop.latitude != null ? String(stop.latitude) : '';
      const lng =
        (stop.longitude != null ? stop.longitude : stop.longtitude) != null
          ? String(stop.longitude || stop.longtitude)
          : '';
      return (
        name.includes(query) ||
        lat.includes(query) ||
        lng.includes(query)
      );
    });
  }, [allStops, stopSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      routeName: routeName.trim(),
      routeCode: routeCode.trim().toUpperCase(),
      stops: selected.map((s) => Number(s.id || s._id)),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Basic Info (Route Name & Code) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Route Name"
          required
          value={routeName}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.routeName) setErrors((prev) => ({ ...prev, routeName: '' }));
          }}
          error={errors.routeName}
          placeholder="e.g. South Campus Express Line"
        />
        <FormInput
          label="Route Code"
          required
          value={routeCode}
          onChange={(e) => {
            setCode(e.target.value);
            if (errors.routeCode) setErrors((prev) => ({ ...prev, routeCode: '' }));
          }}
          error={errors.routeCode}
          placeholder="e.g. RT-01"
          hint="Automatically capitalized"
        />
      </div>

      {/* ── Route Stop Selector ── */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Select Bus Stops & Route Order <span className="text-rose-500">*</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Select available bus stops and order them sequentially from Start to Terminal.
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                selected.length >= 2
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : selected.length === 1
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {selected.length >= 2
                ? `✓ ${selected.length} stops in sequence`
                : `${selected.length}/2 minimum stops`}
            </span>
          </div>
        </div>

        {errors.stops && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.stops}</span>
          </div>
        )}

        {/* ── Two-Column Responsive Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ────────────────────────────────────────────────────────
              COLUMN 1: AVAILABLE BUS STOPS
          ─────────────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-gray-200/90 bg-gray-50/60 p-4 shadow-2xs">
            {/* Column Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Available Bus Stops
                </h3>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                {allStops.length} stops
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={stopSearch}
                onChange={(e) => setStopSearch(e.target.value)}
                placeholder="Search bus stops by name..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-gray-400 shadow-2xs"
              />
              {stopSearch && (
                <button
                  type="button"
                  onClick={() => setStopSearch('')}
                  title="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stops Scrollable List */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stopsLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl border border-gray-200 bg-white animate-pulse p-3 flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-md bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-gray-200" />
                        <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stopsError ? (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-center space-y-2 my-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-700 font-medium">
                    Unable to load bus stops. Please try again.
                  </p>
                  {onRetryStops && (
                    <button
                      type="button"
                      onClick={onRetryStops}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                </div>
              ) : allStops.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center space-y-1.5 my-2">
                  <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">No bus stops available.</p>
                  <p className="text-[11px] text-gray-400">
                    Create stops in the Stops section before building routes.
                  </p>
                </div>
              ) : filteredAvailableStops.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center space-y-2 my-2">
                  <Search className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">No bus stops match your search.</p>
                  <button
                    type="button"
                    onClick={() => setStopSearch('')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                filteredAvailableStops.map((stop) => {
                  const sId = String(stop._id || stop.id);
                  const isSelected = selected.some(
                    (s) => String(s._id || s.id) === sId
                  );
                  const orderIndex = isSelected
                    ? selected.findIndex(
                        (s) => String(s._id || s.id) === sId
                      ) + 1
                    : null;

                  return (
                    <div
                      key={sId}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => toggleStop(stop)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleStop(stop);
                        }
                      }}
                      className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'border-purple-300 bg-purple-50/70 shadow-2xs ring-1 ring-purple-400/30'
                          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-2xs'
                      }`}
                    >
                      <div className="pt-0.5 flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                              : 'bg-white border-gray-300 group-hover:border-purple-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {stop.stopName || stop.name || 'Unnamed Stop'}
                          </p>
                          {isSelected ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                              Stop #{orderIndex}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              + Add
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {stop.latitude != null &&
                            (stop.longitude != null || stop.longtitude != null)
                              ? `${Number(stop.latitude).toFixed(4)}, ${Number(
                                  stop.longitude || stop.longtitude
                                ).toFixed(4)}`
                              : 'Location pinned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              COLUMN 2: SELECTED STOPS (ORDERED)
          ─────────────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-gray-200/90 bg-gray-50/60 p-4 shadow-2xs">
            {/* Column Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Selected Stops ({selected.length})
                </h3>
              </div>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Guidance banner */}
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100/80 mb-3 text-[11px] text-purple-800 flex items-center justify-between">
              <span className="font-semibold truncate">
                {selected.length === 0
                  ? 'Route sequence is empty'
                  : `Route order: #${1} Start → #${selected.length} Terminal`}
              </span>
              <span className="text-purple-600 font-mono text-[10px] hidden sm:inline">
                Use ▲ / ▼ to reorder
              </span>
            </div>

            {/* Selected Stops Scrollable List */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {selected.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-gray-200 text-center space-y-2 my-2">
                  <Compass className="w-7 h-7 text-gray-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">No stops selected yet.</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Click stops in the available list on the left to add them to your route sequence.
                  </p>
                </div>
              ) : (
                selected.map((s, index) => {
                  const isStart = index === 0;
                  const isTerminal = index === selected.length - 1 && selected.length > 1;
                  const sKey = String(s._id || s.id || index);

                  return (
                    <div
                      key={sKey}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isStart
                          ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                          : isTerminal
                          ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                          : 'bg-white border-gray-200 shadow-2xs hover:border-gray-300'
                      }`}
                    >
                      {/* Left: Sequence index + Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center text-white shadow-2xs ${
                              isStart
                                ? 'bg-emerald-600'
                                : isTerminal
                                ? 'bg-rose-600'
                                : 'bg-purple-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                isStart
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isTerminal
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {isStart
                                ? 'Start'
                                : isTerminal
                                ? 'Terminal'
                                : `Stop ${index + 1}`}
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                              {s.stopName}
                            </p>
                          </div>
                          {(s.latitude != null || s.longitude != null) && (
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              📍 {Number(s.latitude).toFixed(4)},{' '}
                              {Number(s.longitude).toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStop(index, -1)}
                          disabled={index === 0}
                          title="Move up in route order"
                          aria-label={`Move ${s.stopName} up`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-700 hover:bg-purple-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(index, 1)}
                          disabled={index === selected.length - 1}
                          title="Move down in route order"
                          aria-label={`Move ${s.stopName} down`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-700 hover:bg-purple-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStop(s._id || s.id)}
                          title="Remove from route"
                          aria-label={`Remove ${s.stopName}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Actions / Footer ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors shadow-xs"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          )}
          <span>{initial ? 'Save Route Changes' : 'Create Route'}</span>
        </button>
      </div>
    </form>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const RoutesPage = () => {
  const { addToast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [stopsError, setStopsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0 });
  const [modal, setModal] = useState(false);
  const [editRoute, setEdit] = useState(null);
  const [detail, setDetail] = useState(null);
  const [delRoute, setDel] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStops = useCallback(async () => {
    setStopsLoading(true);
    setStopsError(false);
    try {
      const sRes = await stopApi.getAll({ limit: 500 });
      const raw = sRes.data?.data || sRes.data || [];
      setAllStops(Array.isArray(raw) ? raw : []);
    } catch {
      setStopsError(true);
    } finally {
      setStopsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (requestedPage = page, requestedSearch = search) => {
    setLoading(true);
    setLoadError(false);
    setStopsLoading(true);
    setStopsError(false);
    try {
      const [rRes, sRes] = await Promise.allSettled([
        routeApi.getAll({ page: requestedPage, limit: 10, search: requestedSearch }),
        stopApi.getAll({ limit: 500 }),
      ]);

      if (rRes.status === 'fulfilled') {
        const nextPagination = rRes.value.data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
        if (requestedPage > nextPagination.totalPages) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }
        setRoutes(rRes.value.data.data || []);
        setPagination(nextPagination);
        setSummary(rRes.value.data.summary || { total: nextPagination.total });
      } else {
        setLoadError(true);
        addToast('Failed to load routes', 'error');
      }

      if (sRes.status === 'fulfilled') {
        const raw = sRes.value.data?.data || sRes.value.data || [];
        setAllStops(Array.isArray(raw) ? raw : []);
        setStopsError(false);
      } else {
        setStopsError(true);
      }
    } finally {
      setLoading(false);
      setStopsLoading(false);
    }
  }, [addToast, page, search]);

  useEffect(() => {
    fetchData(page, search);
  }, [fetchData, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editRoute) {
        await routeApi.update(editRoute._id, payload);
        addToast('Route updated successfully', 'success');
      } else {
        await routeApi.create(payload);
        addToast('Route created successfully', 'success');
      }
      setModal(false);
      setEdit(null);
      fetchData(page, search);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save route', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = async (route) => {
    try {
      const res = await routeApi.getDependencies(route._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDel(route);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDel(route);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await routeApi.delete(delRoute._id);
      addToast('Route deleted successfully', 'success');
      setDel(null);
      fetchData(page, search);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDel(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to delete route', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateRoute = async (routeId) => {
    const targetId = routeId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await routeApi.deactivate(targetId);
      addToast('Route deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchData(page, search);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate route', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateRoute = async (routeId) => {
    try {
      await routeApi.reactivate(routeId);
      addToast('Route reactivated successfully', 'success');
      fetchData(page, search);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate route', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Route Management"
        description="Define transit routes, map ordered stop sequences, and assign operational codes"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Route</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Routes"
          value={loading ? <SkeletonStatValue /> : summary.total}
          icon={RouteIcon}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Configured corridors"
        />
        <StatCard
          title="Available Stops"
          value={loading ? <SkeletonStatValue /> : allStops.length}
          icon={MapPin}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Waypoints ready to link"
        />
        <StatCard
          title="Showing Records"
          value={loading ? <SkeletonStatValue /> : pagination.total}
          icon={Compass}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Active route results"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search routes by name or code…"
        debounceMs={350}
        onRefresh={() => fetchData(page, search)}
        refreshing={loading}
        extra={
          <span className="text-xs text-gray-500 font-medium">
            {routes.length} of {pagination.total} routes
          </span>
        }
      />

      {/* ── Data Surface ── */}
      {loading ? (
        <AdminSkeleton variant="table" rows={6} columns={6} />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchData(page, search)} />
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={RouteIcon}
            isSearch={Boolean(search)}
            title={search ? 'No routes match your query' : 'No routes configured yet'}
            description={
              search
                ? 'Try searching with another route name or code.'
                : 'Create your first route with at least 2 ordered stops.'
            }
            action={
              !search ? (
                <button
                  type="button"
                  onClick={() => setModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  + Create Route
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Start Stop
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Terminal Stop
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Stops Count
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routes.map((r) => {
                  const sorted = [...(r.stops || [])].sort((a, b) => a.order - b.order);
                  const start = sorted[0]?.stop?.stopName ?? '—';
                  const end = sorted[sorted.length - 1]?.stop?.stopName ?? '—';
                  return (
                    <tr key={r._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100 shadow-2xs">
                            <RouteIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{r.routeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
                          {r.routeCode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 max-w-[140px] truncate" title={start}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {start}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 max-w-[140px] truncate" title={end}>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          {end}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          {r.stops?.length ?? 0} waypoints
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <AdminActionButton
                            action="view"
                            onClick={() => setDetail(r)}
                            title="View route timeline"
                          />
                          <AdminActionButton
                            action="edit"
                            onClick={() => {
                              setEdit(r);
                              setModal(true);
                            }}
                            title="Edit route"
                          />
                          {r.status === 'INACTIVE' ? (
                            <AdminActionButton
                              action="activate"
                              onClick={() => handleReactivateRoute(r._id)}
                              title="Reactivate route"
                            />
                          ) : (
                            <AdminActionButton
                              action="deactivate"
                              onClick={() => handleDeactivateRoute(r._id)}
                              title="Deactivate route"
                            />
                          )}
                          <AdminActionButton
                            action="delete"
                            onClick={() => handleRequestDelete(r)}
                            title="Delete route"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {routes.map((r) => {
              const sorted = [...(r.stops || [])].sort((a, b) => a.order - b.order);
              const start = sorted[0]?.stop?.stopName ?? '—';
              const end = sorted[sorted.length - 1]?.stop?.stopName ?? '—';
              return (
                <div key={r._id} className="p-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100 shadow-2xs">
                        <RouteIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{r.routeName}</p>
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded">
                          {r.routeCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <AdminActionButton
                        action="view"
                        onClick={() => setDetail(r)}
                        size="sm"
                      />
                      <AdminActionButton
                        action="edit"
                        onClick={() => {
                          setEdit(r);
                          setModal(true);
                        }}
                        size="sm"
                      />
                      {r.status === 'INACTIVE' ? (
                        <AdminActionButton
                          action="activate"
                          onClick={() => handleReactivateRoute(r._id)}
                          size="sm"
                        />
                      ) : (
                        <AdminActionButton
                          action="deactivate"
                          onClick={() => handleDeactivateRoute(r._id)}
                          size="sm"
                        />
                      )}
                      <AdminActionButton
                        action="delete"
                        onClick={() => handleRequestDelete(r)}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs pt-2 border-t border-gray-100">
                    <span className="text-emerald-700 font-medium truncate">{start}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-rose-700 font-medium truncate">{end}</span>
                    <span className="text-gray-400 ml-auto flex-shrink-0">
                      {r.stops?.length ?? 0} stops
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table footer count */}
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            loading={loading}
            onPageChange={(nextPage) => {
              if (nextPage >= 1 && nextPage <= pagination.totalPages) {
                setPage(nextPage);
              }
            }}
          />
        </div>
      )}

      {/* ── Route Form Modal ── */}
      <Modal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          setEdit(null);
        }}
        title={editRoute ? 'Edit Route' : 'Create Route'}
        subtitle={
          editRoute
            ? `Updating stop sequence for "${editRoute.routeName}"`
            : 'Build a route by adding stops in sequence'
        }
        size="full"
      >
        <RouteForm
          key={editRoute?._id || 'new'}
          initial={editRoute}
          allStops={allStops}
          stopsLoading={stopsLoading}
          stopsError={stopsError}
          onRetryStops={fetchStops}
          onSubmit={handleSubmit}
          loading={saving}
          onCancel={() => {
            setModal(false);
            setEdit(null);
          }}
        />
      </Modal>

      {/* ── Route Detail Drawer ── */}
      <RouteDetailDrawer
        route={detail}
        onClose={() => setDetail(null)}
        onEdit={() => {
          setEdit(detail);
          setDetail(null);
          setModal(true);
        }}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delRoute)}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
        title="Delete Route?"
        description={`"${delRoute?.routeName} (${delRoute?.routeCode})" will be permanently removed.`}
        confirmLabel="Delete Route"
        loading={deleting}
      />

      {/* ── Dependency Check Modal ── */}
      <DependencyModal
        isOpen={depModalOpen}
        onClose={() => {
          setDepModalOpen(false);
          setDependencyData(null);
        }}
        dependencyData={dependencyData}
        onDeactivate={() => handleDeactivateRoute()}
        deactivating={deactivating}
        onConfirmDelete={() => {
          setDepModalOpen(false);
          setDel(dependencyData ? { _id: dependencyData.resourceId, routeName: dependencyData.resourceName, routeCode: '' } : null);
        }}
      />
    </div>
  );
};

export default RoutesPage;
