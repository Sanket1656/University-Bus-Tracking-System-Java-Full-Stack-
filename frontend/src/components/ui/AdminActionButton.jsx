import React from 'react';
import { Eye, Pencil, Trash2, RefreshCw, MoreVertical, Power, CheckCircle2 } from 'lucide-react';

export const AdminActionButton = ({
  action = 'view',
  onClick,
  title,
  disabled = false,
  icon: CustomIcon,
  className = '',
  size = 'md',
}) => {
  const configs = {
    view: {
      icon: Eye,
      defaultTitle: 'View details',
      style: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
    },
    edit: {
      icon: Pencil,
      defaultTitle: 'Edit record',
      style: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    },
    delete: {
      icon: Trash2,
      defaultTitle: 'Delete record',
      style: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
    },
    deactivate: {
      icon: Power,
      defaultTitle: 'Deactivate record',
      style: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50',
    },
    activate: {
      icon: CheckCircle2,
      defaultTitle: 'Reactivate record',
      style: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
    },
    refresh: {
      icon: RefreshCw,
      defaultTitle: 'Refresh',
      style: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
    },
    more: {
      icon: MoreVertical,
      defaultTitle: 'More options',
      style: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
    },
  };

  const cfg = configs[action] || configs.view;
  const Icon = CustomIcon || cfg.icon;

  const sizeClasses =
    size === 'sm' ? 'p-1 rounded-md' : 'p-1.5 rounded-lg';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || cfg.defaultTitle}
      className={`inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none ${sizeClasses} ${cfg.style} ${className}`}
    >
      <Icon className={iconSize} />
    </button>
  );
};

export default AdminActionButton;
