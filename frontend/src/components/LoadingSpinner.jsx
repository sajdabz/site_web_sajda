import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses} border-primary-500 border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{message}</p>}
    </div>
  );
}
