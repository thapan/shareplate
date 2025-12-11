import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ReviewForm({ meal, onSubmit, onCancel, isSubmitting }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, review_text: reviewText });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal info */}
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500 mb-1">Rate your experience with</p>
        <p className="font-semibold text-slate-900">{meal.title}</p>
        <p className="text-sm text-slate-600">by {meal.cook_name}</p>
      </div>

      {/* Star rating */}
      <div className="space-y-3">
        <Label>Your rating *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={cn(
                  "w-10 h-10 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-slate-600">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <Label>Your review (optional)</Label>
        <Textarea
          placeholder="Tell others about your experience with this meal..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="min-h-[120px] rounded-xl border-slate-200 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 rounded-xl"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}