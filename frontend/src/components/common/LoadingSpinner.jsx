import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingSpinner component with judicial theme styling.
 * 
 * @param {'sm' | 'md' | 'lg'} size - Spinner size
 * @param {string} message - Optional message displayed under spinner
 * @param {string} className - Optional container styling overrides
 */
const LoadingSpinner = React.memo(({ size = 'md', message, className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={`${spinnerSize} text-amber-500 animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="mt-3 text-sm font-medium text-slate-500 text-center tracking-wide">
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
