import React from 'react';

export function ModernLogoMark({ size = 44 }) {
  const uniqueId = `logo-mark-${size}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg logo-stable"
    >
      <defs>
        <linearGradient id={`primaryGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="30%" stopColor="#f7931e" />
          <stop offset="70%" stopColor="#ff4757" />
          <stop offset="100%" stopColor="#c44569" />
        </linearGradient>
        <linearGradient id={`accentGrad-${uniqueId}`} x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#ffeaa7" />
          <stop offset="100%" stopColor="#fab1a0" />
        </linearGradient>
        <radialGradient id={`plateGrad-${uniqueId}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8f9fa" />
          <stop offset="100%" stopColor="#e9ecef" />
        </radialGradient>
        <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow ring */}
      <circle 
        cx="40" 
        cy="40" 
        r="38" 
        fill="none"
        stroke={`url(#primaryGrad-${uniqueId})`}
        strokeWidth="0.5"
        opacity="0.3"
      />
      
      {/* Main background with sophisticated gradient */}
      <circle 
        cx="40" 
        cy="40" 
        r="35" 
        fill={`url(#primaryGrad-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
      />
      
      {/* Inner plate with depth */}
      <circle 
        cx="40" 
        cy="40" 
        r="26" 
        fill={`url(#plateGrad-${uniqueId})`}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1"
      />
      
      {/* Plate rim detail */}
      <circle 
        cx="40" 
        cy="40" 
        r="24" 
        fill="none"
        stroke={`url(#accentGrad-${uniqueId})`}
        strokeWidth="0.8"
        opacity="0.6"
      />
      
      {/* Artistic food elements */}
      <g transform="translate(40, 40)">
        {/* Realistic fork */}
        <g transform="translate(-12, 0)">
          {/* Fork handle */}
          <rect x="-1.2" y="3" width="2.4" height="12" rx="1.2" fill={`url(#primaryGrad-${uniqueId})`} />
          {/* Fork prongs */}
          <rect x="-3" y="-10" width="1.2" height="13" rx="0.6" fill={`url(#primaryGrad-${uniqueId})`} />
          <rect x="-0.6" y="-10" width="1.2" height="13" rx="0.6" fill={`url(#primaryGrad-${uniqueId})`} />
          <rect x="1.8" y="-10" width="1.2" height="13" rx="0.6" fill={`url(#primaryGrad-${uniqueId})`} />
          {/* Fork base */}
          <rect x="-3.5" y="2" width="7" height="2.5" rx="1.25" fill={`url(#primaryGrad-${uniqueId})`} />
        </g>
        
        {/* Realistic spoon */}
        <g transform="translate(12, 0)">
          {/* Spoon handle */}
          <rect x="-1.2" y="3" width="2.4" height="12" rx="1.2" fill={`url(#primaryGrad-${uniqueId})`} />
          {/* Spoon bowl */}
          <ellipse cx="0" cy="-5" rx="4" ry="6" fill={`url(#accentGrad-${uniqueId})`} stroke={`url(#primaryGrad-${uniqueId})`} strokeWidth="1.5" />
          {/* Spoon neck */}
          <rect x="-1.5" y="1" width="3" height="3" rx="1.5" fill={`url(#primaryGrad-${uniqueId})`} />
        </g>
        
        {/* Central sharing heart */}
        <path
          d="M-3 -1 C-3 -3.5 -1 -3.5 0 -2 C1 -3.5 3 -3.5 3 -1 C3 1.5 0 4 0 4 C0 4 -3 1.5 -3 -1 Z"
          fill="#ff6b35"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.95"
        />
      </g>
      
      {/* Artistic highlight strokes */}
      <path
        d="M15 25 Q25 15 40 20"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M55 30 Q65 25 70 35"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export function ModernLogo({ size = "default", showBeta = true }) {
  const logoSize = size === "small" ? 36 : size === "large" ? 64 : 48;
  const textSize = size === "small" ? "text-lg" : size === "large" ? "text-2xl" : "text-xl";
  const taglineSize = size === "small" ? "text-[9px]" : size === "large" ? "text-xs" : "text-[10px]";
  
  return (
    <div className="flex items-center gap-3.5 select-none">
      <div className="relative flex-shrink-0">
        <ModernLogoMark size={logoSize} />
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={`font-black ${textSize} bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight whitespace-nowrap`}>
            SharePlate
          </span>
          {showBeta && (
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg shadow-orange-500/25 border border-white/20 flex-shrink-0">
              BETA
            </span>
          )}
        </div>
        <span className={`${taglineSize} tracking-[0.12em] uppercase bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent font-bold opacity-90 whitespace-nowrap`}>
          Cook · Share · Connect
        </span>
      </div>
    </div>
  );
}

export default ModernLogo;