import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Calendar, Clock, MapPin, ChefHat, Users, Star } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../../mockApi';
import RatingStars from "../reviews/RatingStars";
import ReviewCard from "../reviews/ReviewCard";
import { Badge } from "@/Components/ui/badge";

const dietaryColors = {
  "vegetarian": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "vegan": "bg-green-50 text-green-700 border-green-200",
  "gluten-free": "bg-amber-50 text-amber-700 border-amber-200",
  "dairy-free": "bg-blue-50 text-blue-700 border-blue-200",
  "nut-free": "bg-orange-50 text-orange-700 border-orange-200"
};

export default function MealDetailsModal({ meal, open, onClose, onRequestMeal }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['meal-reviews', meal?.id],
    queryFn: () => mockApi.entities.Review.filter({ meal_id: meal?.id }, '-created_date'),
    enabled: !!meal?.id && open,
  });

  if (!meal) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const portionsLeft = meal.portions_available - (meal.portions_claimed || 0);
  const isFull = portionsLeft <= 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with image */}
        <div className="relative">
          {meal.image_url ? (
            <div className="h-56 overflow-hidden">
              <img 
                src={meal.image_url} 
                alt={meal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-56 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100" />
          )}
          
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h2 className="font-bold text-2xl mb-2">{meal.title}</h2>
            <div className="flex items-center gap-2 text-white/90">
              <ChefHat className="w-4 h-4" />
              <span>by {meal.cook_name || "Home Cook"}</span>
            </div>
          </div>

          {/* Rating badge */}
          {reviews.length > 0 && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg">
              <RatingStars rating={averageRating} size="sm" count={reviews.length} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-5">
              {/* Description */}
              {meal.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">About this meal</h3>
                  <p className="text-slate-600 leading-relaxed">{meal.description}</p>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-lg px-3 py-2">
                Community sharing only—no payments or delivery. Hosts and guests coordinate pickup directly; participation is at your discretion and we are not responsible for food safety.
              </div>

              {/* Dietary info */}
              {meal.dietary_info && meal.dietary_info.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dietary information</h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.dietary_info.map((diet, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className={dietaryColors[diet.toLowerCase()] || "bg-slate-50 text-slate-600 border-slate-200"}
                      >
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(meal.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {meal.time && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="font-medium text-slate-900">{meal.time}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Portions</p>
                    <p className="font-medium text-slate-900">
                      {portionsLeft} of {meal.portions_available} available
                    </p>
                  </div>
                </div>

                {meal.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="font-medium text-slate-900">{meal.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action button */}
              {!isFull && (
                <Button
                  onClick={() => {
                    onClose();
                    onRequestMeal(meal);
                  }}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Request a Portion
                </Button>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Average rating */}
                  <div className="bg-slate-50 rounded-xl p-5 text-center">
                    <div className="text-4xl font-bold text-slate-900 mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <RatingStars rating={averageRating} size="md" showNumber={false} />
                    <p className="text-sm text-slate-500 mt-2">
                      Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Reviews list */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No reviews yet</p>
                  <p className="text-sm text-slate-500">Be the first to review this meal!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
