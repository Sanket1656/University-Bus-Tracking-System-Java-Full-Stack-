import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import { RefreshCw } from 'lucide-react';

export const AdminFilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  onRefresh,
  refreshing = false,
  extra,
  className = '',
  debounceMs = 0,
}) => {
  const [draftSearch, setDraftSearch] = useState(search || '');

  useEffect(() => {
    if (!onSearchChange || !debounceMs || draftSearch === search) return undefined;
    const timeoutId = setTimeout(() => onSearchChange(draftSearch), debounceMs);
    return () => clearTimeout(timeoutId);
  }, [debounceMs, draftSearch, onSearchChange, search]);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onSearchChange && (
          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchBar
              value={debounceMs ? draftSearch : search}
              onChange={debounceMs ? setDraftSearch : onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {filters && (
          <div className="flex flex-wrap items-center gap-2.5">
            {filters}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex-shrink-0">
        {extra}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-50 shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminFilterBar;
