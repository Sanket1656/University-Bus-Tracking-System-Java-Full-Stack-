import React from 'react';

export const AdminSectionCard = ({
  title,
  subtitle,
  action,
  badge,
  children,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = '',
  footer,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2 ${headerClassName}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 text-xs text-gray-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AdminSectionCard;
