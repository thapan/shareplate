import React, { createContext, useContext, useState } from 'react';
import clsx from 'clsx';

const TabsContext = createContext(null);

export function Tabs({ value, defaultValue, onValueChange, children, className = '' }) {
  const [internal, setInternal] = useState(defaultValue || value);
  const current = value !== undefined ? value : internal;
  const setValue = (val) => {
    setInternal(val);
    onValueChange?.(val);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, className = '', children }) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={clsx(
        'px-3 py-2 text-sm rounded-lg transition-colors',
        active ? 'bg-white shadow text-slate-900' : 'text-slate-600',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}
