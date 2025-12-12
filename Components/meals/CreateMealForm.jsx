import React, { useState, useEffect } from 'react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Calendar } from "@/Components/ui/calendar";
import { Badge } from "@/Components/ui/badge";
import { Calendar as CalendarIcon, Upload, X, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/src/lib/supabaseClient";
import { sanitizeAndValidateImage } from "@/lib/fileValidation";

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

export default function CreateMealForm({ onSubmit, onCancel, isSubmitting, initialData = null }) {
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
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [lastPreviewUrl, setLastPreviewUrl] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        image_url: initialData.image_url || "",
        date: initialData.date ? new Date(initialData.date) : new Date(),
        time: initialData.time || "",
        portions_available: initialData.portions_available || 2,
        cuisine_type: initialData.cuisine_type || "",
        dietary_info: initialData.dietary_info || [],
        location: initialData.location || "",
      });
      setImageSrc(resolveImageUrl(initialData.image_url || ""));
      setImageError(false);
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [lastPreviewUrl, previewUrl]);

  const compressImage = (file, maxSize = 1400, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return reject(new Error("Compression failed"));
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const compressedFile = new File([blob], `compressed-${Date.now()}.${ext}`, {
              type: 'image/jpeg',
            });
            const preview = URL.createObjectURL(blob);
            resolve({ file: compressedFile, previewUrl: preview });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
      img.src = objectUrl;
    });
  };

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
    
    setUploadError("");
    setIsUploading(true);
    
    try {
      // Validate file security first
      const validation = await sanitizeAndValidateImage(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      if (lastPreviewUrl) {
        URL.revokeObjectURL(lastPreviewUrl);
        setLastPreviewUrl("");
      }
      
      const { file: compressedFile, previewUrl: localPreview } = await compressImage(file);
      setPreviewUrl(localPreview);
      setLastPreviewUrl(localPreview);
      setImageFile(compressedFile);
      setImageSrc(localPreview);
      setImageError(false);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError(err.message || "Could not process the image. Please try another file.");
      setPreviewUrl("");
      setImageFile(null);
      setImageSrc("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      image_file: imageFile,
      date: format(formData.date, "yyyy-MM-dd"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Community sharing only—no payments or delivery.{" "}
        <a href="/policies#disclaimer" className="underline font-semibold">See full policies</a>.
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">Photo (optional)</Label>
        <p className="text-xs text-slate-500">Bright, clear dish photos only. Avoid people/packaging.</p>
        {imageSrc || previewUrl || formData.image_url ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
            <img 
              src={imageSrc || previewUrl || formData.image_url} 
              alt="Meal preview" 
              className="w-full h-full object-cover object-center bg-white"
              onError={async () => {
                if (imageError) return;
                setImageError(true);
                try {
                  const parsed = parseStoragePath(imageSrc || formData.image_url || "");
                  if (parsed) {
                    const bucket = parsed.bucket || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
                    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parsed.path, 3600);
                    if (!error && data?.signedUrl) {
                      setImageSrc(data.signedUrl);
                      setImageError(false);
                      return;
                    }
                  }
                } catch {
                  /* ignore */
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white shadow"
              onClick={() => {
                handleChange("image_url", "");
                setPreviewUrl("");
                setImageFile(null);
                setImageSrc("");
                setImageError(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-44 border border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">
              {isUploading ? "Processing..." : "Upload a dish photo"}
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
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>

      {/* Core info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold text-slate-900">What are you making? *</Label>
          <Input
            id="title"
            placeholder="e.g., Sunshine Veggie Paella"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            className="h-12 rounded-xl border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="font-semibold text-slate-900">Pickup location / area</Label>
          <Input
            id="location"
            placeholder="e.g., Downtown, West Side..."
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="h-12 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="font-semibold text-slate-900">Tell us about the dish</Label>
          <Textarea
            id="description"
            placeholder="Ingredients, cooking style, what makes it special..."
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[120px] rounded-xl border-slate-200 resize-none"
          />
        </div>
        <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
          <div className="space-y-2">
            <Label className="font-semibold text-slate-900">When will it be ready? *</Label>
            <div className="relative">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Calendar
                selected={formData.date}
                onSelect={(date) => {
                  handleChange("date", date || new Date());
                }}
                minDate={new Date()}
                className="h-12 rounded-xl border-slate-200 pl-10 font-semibold text-slate-800 bg-white shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-slate-900">Time</Label>
            <div className="relative">
              <Clock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="time"
                value={formData.time || ""}
                onChange={(e) => handleChange("time", e.target.value)}
                className="h-12 rounded-xl border-slate-200 pl-10 font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Portions, cuisine, dietary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="portions" className="font-semibold text-slate-900">Portions to share *</Label>
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
          <Label className="font-semibold text-slate-900">Cuisine type</Label>
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

        <div className="space-y-2">
          <Label className="font-semibold text-slate-900">Dietary info</Label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((diet) => (
              <Badge
                key={diet}
                variant={formData.dietary_info.includes(diet) ? "default" : "outline"}
                className={`cursor-pointer ${formData.dietary_info.includes(diet) ? "bg-slate-900 text-white" : "border-slate-200 text-slate-700"}`}
                onClick={() => toggleDietary(diet)}
              >
                {diet}
              </Badge>
            ))}
          </div>
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
          {isSubmitting ? "Saving..." : initialData ? "Update Meal" : "Share Meal"}
        </Button>
      </div>
    </form>
  );
}
