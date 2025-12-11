import React from 'react';
import clsx from 'clsx';

export function Card({ className = '', ...props }) {
  return <div className={clsx('bg-white border border-slate-200 rounded-xl', className)} {...props} />;
}

export function CardHeader({ className = '', ...props }) {
  return <div className={clsx('p-4 border-b border-slate-100', className)} {...props} />;
}

export function CardTitle({ className = '', ...props }) {
  return <h3 className={clsx('text-lg font-semibold text-slate-900', className)} {...props} />;
}

export function CardContent({ className = '', ...props }) {
  return <div className={clsx('p-4', className)} {...props} />;
}
