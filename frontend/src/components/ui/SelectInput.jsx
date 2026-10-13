import React from 'react';
import { ChevronDown } from 'lucide-react';

export const SelectInput = React.forwardRef(
  (
    {
      label,
      error,
      required,
      placeholder,
      options = [],
      className = '',
      hint,
      ...props
    },
    ref
  ) => (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          {...props}
          className={`w-full h-10 pl-3.5 pr-9 text-sm rounded-xl text-gray-900 border appearance-none transition-all shadow-2xs focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
              : 'border-gray-200 bg-white hover:border-gray-300 focus:ring-purple-500/20 focus:border-purple-600'
          }`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  )
);

SelectInput.displayName = 'SelectInput';
export default SelectInput;
