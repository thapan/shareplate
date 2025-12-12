import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

const LogoPlaceholder = ({ size = 64 }) => (
  <div className={`w-${size/4} h-${size/4} rounded-full bg-gradient-to-br from-orange-500 via-amber-400 to-amber-300 flex items-center justify-center shadow-md ring-4 ring-white/70`}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="30" fill="url(#fallbackPlate)" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#fff7ed" strokeWidth="2.2" />
      <g transform="translate(10 12)">
        <path d="M12 30c0 5.5 6 10 14 10s14-4.5 14-10H12Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
        <path d="M17 28h18" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="23" cy="22" r="2" fill="#fbbf24" />
        <circle cx="31" cy="21" r="2" fill="#f59e0b" />
        <path d="M24 25c.6-.6 1.5-.6 2 0l1 1 1-1c.6-.6 1.5-.6 2 0 .6.6.6 1.5 0 2.1l-2 2c-.6.6-1.5.6-2.1 0l-2-2c-.6-.6-.6-1.5.1-2.1Z" fill="#f43f5e" />
      </g>
      <defs>
        <linearGradient id="fallbackPlate" x1="12" y1="10" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "",
  onLoad,
  onError,
  ...props 
}) {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retried: false
  });

  const handleLoad = () => {
    setImageState({ loading: false, error: false, retried: false });
    onLoad?.();
  };

  const handleError = async () => {
    if (imageState.retried) {
      setImageState(prev => ({ ...prev, error: true, loading: false }));
      onError?.();
      return;
    }

    // Try to get signed URL if it's a storage path
    try {
      const parsed = parseStoragePath(src);
      if (parsed) {
        const bucket = parsed.bucket || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parsed.path, 3600);
        if (!error && data?.signedUrl) {
          setImageState(prev => ({ ...prev, retried: true }));
          // Force re-render with new URL
          const img = new Image();
          img.onload = handleLoad;
          img.onerror = () => setImageState({ loading: false, error: true, retried: true });
          img.src = data.signedUrl;
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to get signed URL:', err);
    }

    setImageState({ loading: false, error: true, retried: true });
    onError?.();
  };

  const parseStoragePath = (rawUrl) => {
    if (!rawUrl) return null;
    const direct = rawUrl.match(/object\/public\/([^/]+)\/([^?]+)(?:\?.*)?$/);
    if (direct) return { bucket: direct[1], path: direct[2] };
    const render = rawUrl.match(/render\/image\/public\/([^/]+)\/([^?]+)(?:\?.*)?$/);
    if (render) return { bucket: render[1], path: render[2] };
    if (!rawUrl.startsWith("http")) {
      return { bucket: null, path: rawUrl.replace(/^\/+/, "") };
    }
    return null;
  };

  if (!src || imageState.error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 ${fallbackClassName}`}>
        <LogoPlaceholder />
      </div>
    );
  }

  return (
    <>
      {imageState.loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 ${fallbackClassName}`}>
          <LogoPlaceholder />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageState.loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
}