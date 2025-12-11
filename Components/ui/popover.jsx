import React, { createContext, useContext, useState } from 'react';

const PopoverContext = createContext(null);

export function Popover({ children }) {
  const state = useState(false);
  return <PopoverContext.Provider value={state}>{children}</PopoverContext.Provider>;
}

export function PopoverTrigger({ asChild = false, children, ...props }) {
  const [, setOpen] = useContext(PopoverContext);
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => setOpen((o) => !o),
      ...props,
    });
  }
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({ children, className = '' }) {
  const [open, setOpen] = useContext(PopoverContext);
  if (!open) return null;
  return (
    <div className={`relative z-20 mt-2 w-auto rounded-lg border border-slate-200 bg-white shadow-lg ${className}`}>
      <div className="absolute -top-3 right-3 text-sm text-slate-500 cursor-pointer" onClick={() => setOpen(false)}>
        ×
      </div>
      {children}
    </div>
  );
}
