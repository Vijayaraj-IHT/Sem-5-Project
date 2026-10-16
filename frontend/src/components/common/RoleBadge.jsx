import React from 'react';

const ROLE_CONFIG = {
  senior_staff: {
    label: 'Senior Staff',
    className: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
  staff: {
    label: 'Court Staff',
    className: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
  court_staff: {
    label: 'Court Staff',
    className: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
  junior_staff: {
    label: 'Junior Staff',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500',
  },
  advocate: {
    label: 'Advocate',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  scholar: {
    label: 'Scholar',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  public: {
    label: 'Public',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    dotColor: 'bg-gray-400',
  },
};

/**
 * Badge component displaying user role with judicial color coding.
 *
 * @param {string} role - The user role identifier
 * @param {'sm' | 'md'} size - Badge size
 * @param {boolean} showDot - Whether to show status dot indicator
 * @param {string} className - Additional CSS class names
 */
const RoleBadge = React.memo(({ role, size = 'sm', showDot = false, className = '' }) => {
  const normalizedRole = (role || '').toLowerCase();
  const config = ROLE_CONFIG[normalizedRole] || {
    label: role ? role.replace(/_/g, ' ') : 'Guest',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-xs tracking-wide capitalize ${config.className} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
});

RoleBadge.displayName = 'RoleBadge';

export default RoleBadge;
