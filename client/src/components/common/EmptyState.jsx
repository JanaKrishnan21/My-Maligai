import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-emerald-600 mb-4 border border-slate-100">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const ErrorState = ({
  icon: Icon = AlertCircle,
  title = 'Unable to load data',
  description = 'An error occurred while communicating with the database server. Please verify your connection and try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl bg-rose-50/60 border border-rose-200 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-rose-600 mb-4 border border-rose-100">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-600 max-w-sm mb-5">{description}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};
