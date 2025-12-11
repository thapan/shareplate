import React from 'react';

export function Calendar({ selected, onSelect, disabled }) {
  const value = selected ? new Date(selected).toISOString().split('T')[0] : '';
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onSelect?.(e.target.value ? new Date(e.target.value) : null)}
      disabled={typeof disabled === 'function' ? disabled(new Date(value)) : disabled}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
    />
  );
}
