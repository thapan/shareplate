import React from 'react';
import clsx from 'clsx';

export function Badge({ className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-200 text-slate-700',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
