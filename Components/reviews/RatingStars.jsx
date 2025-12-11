import React from 'react';
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function RatingStars({ rating, size = "sm", showNumber = true, count = null }) {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizes[size],
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            )}
          />
        ))}
      </div>
      {showNumber && (
        <span className={cn("font-medium text-slate-700", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== null && (
        <span className={cn("text-slate-500", textSizes[size])}>
          ({count})
        </span>
      )}
    </div>
  );
}