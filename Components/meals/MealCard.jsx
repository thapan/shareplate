import React from 'react';
import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Calendar, Clock, MapPin, Users, ChefHat, Star } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RatingStars from "../reviews/RatingStars";

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

export default function MealCard({ meal, onRequestMeal, isOwn = false, averageRating = null, reviewCount = 0 }) {
  const portionsLeft = meal.portions_available - (meal.portions_claimed || 0);
  const isFull = portionsLeft <= 0;
  
  const handleClick = () => {
    onRequestMeal(meal);
  };
  
  return (
    <Card 
      className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        {meal.image_url ? (
          <div className="aspect-[4/3] overflow-hidden">
            <img 
              src={meal.image_url} 
              alt={meal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center">
            <span className="text-6xl">{cuisineEmojis[meal.cuisine_type] || "🍽️"}</span>
          </div>
        )}
        
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
            <div className="pt-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Your Meal
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
