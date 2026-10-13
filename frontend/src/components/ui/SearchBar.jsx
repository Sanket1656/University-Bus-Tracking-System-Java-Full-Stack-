import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
  className = '',
}) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 pl-10 pr-9 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
    />
    {value && (
      <button
        type="button"
        onClick={onClear ?? (() => onChange(''))}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        title="Clear search"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export default SearchBar;
