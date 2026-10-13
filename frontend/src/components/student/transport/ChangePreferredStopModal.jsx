import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import SearchBar from '../../ui/SearchBar';
import stopApi from '../../../api/stopApi';
import transportRequestApi from '../../../api/transportRequestApi';
import { useToast } from '../../../context/ToastContext';
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * ChangePreferredStopModal — searchable stop-card selector
 *
 * Props:
 *   isOpen        – boolean
 *   onClose       – () => void
 *   onSuccess     – () => void
 *   currentStop   – string | null  (display name)
 *   currentStatus – 'Pending' | 'Approved'
 */
const ChangePreferredStopModal = ({ isOpen, onClose, onSuccess, currentStop, currentStatus }) => {
  const { addToast } = useToast();

  const [stops, setStops]         = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [query, setQuery]         = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  /* ── load stops when modal opens ── */
  useEffect(() => {
    if (!isOpen) return;
    setSelectedId('');
    setQuery('');
    setError('');
    setStopsLoading(true);
    stopApi
      .getAll()
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setStops(list);
      })
      .catch(() => addToast('Failed to load bus stops.', 'error'))
      .finally(() => setStopsLoading(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── filter stops by query ── */
  const filtered = useMemo(() => {
    if (!query.trim()) return stops;
    const q = query.toLowerCase();
    return stops.filter((s) =>
      (s.stopName || s.name || '').toLowerCase().includes(q)
    );
  }, [stops, query]);

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!selectedId) { setError('Please select a bus stop.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await transportRequestApi.updatePreferredStop(selectedId);
      addToast(data?.message || 'Preferred stop updated successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update preferred stop.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setSelectedId('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Preferred Stop"
      subtitle="Select the bus stop closest to your location."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || stopsLoading || !selectedId}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            Update Stop
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Current stop chip */}
        {currentStop && (
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Current Stop</p>
              <p className="text-sm font-semibold text-gray-900">{currentStop}</p>
            </div>
          </div>
        )}

        {/* Approved warning */}
        {currentStatus === 'Approved' && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Changing your stop on an approved request will remove your current assignment and seat.
              Your request will return to <strong>Pending</strong> and the admin will need to assign you again.
            </p>
          </div>
        )}

        {/* Search */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search bus stops…"
        />

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Stop list */}
        {stopsLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            Loading stops…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MapPin className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">
              {query ? `No stops matching "${query}"` : 'No stops available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 -mr-1">
            {filtered.map((stop) => {
              const id       = stop._id || stop.id;
              const name     = stop.stopName || stop.name || id;
              const selected = String(selectedId) === String(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setSelectedId(id); setError(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                      : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected ? 'bg-indigo-100' : 'bg-gray-50'
                  }`}>
                    <MapPin className={`w-4 h-4 ${selected ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {name}
                    </p>
                  </div>
                  {selected && (
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChangePreferredStopModal;
