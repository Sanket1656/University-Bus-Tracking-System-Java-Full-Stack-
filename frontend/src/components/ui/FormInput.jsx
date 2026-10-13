import React from 'react';

export const FormInput = React.forwardRef(
  ({ label, error, required, className = '', hint, type = 'text', ...props }, ref) => (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        {...props}
        className={`w-full h-10 px-3.5 text-sm rounded-xl text-gray-900 placeholder-gray-400 border transition-all shadow-2xs focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-gray-200 bg-white hover:border-gray-300 focus:ring-purple-500/20 focus:border-purple-600'
        }`}
      />
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  )
);

FormInput.displayName = 'FormInput';
export default FormInput;
