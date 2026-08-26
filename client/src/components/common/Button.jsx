import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:bg-emerald-800 focus:ring-emerald-500',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm active:bg-slate-100 focus:ring-slate-400',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:bg-emerald-700 focus:ring-emerald-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:bg-rose-800 focus:ring-rose-500',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:bg-amber-700 focus:ring-amber-400',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-400',
  whatsapp: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:bg-emerald-800 focus:ring-emerald-500',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs sm:text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
  xl: 'px-6 py-3 text-lg font-semibold rounded-xl gap-3',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none btn-press',
          variants[variant],
          sizes[size],
          (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none shadow-none',
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={clsx('flex-shrink-0', size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      ) : null}
      
      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx('flex-shrink-0', size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      )}
    </button>
  );
};
