import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Calendar, Clock, MapPin, ChefHat, Minus, Plus } from "lucide-react";
import { format } from "date-fns";

export default function MealRequestModal({ meal, open, onClose, onSubmit, isSubmitting }) {
  const [portions, setPortions] = useState(1);
  const [message, setMessage] = useState("");
  
  const portionsLeft = meal ? (meal.portions_available - (meal.portions_claimed || 0)) : 0;
  
  const handleSubmit = () => {
    onSubmit({ portions, message });
  };
  
  if (!meal) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        {/* Header with image */}
        <div className="relative">
          {meal.image_url ? (
            <div className="h-40 overflow-hidden">
              <img 
                src={meal.image_url} 
                alt={meal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100" />
          )}
          
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <h3 className="font-semibold text-xl">{meal.title}</h3>
            <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
              <ChefHat className="w-3.5 h-3.5" />
              <span>by {meal.cook_name || "Home Cook"}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Meal details */}
          <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(meal.date), "MMMM d")}</span>
            </div>
            {meal.time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{meal.time}</span>
              </div>
            )}
            {meal.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{meal.location}</span>
              </div>
            )}
          </div>
          
          {/* Portions selector */}
          <div className="space-y-2">
            <Label className="text-slate-700">How many portions?</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => setPortions(Math.max(1, portions - 1))}
                  disabled={portions <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-lg">{portions}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => setPortions(Math.min(portionsLeft, portions + 1))}
                  disabled={portions >= portionsLeft}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-slate-500">{portionsLeft} available</span>
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label className="text-slate-700">Message to cook (optional)</Label>
            <Textarea
              placeholder="Say hi, mention any preferences or pickup details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400 resize-none"
            />
          </div>

          <div className="bg-amber-50/80 border border-amber-100 text-amber-800 text-xs rounded-lg px-3 py-2">
            Community sharing only—no payments or delivery. <a href="/policies#disclaimer" className="underline font-semibold">See full policies</a>.
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
