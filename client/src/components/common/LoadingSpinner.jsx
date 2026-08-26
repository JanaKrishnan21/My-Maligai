import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-emerald-600 border-t-transparent ${sizeClasses[size] || sizeClasses.md}`}
      />
      {text && <p className="text-xs sm:text-sm font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="h-10 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-12 bg-slate-100/70 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
