import React from 'react';
import { Card, CardContent } from "@/Components/ui/card";
import { User } from 'lucide-react';
import { format } from "date-fns";
import RatingStars from "./RatingStars";

export default function ReviewCard({ review }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-slate-900">{review.reviewer_name}</p>
                <RatingStars rating={review.rating} size="sm" showNumber={false} />
              </div>
              <span className="text-xs text-slate-500">
                {format(new Date(review.created_date), "MMM d, yyyy")}
              </span>
            </div>
            
            {review.meal_title && (
              <p className="text-sm text-slate-500 mb-2">
                Reviewed: <span className="font-medium text-slate-700">{review.meal_title}</span>
              </p>
            )}
            
            {review.review_text && (
              <p className="text-slate-700 leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}