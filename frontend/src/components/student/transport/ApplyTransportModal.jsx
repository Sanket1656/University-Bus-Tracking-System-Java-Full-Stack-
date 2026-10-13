import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import SelectInput from '../../ui/SelectInput';
import stopApi from '../../../api/stopApi';
import transportRequestApi from '../../../api/transportRequestApi';
import { useToast } from '../../../context/ToastContext';

/**
 * ApplyTransportModal
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onSuccess – () => void   (refresh parent data)
 */
const ApplyTransportModal = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToast();

  const [stops, setStops]               = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [preferredStop, setPreferredStop] = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  /* Load bus stops whenever modal opens */
  useEffect(() => {
    if (!isOpen) return;
    setPreferredStop('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preferredStop) {
      setError('Please select a preferred stop.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await transportRequestApi.createTransportRequest(preferredStop);
      addToast(data?.message || 'Transport request submitted successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit transport request.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stopOptions = stops.map((s) => ({
    value: s._id || s.id,
    label: s.stopName || s.name || s._id || s.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Transport"
      subtitle="Select your preferred bus stop to submit a request."
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="apply-transport-form"
            disabled={submitting || stopsLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            Submit Request
          </button>
        </>
      }
    >
      <form id="apply-transport-form" onSubmit={handleSubmit} className="space-y-4">
        {stopsLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
            Loading stops…
          </div>
        ) : (
          <SelectInput
            label="Preferred Stop"
            required
            placeholder="Select a bus stop"
            value={preferredStop}
            onChange={(e) => { setPreferredStop(e.target.value); setError(''); }}
            options={stopOptions}
            error={error}
          />
        )}
      </form>
    </Modal>
  );
};

export default ApplyTransportModal;
