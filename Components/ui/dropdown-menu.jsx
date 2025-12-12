import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const MenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click or Esc
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
    <MenuContext.Provider value={{ open, setOpen, containerRef }}>
      <div ref={containerRef} className="relative inline-flex text-left">
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children, ...props }) {
  const { setOpen } = useContext(MenuContext);

  const handleClick = (e) => {
    if (children?.props?.onClick) children.props.onClick(e);
    setOpen((o) => !o);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'aria-haspopup': 'menu',
      'aria-expanded': undefined,
      ...props,
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ className = '', align = 'start', children, ...props }) {
  const { open } = useContext(MenuContext);
  if (!open) return null;
  return (
    <div
      className={clsx(
        'absolute z-50 mt-2 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl p-1',
        className,
        align === 'end' ? 'right-0' : 'left-0',
        'top-full'
      )}
      role="menu"
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
