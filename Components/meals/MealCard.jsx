import React from 'react';
import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Calendar, Clock, MapPin, Users, ChefHat, Star, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RatingStars from "../reviews/RatingStars";
import { supabase } from "@/src/lib/supabaseClient";

const cuisineEmojis = {
  italian: "🍝",
  mexican: "🌮",
  indian: "🍛",
  chinese: "🥡",
  japanese: "🍣",
  american: "🍔",
  mediterranean: "🥗",
  thai: "🍜",
  french: "🥐",
  other: "🍽️"
};

const dietaryColors = {
  "vegetarian": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "vegan": "bg-green-50 text-green-700 border-green-200",
  "gluten-free": "bg-amber-50 text-amber-700 border-amber-200",
  "dairy-free": "bg-blue-50 text-blue-700 border-blue-200",
  "nut-free": "bg-orange-50 text-orange-700 border-orange-200"
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

const resolveImageUrl = (rawUrl) => {
  if (!rawUrl) return "";
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
  const parsed = parseStoragePath(rawUrl);
  if (parsed) {
    const targetBucket = parsed.bucket || bucket;
    const { data } = supabase.storage.from(targetBucket).getPublicUrl(parsed.path, {
      transform: { width: 900, quality: 75 },
    });
    return data?.publicUrl || rawUrl;
  }
  return rawUrl; // full external URL
};

function LogoPlaceholder() {
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-amber-400 to-amber-300 flex items-center justify-center shadow-md ring-4 ring-white/70">
      <svg
        width="36"
        height="36"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="30" fill="url(#mcPlate)" />
        <circle cx="32" cy="32" r="18" fill="none" stroke="#fff7ed" strokeWidth="2.2" />
        <g transform="translate(10 12)">
          <path d="M12 30c0 5.5 6 10 14 10s14-4.5 14-10H12Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <path d="M17 28h18" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="23" cy="22" r="2" fill="#fbbf24" />
          <circle cx="31" cy="21" r="2" fill="#f59e0b" />
          <path d="M24 25c.6-.6 1.5-.6 2 0l1 1 1-1c.6-.6 1.5-.6 2 0 .6.6.6 1.5 0 2.1l-2 2c-.6.6-1.5.6-2.1 0l-2-2c-.6-.6-.6-1.5.1-2.1Z" fill="#f43f5e" />
        </g>
        <defs>
          <linearGradient id="mcPlate" x1="12" y1="10" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f97316" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function MealCard({ meal, onRequestMeal, onEdit, onDelete, isOwn = false, averageRating = null, reviewCount = 0 }) {
  const portionsLeft = meal.portions_available - (meal.portions_claimed || 0);
  const isFull = portionsLeft <= 0;
  const [imageError, setImageError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(() => resolveImageUrl(meal.image_url));
  const [retried, setRetried] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    setImageSrc(resolveImageUrl(meal.image_url));
    setImageError(false);
    setImageLoaded(false);
    setRetried(false);
  }, [meal.image_url]);
  
  const handleClick = () => {
    onRequestMeal(meal);
  };
  
  return (
    <Card 
      className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden relative">
          {(!imageSrc || imageError || !imageLoaded) && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center">
              <LogoPlaceholder />
            </div>
          )}
          {imageSrc && !imageError && (
            <img 
              src={imageSrc} 
              alt={meal.title}
              className={`w-full h-full object-cover object-center bg-white transition-transform duration-700 ${imageLoaded ? 'group-hover:scale-105 opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={async () => {
                if (retried) {
                  setImageError(true);
                  return;
                }
                setRetried(true);
                setImageLoaded(false);
                try {
                const parsed = parseStoragePath(imageSrc);
                if (parsed) {
                  const bucket = parsed.bucket || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
                  const path = parsed.path;
                  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
                  if (!error && data?.signedUrl) {
                    setImageSrc(data.signedUrl);
                    return;
                  }
                }
                setImageError(true);
              } catch {
                setImageError(true);
              }
            }}
            />
          )}
        </div>
        
        {/* Status overlay */}
        {isFull && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-semibold text-lg">All Claimed</span>
          </div>
        )}
        
        {/* Cuisine badge */}
        {meal.cuisine_type && (
          <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-700 border-0 shadow-sm px-3 py-1">
            {cuisineEmojis[meal.cuisine_type]} {meal.cuisine_type.charAt(0).toUpperCase() + meal.cuisine_type.slice(1)}
          </Badge>
        )}
        
        {/* Portions indicator */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Users className="w-4 h-4" />
            <span>{portionsLeft} left</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Title and cook */}
          <div>
            <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1 line-clamp-1">
              {meal.title}
            </h3>
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                <Link 
                  to={createPageUrl("CookProfile") + `?email=${encodeURIComponent(meal.created_by)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-orange-600 hover:underline transition-colors"
                >
                  {meal.cook_name || "Home Cook"}
                </Link>
              </div>
              {averageRating && reviewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-slate-700">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-slate-400">({reviewCount})</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          {meal.description && (
            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
              {meal.description}
            </p>
          )}
          
          {/* Dietary badges */}
          {meal.dietary_info && meal.dietary_info.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meal.dietary_info.map((diet, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className={`text-xs font-normal ${dietaryColors[diet.toLowerCase()] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                >
                  {diet}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(meal.date), "MMM d")}</span>
            </div>
            {meal.time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{meal.time}</span>
              </div>
            )}
            {meal.location && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{meal.location}</span>
              </div>
            )}
          </div>
          
          {isOwn && (
            <div className="pt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Your Meal
              </Badge>
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-slate-600 hover:text-slate-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(meal);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meal);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
