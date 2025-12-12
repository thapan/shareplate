import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const SelectContext = createContext(null);

export function Select({ value, defaultValue = '', onValueChange, children }) {
  const state = useState(value ?? defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <SelectContext.Provider value={{ state, onValueChange, open, setOpen }}>
      <div className="relative" ref={containerRef}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children, ...props }) {
  const ctx = useContext(SelectContext);
  const toggle = () => ctx?.setOpen((o) => !o);
  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        'w-full h-12 px-3 py-2 border border-slate-200 rounded-lg flex items-center justify-between text-sm bg-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { state } = useContext(SelectContext);
  const [value] = state;
  return <span className="text-left">{value || placeholder}</span>;
}

export function SelectContent({ className = '', children }) {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div
      className={clsx(
        'absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto',
        className
      )}
      role="listbox"
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }) {
  const { state, onValueChange, setOpen } = useContext(SelectContext);
  const [, setValue] = state;
  const handle = () => {
    setValue(value);
    onValueChange?.(value);
    setOpen(false);
  };
  return (
    <div
      className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
      onClick={handle}
      role="option"
      aria-selected={false}
    >
      {children}
    </div>
  );
}
