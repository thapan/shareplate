import React, { createContext, useContext } from 'react';
import clsx from 'clsx';

const SheetContext = createContext({ open: false, onOpenChange: () => {} });

export function Sheet({ children, open = false, onOpenChange }) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {open && <div className="fixed inset-0 bg-black/30" onClick={() => onOpenChange?.(false)} />}
      {children}
    </SheetContext.Provider>
  );
}

export function SheetContent({ className = '', side = 'right', open, children, ...props }) {
  const ctx = useContext(SheetContext);
  const isOpen = open !== undefined ? open : ctx.open;
  if (!isOpen) return null;
  return (
    <div
      className={clsx(
        'fixed top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl p-6 overflow-y-auto',
        side === 'right' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ className = '', ...props }) {
  return <div className={clsx('mb-4', className)} {...props} />;
}

export function SheetTitle({ className = '', ...props }) {
  return <h2 className={clsx('text-xl font-semibold text-slate-900', className)} {...props} />;
}
