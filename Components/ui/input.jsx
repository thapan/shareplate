import React from 'react';
import clsx from 'clsx';

export const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300',
        className
      )}
      {...props}
    />
  );
});
