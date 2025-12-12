import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/src/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import ReviewForm from "../reviews/ReviewForm";
import RatingStars from "../reviews/RatingStars";
import ReviewCard from "../reviews/ReviewCard";
import { Badge } from "@/Components/ui/badge";
import { toast } from "sonner";

const dietaryColors = {
  "vegetarian": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "vegan": "bg-green-50 text-green-700 border-green-200",
  "gluten-free": "bg-amber-50 text-amber-700 border-amber-200",
  "dairy-free": "bg-blue-50 text-blue-700 border-blue-200",
  "nut-free": "bg-orange-50 text-orange-700 border-orange-200"
};
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

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
      transform: { width: 1100, quality: 75 },
    });
    return data?.publicUrl || rawUrl;
  }
  return rawUrl;
};

export default function MealDetailsModal({ meal, open, onClose, onRequestMeal, currentUserEmail, currentUser }) {
  const [imageSrc, setImageSrc] = useState(() => resolveImageUrl(meal?.image_url || ""));
  const [retried, setRetried] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  useEffect(() => {
    setImageSrc(resolveImageUrl(meal?.image_url || ""));
    setRetried(false);
    setImageError(false);
  }, [meal?.image_url]);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['meal-reviews', meal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('meal_id', meal?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!meal?.id && open,
  });

  if (!meal) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const portionsLeft = meal.portions_available - (meal.portions_claimed || 0);
  const isFull = portionsLeft <= 0;
  const isOwner = currentUserEmail && meal?.created_by === currentUserEmail;
  const hasReviewed = !!currentUserEmail && reviews.some((r) => r.reviewer_email === currentUserEmail);

  const handleSubmitReview = async ({ rating, review_text }) => {
    if (!currentUserEmail) {
      toast.error("Please sign in to leave a review.");
      return;
    }
    if (isOwner) {
      toast.error("You cannot review your own meal.");
      return;
    }
    if (hasReviewed) {
      toast.error("You already left a review for this meal.");
      return;
    }
    setIsReviewSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      rating,
      review_text,
      reviewer_email: currentUser?.email || currentUserEmail,
      reviewer_name: currentUser?.full_name || "Guest",
      meal_id: meal.id,
      meal_title: meal.title,
      cook_email: meal.created_by,
    });
    setIsReviewSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not submit review.");
      return;
    }
    toast.success("Review submitted");
    setShowReviewForm(false);
    await refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-3xl p-0 overflow-hidden shadow-2xl border border-slate-100">
        {/* Header with image */}
        <div className="relative">
          {imageSrc && !imageError ? (
            <div className="h-44 md:h-52 overflow-hidden bg-slate-100">
              <img 
                src={imageSrc} 
                alt={meal.title}
                className="w-full h-full object-cover object-center"
                onError={async () => {
                  if (retried) {
                    setImageError(true);
                    return;
                  }
                  setRetried(true);
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className="h-44 md:h-52 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow">
                <ChefHat className="w-7 h-7 text-orange-500" />
              </div>
              <div className="text-center px-6">
                <h2 className="text-xl font-bold text-slate-800">{meal.title}</h2>
                <p className="text-sm text-slate-600">by {meal.cook_name || "Home Cook"}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 mix-blend-normal pointer-events-none" />
          
          <div className="absolute bottom-4 left-6 right-6 text-white drop-shadow space-y-1">
            <h2 className="font-bold text-2xl md:text-3xl">{meal.title}</h2>
            <div className="flex items-center gap-2 text-white/90 text-sm md:text-base">
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
        <div className="p-5 md:p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">About this meal</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{meal.description || "No description provided."}</p>
                  <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Free sharing only—no payments or delivery.{" "}
                    <a href={createPageUrl("Policies") + "#disclaimer"} className="underline font-semibold">See policies</a>.
                  </div>
                  {meal.dietary_info && meal.dietary_info.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 mb-2">Dietary info</h4>
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
                </div>

                <div className="space-y-2 bg-slate-50 rounded-xl p-4">
                  <InfoRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Date" value={format(new Date(meal.date), "MMM d, yyyy")} />
                  {meal.time && <InfoRow icon={<Clock className="w-4 h-4 text-slate-400" />} label="Time" value={meal.time} />}
                  <InfoRow icon={<Users className="w-4 h-4 text-slate-400" />} label="Portions" value={`${portionsLeft} of ${meal.portions_available} available`} />
                  {meal.location && <InfoRow icon={<MapPin className="w-4 h-4 text-slate-400" />} label="Location" value={meal.location} />}
                </div>
              </div>

              {/* Action button */}
              {!isOwner && !isFull && (
                <Button
                  onClick={() => {
                    onClose();
                    onRequestMeal(meal);
                  }}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Request a Portion
                </Button>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-5 text-center">
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {averageRating.toFixed(1)}
                        </div>
                        <RatingStars rating={averageRating} size="md" showNumber={false} />
                        <p className="text-sm text-slate-500 mt-2">
                          Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">No reviews yet</p>
                      <p className="text-sm text-slate-500">Be the first to review this meal!</p>
                    </div>
                  )}

                  {!isOwner && !hasReviewed && currentUserEmail && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      {showReviewForm ? (
                        <ReviewForm
                          meal={meal}
                          onSubmit={handleSubmitReview}
                          onCancel={() => setShowReviewForm(false)}
                          isSubmitting={isReviewSubmitting}
                        />
                      ) : (
                        <Button
                          className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl"
                          onClick={() => setShowReviewForm(true)}
                        >
                          Leave a Review
                        </Button>
                      )}
                    </div>
                  )}

                  {!currentUserEmail && (
                    <div className="text-sm text-slate-600 text-center">
                      <a href={createPageUrl("Login")} className="text-amber-600 font-semibold hover:underline">
                        Sign in to leave a review
                      </a>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
