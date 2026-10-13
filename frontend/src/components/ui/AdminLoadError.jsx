import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const AdminLoadError = ({ message = 'This data could not be loaded.', onRetry }) => (
  <div role="alert" className="bg-white rounded-xl border border-rose-200 shadow-xs px-6 py-10 text-center">
    <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
    <p className="text-sm font-semibold text-gray-900">Unable to load this list</p>
    <p className="text-xs text-gray-500 mt-1">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    )}
  </div>
);

export default AdminLoadError;