import React from 'react';
import clsx from 'clsx';

export function Dialog({ open, onOpenChange, children }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange?.(false)} />}
      {children}
    </>
  );
}

export function DialogContent({ open = true, className = '', children, ...props }) {
  if (!open) return null;
  return (
    <div
      className={clsx(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-[90vw] max-w-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className = '', ...props }) {
  return <div className={clsx('mb-4', className)} {...props} />;
}

export function DialogTitle({ className = '', ...props }) {
  return <h2 className={clsx('text-xl font-semibold text-slate-900', className)} {...props} />;
}

export function DialogDescription({ className = '', ...props }) {
  return <p className={clsx('text-sm text-slate-600', className)} {...props} />;
}
