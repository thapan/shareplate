import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext();

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export function AccessibilityProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const [focusVisible, setFocusVisible] = useState(false);

  // Detect if user is navigating with keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply focus-visible class to body
  useEffect(() => {
    if (focusVisible) {
      document.body.classList.add('focus-visible');
    } else {
      document.body.classList.remove('focus-visible');
    }
  }, [focusVisible]);

  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ announce, focusVisible }}>
      {children}
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    </AccessibilityContext.Provider>
  );
}

// Skip link component
export function SkipLink({ href = "#main-content", children = "Skip to main content" }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-slate-900 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
    >
      {children}
    </a>
  );
}