import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import transportRequestApi from '../../../api/transportRequestApi';
import { useToast } from '../../../context/ToastContext';
import { AlertCircle, Info } from 'lucide-react';

/**
 * CancelTransportModal
 *
 * Props:
 *   isOpen         – boolean
 *   onClose        – () => void
 *   onSuccess      – () => void   (refresh parent data)
 *   currentStatus  – 'Pending' | 'Approved'
 */
const CancelTransportModal = ({ isOpen, onClose, onSuccess, currentStatus }) => {
  const { addToast } = useToast();

  const [reason, setReason]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const isApproved = currentStatus === 'Approved';

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* For approved requests, reason is mandatory (backend enforces it too) */
    if (isApproved && !reason.trim()) {
      setError('Please provide a reason for cancellation.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await transportRequestApi.cancelMyTransportRequest(reason.trim() || undefined);
      addToast(data?.message || 'Cancellation submitted successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit cancellation.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApproved ? 'Request Transport Cancellation' : 'Cancel Transport Request'}
      subtitle={
        isApproved
          ? 'Submit a cancellation request for admin approval.'
          : 'This action will cancel your pending transport request.'
      }
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Transport
          </button>
          <button
            type="submit"
            form="cancel-transport-form"
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            {isApproved ? 'Submit Request' : 'Cancel Request'}
          </button>
        </>
      }
    >
      <form id="cancel-transport-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Behaviour explanation */}
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border ${
          isApproved
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-100'
        }`}>
          {isApproved
            ? <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            : <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          }
          <p className={`text-xs font-medium ${isApproved ? 'text-amber-700' : 'text-blue-700'}`}>
            {isApproved
              ? 'Your request is currently approved. Cancellation requires admin approval. Your bus assignment and seat will be released only after the admin approves.'
              : 'Your pending request will be cancelled immediately. You can submit a new request at any time.'}
          </p>
        </div>

        {/* Reason textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Reason {isApproved && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <textarea
            rows={3}
            placeholder={isApproved ? 'Enter your reason for cancellation…' : 'Optional reason…'}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default CancelTransportModal;
