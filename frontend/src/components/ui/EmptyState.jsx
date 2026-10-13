import React from 'react';
import { Inbox, SearchX } from 'lucide-react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  isSearch = false,
  className = '',
}) => {
  const FallbackIcon = isSearch ? SearchX : Inbox;
  const ActiveIcon = Icon || FallbackIcon;
  const defaultTitle = isSearch ? 'No matching results found' : 'No records found';
  const defaultDesc = isSearch
    ? 'Try adjusting your search criteria or clearing filters.'
    : 'No entries have been created yet.';

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3.5 text-gray-400">
        <ActiveIcon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">
        {title || defaultTitle}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
        {description || defaultDesc}
      </p>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export const AdminEmptyState = EmptyState;
export default EmptyState;
