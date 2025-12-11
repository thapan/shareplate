import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Upload, X, Plus } from "lucide-react";
import { format } from "date-fns";

const cuisines = [
  { value: "italian", label: "Italian", emoji: "🍝" },
  { value: "mexican", label: "Mexican", emoji: "🌮" },
  { value: "indian", label: "Indian", emoji: "🍛" },
  { value: "chinese", label: "Chinese", emoji: "🥡" },
  { value: "japanese", label: "Japanese", emoji: "🍣" },
  { value: "american", label: "American", emoji: "🍔" },
  { value: "mediterranean", label: "Mediterranean", emoji: "🥗" },
  { value: "thai", label: "Thai", emoji: "🍜" },
  { value: "french", label: "French", emoji: "🥐" },
  { value: "other", label: "Other", emoji: "🍽️" },
];

const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free"];

export default function CreateMealForm({ onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    date: new Date(),
    time: "",
    portions_available: 2,
    cuisine_type: "",
    dietary_info: [],
    location: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDietary = (diet) => {
    setFormData(prev => ({
      ...prev,
      dietary_info: prev.dietary_info.includes(diet)
        ? prev.dietary_info.filter(d => d !== diet)
        : [...prev.dietary_info, diet]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      handleChange("image_url", objectUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date: format(formData.date, "yyyy-MM-dd"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image upload */}
      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        {formData.image_url ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
            <img 
              src={formData.image_url} 
              alt="Meal preview" 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white"
              onClick={() => handleChange("image_url", "")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">
              {isUploading ? "Uploading..." : "Click to upload a photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">What are you making? *</Label>
        <Input
          id="title"
          placeholder="e.g., Homemade Lasagna, Thai Green Curry..."
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
          className="h-12 rounded-xl border-slate-200"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Tell us about the dish</Label>
        <Textarea
          id="description"
          placeholder="Ingredients, cooking style, what makes it special..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="min-h-[100px] rounded-xl border-slate-200 resize-none"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
        <Label>When will it be ready? *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 justify-start text-left font-normal rounded-xl border-slate-200"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                {format(formData.date, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => date && handleChange("date", date)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            placeholder="e.g., 6:00 PM"
            value={formData.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="h-12 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Portions and Cuisine */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="portions">Portions to share *</Label>
          <Input
            id="portions"
            type="number"
            min={1}
            max={20}
            value={formData.portions_available}
            onChange={(e) => handleChange("portions_available", parseInt(e.target.value) || 1)}
            className="h-12 rounded-xl border-slate-200"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Cuisine type</Label>
          <Select 
            value={formData.cuisine_type} 
            onValueChange={(val) => handleChange("cuisine_type", val)}
          >
            <SelectTrigger className="h-12 rounded-xl border-slate-200">
              <SelectValue placeholder="Select cuisine" />
            </SelectTrigger>
            <SelectContent>
              {cuisines.map((cuisine) => (
                <SelectItem key={cuisine.value} value={cuisine.value}>
                  <span className="flex items-center gap-2">
                    <span>{cuisine.emoji}</span>
                    <span>{cuisine.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Pickup location / area</Label>
        <Input
          id="location"
          placeholder="e.g., Downtown, West Side..."
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="h-12 rounded-xl border-slate-200"
        />
      </div>

      {/* Dietary info */}
      <div className="space-y-2">
        <Label>Dietary info</Label>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((diet) => (
            <Badge
              key={diet}
              variant="outline"
              className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${
                formData.dietary_info.includes(diet)
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => toggleDietary(diet)}
            >
              {diet}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.title}
          className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 rounded-xl"
        >
          {isSubmitting ? "Sharing..." : "Share Meal"}
        </Button>
      </div>
    </form>
  );
}
