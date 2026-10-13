import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  loading = false,
  danger = true,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="sm"
    footer={
      <>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-2xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 shadow-2xs flex items-center gap-2 ${
            danger
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          )}
          {confirmLabel}
        </button>
      </>
    }
  >
    <div className="flex flex-col items-center text-center gap-3 py-2">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900">{title}</p>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  </Modal>
);

export const AdminConfirmDialog = ConfirmDialog;
export default ConfirmDialog;
