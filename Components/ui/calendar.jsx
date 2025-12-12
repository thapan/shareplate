import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function Calendar({ selected, onSelect, minDate, className = "" }) {
  const value = selected ? format(new Date(selected), "yyyy-MM-dd") : '';
  const min = minDate ? format(new Date(minDate), "yyyy-MM-dd") : undefined;

  return (
    <input
      type="date"
      value={value}
      min={min}
      onChange={(e) => onSelect?.(e.target.value ? new Date(e.target.value) : null)}
      className={clsx(
        "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 appearance-none",
        className
      )}
      style={{ backgroundImage: 'none' }}
    />
  );
}
