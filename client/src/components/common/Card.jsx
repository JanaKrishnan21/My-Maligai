import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'bg-white rounded-xl border border-slate-200/80 shadow-soft overflow-hidden',
          hover && 'card-hover cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={twMerge('px-5 py-4 border-b border-slate-100 flex items-center justify-between', className)}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={twMerge('p-5', className)}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={twMerge('px-5 py-3.5 bg-slate-50/60 border-t border-slate-100', className)}>
    {children}
  </div>
);
