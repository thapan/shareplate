import React from 'react';
import clsx from 'clsx';

export const Button = React.forwardRef(function Button(
  { className = '', variant = 'default', size = 'md', asChild = false, ...props },
  ref
) {
  const Comp = asChild ? 'span' : 'button';
  const base =
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    ghost: 'bg-transparent hover:bg-slate-100',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  };
  const sizes = {
    md: 'h-10 px-4 py-2 rounded-lg text-sm',
    lg: 'h-12 px-5 rounded-xl text-base',
    icon: 'h-10 w-10 rounded-lg',
  };
  return (
    <Comp
      ref={ref}
      className={clsx(base, variants[variant] || variants.default, sizes[size] || sizes.md, className)}
      {...props}
    />
  );
});
