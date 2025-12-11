import React, { createContext, useContext, useState } from 'react';
import clsx from 'clsx';

const MenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const state = useState(false);
  return <MenuContext.Provider value={state}>{children}</MenuContext.Provider>;
}

export function DropdownMenuTrigger({ asChild = false, children, ...props }) {
  const [, setOpen] = useContext(MenuContext);
  const Comp = asChild ? React.Fragment : 'button';
  const trigger = (
    <button type="button" onClick={() => setOpen((o) => !o)} {...props}>
      {children}
    </button>
  );
  return asChild ? React.cloneElement(children, { onClick: () => setOpen((o) => !o) }) : trigger;
}

export function DropdownMenuContent({ className = '', align = 'start', children, ...props }) {
  const [open] = useContext(MenuContext);
  if (!open) return null;
  return (
    <div
      className={clsx(
        'mt-2 min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg p-1',
        className,
        align === 'end' && 'ml-auto'
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className = '', children, ...props }) {
  return (
    <div
      className={clsx(
        'px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-100" />;
}
