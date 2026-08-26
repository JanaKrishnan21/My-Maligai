import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const badgeVariants = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/60',
  info: 'bg-sky-50 text-sky-700 border-sky-200/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  outline: 'bg-transparent text-slate-600 border-slate-300',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-3 py-1 text-sm font-medium',
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'danger' && 'bg-rose-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'info' && 'bg-sky-500',
            variant === 'purple' && 'bg-purple-500',
            variant === 'neutral' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
};
