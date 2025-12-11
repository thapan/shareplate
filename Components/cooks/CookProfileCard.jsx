import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ChefHat, Star } from 'lucide-react';
import RatingStars from "../reviews/RatingStars";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CookProfileCard({ cook, mealCount, averageRating, reviewCount }) {
  return (
    <Link to={createPageUrl("CookProfile") + `?email=${encodeURIComponent(cook.email)}`}>
      <Card className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              {cook.profile_picture ? (
                <img 
                  src={cook.profile_picture} 
                  alt={cook.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-orange-500" />
                </div>
              )}
            {averageRating > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-md flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {cook.full_name}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                <span>{mealCount} meal{mealCount !== 1 ? 's' : ''} shared</span>
                {reviewCount > 0 && (
                  <span>• {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                )}
              </div>

              {cook.bio && (
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {cook.bio}
                </p>
              )}

              {!cook.bio && (
                <p className="text-sm text-slate-400 italic">
                  No bio yet
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
