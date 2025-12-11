import React from 'react';
import clsx from 'clsx';

export const Button = React.forwardRef(function Button(
  { className = '', variant = 'default', size = 'md', asChild = false, ...props },
  ref
) {
  const Comp = asChild ? 'span' : 'button';
  const base =
    'inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none rounded-full';
  const variants = {
    default:
      'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm hover:shadow-lg hover:from-orange-600 hover:to-amber-600',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    outline: 'border border-slate-200 bg-white hover:bg-amber-50 text-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  };
  const sizes = {
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };
  return (
    <Comp
      ref={ref}
      className={clsx(base, variants[variant] || variants.default, sizes[size] || sizes.md, className)}
      {...props}
    />
  );
});
