import React from 'react';

export const PageHeader = ({
  title,
  description,
  action,
  breadcrumb,
  badge,
  className = '',
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`}
  >
    <div className="min-w-0">
      {breadcrumb && (
        <nav className="text-xs font-semibold uppercase tracking-wider text-purple-600/90 mb-1 flex items-center gap-1.5">
          <span>{breadcrumb}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 font-normal">{title}</span>
        </nav>
      )}
      <div className="flex items-center gap-2.5 flex-wrap">
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
        {badge}
      </div>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {action && <div className="flex-shrink-0 flex items-center gap-3">{action}</div>}
  </div>
);

export const AdminPageHeader = PageHeader;
export default PageHeader;
