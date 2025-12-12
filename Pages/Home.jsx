import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Plus, Search, Utensils, Calendar, Sparkles, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import FeedbackWidget from "@/Components/FeedbackWidget";
import MealCard from "@/Components/meals/MealCard";
import MealRequestModal from "@/Components/meals/MealRequestModal";
import MealDetailsModal from "@/Components/meals/MealDetailsModal";
import CreateMealForm from "@/Components/meals/CreateMealForm";
import LoadingSpinner, { SkeletonCard } from "@/Components/LoadingSpinner";
import { DEMO_USER, getStoredUser, setStoredUser } from '../auth';
import { createPageUrl } from '@/utils';
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/src/lib/supabaseClient";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealForDetails, setSelectedMealForDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all"); // kept for fallback
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending"); // pending | ready | denied | unavailable
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(15);
  const [editingMeal, setEditingMeal] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const queryClient = useQueryClient();
  const toOptimizedUrl = (bucket, path) => {
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path, {
      transform: { width: 900, quality: 75 },
    });
    return publicUrlData?.publicUrl || '';
  };

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("ready");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // Calculate average ratings for meals
  const mealRatings = {};
  allReviews.forEach(review => {
    if (!mealRatings[review.meal_id]) {
      mealRatings[review.meal_id] = { total: 0, count: 0 };
    }
    mealRatings[review.meal_id].total += review.rating;
    mealRatings[review.meal_id].count += 1;
  });

  const createMealMutation = useMutation({
    mutationFn: async ({ user: creator, image_file, ...data }) => {
      if (!creator?.email) throw new Error("Missing user email");
      // Ensure user exists
      const { error: userErr } = await supabase
        .from('users')
        .upsert(
          { email: creator.email, full_name: creator.full_name || 'Home Cook' },
          { onConflict: 'email' }
        );
      if (userErr) throw userErr;

      let imageUrl = data.image_url || "";
      if (image_file) {
        const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
        const fileExt = image_file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, image_file);
        if (uploadError) throw uploadError;
        imageUrl = toOptimizedUrl(bucket, fileName);
      }

      const { error } = await supabase.from('meals').insert({
        ...data,
        cook_name: creator.full_name || "Home Cook",
        created_by: creator.email,
        status: "open",
        portions_claimed: 0,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setShowCreateSheet(false);
      toast.success("Meal shared successfully!");
    },
    onError: (err) => toast.error(err?.message || "Could not share meal. Please try again."),
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, userEmail, image_file, existingImageUrl = "", ...data }) => {
      if (!userEmail) throw new Error("Missing user email");
      let imageUrl = existingImageUrl || "";
      if (image_file) {
        const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
        const fileExt = image_file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, image_file);
        if (uploadError) throw uploadError;
        imageUrl = toOptimizedUrl(bucket, fileName);
      }

      const { error } = await supabase
        .from('meals')
        .update({ ...data, image_url: imageUrl })
        .eq('id', id)
        .eq('created_by', userEmail);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setShowCreateSheet(false);
      setEditingMeal(null);
      toast.success("Meal updated");
    },
    onError: (err) => toast.error(err?.message || "Could not update meal. Please try again."),
  });

  const deleteMealMutation = useMutation({
    mutationFn: async ({ meal, userEmail }) => {
      if (!userEmail) throw new Error("Missing user email");

      // Best-effort delete related requests first
      await supabase.from('meal_requests').delete().eq('meal_id', meal.id);

      // Best-effort remove image from storage if it lives in our bucket
      if (meal.image_url) {
        try {
          const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'meal-images';
          const match = meal.image_url.match(/object\/public\/(.*?)\/(.+)$/);
          if (match) {
            const [, urlBucket, path] = match;
            if (urlBucket === bucket) {
              await supabase.storage.from(bucket).remove([path]);
            }
          }
        } catch {
          // ignore storage cleanup errors
        }
      }

      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal.id)
        .eq('created_by', userEmail);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      toast.success("Meal removed");
    },
    onError: (err) => toast.error(err?.message || "Could not delete meal. Please try again."),
  });

  const createRequestMutation = useMutation({
    mutationFn: async ({ meal, portions, message, user: requester }) => {
      if (!requester?.email) throw new Error("Missing user email");
      const { error: userErr } = await supabase
        .from('users')
        .upsert(
          { email: requester.email, full_name: requester.full_name || 'Food Lover' },
          { onConflict: 'email' }
        );
      if (userErr) throw userErr;

      const { error: reqError } = await supabase.from('meal_requests').insert({
        meal_id: meal.id,
        meal_title: meal.title,
        cook_email: meal.created_by,
        requester_name: requester.full_name || "Food Lover",
        requester_email: requester.email,
        portions_requested: portions,
        message,
        status: "pending",
      });
      if (reqError) throw reqError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setSelectedMeal(null);
      toast.success("Request sent to the cook!");
    },
    onError: () => toast.error("Could not send request. Please try again."),
  });

  const handleRequestSubmit = async ({ portions, message }) => {
    if (!user?.email) {
      toast.error("Please sign in to request a meal.");
      navigate(createPageUrl("Login"));
      return;
    }
    setIsSubmitting(true);
    await createRequestMutation.mutateAsync({ meal: selectedMeal, portions, message, user });
    setIsSubmitting(false);
  };

  const handleCreateOrUpdateMeal = async (data) => {
    if (!user?.email) {
      toast.error("Please sign in to share a meal.");
      navigate(createPageUrl("Login"));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMeal) {
        await updateMealMutation.mutateAsync({
          ...data,
          id: editingMeal.id,
          userEmail: user.email,
          existingImageUrl: editingMeal.image_url,
        });
      } else {
        await createMealMutation.mutateAsync({ ...data, user });
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not share meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMeal = (meal) => {
    if (!user?.email) {
      navigate(createPageUrl("Login"));
      return;
    }
    setEditingMeal(meal);
    setShowCreateSheet(true);
  };

  const handleDeleteMeal = async (meal) => {
    if (!user?.email) {
      navigate(createPageUrl("Login"));
      return;
    }
    const confirmed = window.confirm("Delete this meal? This cannot be undone.");
    if (!confirmed) return;
    await deleteMealMutation.mutateAsync({ meal, userEmail: user.email });
  };

  const handleOpenCreate = () => {
    if (!user?.email) {
      toast.error("Please sign in to share a meal.");
      navigate(createPageUrl("Login"));
      return;
    }
    setShowCreateSheet(true);
  };

  const handleOpenRequest = (meal) => {
    if (!user?.email) {
      toast.error("Please sign in to request a meal.");
      navigate(createPageUrl("Login"));
      return;
    }
    if (meal?.created_by === user.email) {
      toast.error("You can't request your own meal.");
      return;
    }
    setSelectedMeal(meal);
  };

  const toRad = (deg) => (deg * Math.PI) / 180;
  const distanceInMiles = (a, b) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
    return R * c;
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meal.cook_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "all" || (meal.location || "").toLowerCase().includes(selectedCity.toLowerCase());

    const hasCoords = meal.lat != null && meal.lng != null;
    const withinRadius = userLocation && hasCoords
      ? (radiusMiles ? distanceInMiles(userLocation, { lat: meal.lat, lng: meal.lng }) <= radiusMiles : true)
      : true; // include if we can't measure

    if (activeFilter === "all") return matchesSearch && matchesCity && withinRadius;
    if (activeFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      return matchesSearch && matchesCity && withinRadius && meal.date === today;
    }
    if (activeFilter === "week") {
      const today = new Date();
      const weekLater = new Date(today.setDate(today.getDate() + 7));
      return matchesSearch && matchesCity && withinRadius && new Date(meal.date) <= weekLater;
    }
    return matchesSearch && matchesCity && withinRadius;
  });

  const availableCities = Array.from(
    new Set(
      meals
        .map((m) => m.location || "")
        .filter(Boolean)
        .map((loc) => loc.trim())
    )
  );

  const faqs = [
    {
      q: "Is everything free? Do you process payments?",
      a: "Yes. This is free community sharing. We do not process payments, tips, or delivery fees.",
    },
    {
      q: "How do I request a meal?",
      a: "Sign in, open a meal, and send a request. The host will confirm and coordinate with you.",
    },
    {
      q: "How do I share a meal?",
      a: "Create a meal with date, time, portions, and location. Respond to requests from the community.",
    },
    {
      q: "Who’s responsible for food safety?",
      a: "Hosts and guests participate at their own discretion. See our policies for details.",
      link: "/policies#disclaimer",
    },
  ];

  const testimonials = [
    {
      quote: "I met neighbors I’d never talked to before. Sharing samosas on SharePlate felt like a potluck every week.",
      name: "Priya K.",
      role: "Home Cook",
      location: "Herndon, VA",
    },
    {
      quote: "We hosted a pasta night and gave away leftovers. Zero waste, new friends. It’s perfect.",
      name: "Marco D.",
      role: "Host",
      location: "Seattle, WA",
    },
    {
      quote: "Picked up a vegan chili on a busy day—free, friendly, and fast. Love the no-pay, community vibe.",
      name: "Taylor S.",
      role: "Guest",
      location: "Austin, TX",
    },
    {
      quote: "I listed extra portions after meal prep. People were so grateful—it turned into weekly swaps.",
      name: "Jenna L.",
      role: "Meal Prepper",
      location: "San Jose, CA",
    },
    {
      quote: "As a student, I appreciate home-cooked meals without delivery apps. It feels safe and neighborly.",
      name: "Omar R.",
      role: "Student",
      location: "Boston, MA",
    },
    {
      quote: "My grandmother's biryani recipe brought the whole block together. SharePlate made me the neighborhood favorite!",
      name: "Aisha M.",
      role: "Traditional Cook",
      location: "Chicago, IL",
    },
    {
      quote: "Made too much Korean BBQ for date night. Within an hour, three families came by. Best accident ever!",
      name: "David L.",
      role: "Weekend Chef",
      location: "Portland, OR",
    },
    {
      quote: "My kids love trying different cuisines from neighbors. It's like traveling the world from our doorstep.",
      name: "Sarah J.",
      role: "Parent",
      location: "Denver, CO",
    },
    {
      quote: "Shared my famous mac and cheese during finals week. Students lined up! Felt like feeding my own kids.",
      name: "Betty R.",
      role: "Retired Teacher",
      location: "Ann Arbor, MI",
    },
    {
      quote: "Working late? No problem. Picked up fresh tacos from Maria next door. Better than any restaurant!",
      name: "Alex C.",
      role: "Software Engineer",
      location: "San Francisco, CA",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.08),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(249,115,22,0.06),transparent_50%)] pointer-events-none" />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-25 to-orange-100/50 border-b border-orange-100/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.18),transparent_40%),radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.12),transparent_35%)]" />
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-300/40 rounded-full animate-pulse" />
        <div className="absolute top-32 right-20 w-1 h-1 bg-orange-400/60 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-orange-200/50 rounded-full animate-pulse delay-500" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >

            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-3 tracking-tight leading-tight display-font">
              Home cooking,
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"> shared</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6">
              Discover homemade meals from local cooks—or share yours—and connect over real food.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleOpenCreate}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-8 h-14 text-base shadow-lg shadow-orange-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share a Meal
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('meals-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/80 backdrop-blur-sm hover:bg-white rounded-full px-8 h-14 text-base border-slate-200/60 shadow-lg shadow-slate-900/5 transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <Utensils className="w-5 h-5 mr-2" />
                Browse Meals
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Free community sharing only—no payments or delivery. Hosts and guests coordinate directly.
            </p>
          </motion.div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Meals Section */}
      <div id="meals-section" className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search meals, cuisines, or cooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:shadow-md transition-shadow duration-200"
            />
          </div>
          
          <div className="flex flex-1 gap-3">
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="h-12 bg-slate-100/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                <TabsTrigger value="all" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="today" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Today</TabsTrigger>
                <TabsTrigger value="week" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">This Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200 flex items-center gap-2 shadow-sm">
            <MapPin className="w-4 h-4 text-orange-500" />
            {locationStatus === "ready" && userLocation
              ? `Within ${radiusMiles || 'any'} miles of you`
              : locationStatus === "pending"
                ? "Detecting your location..."
                : "Location not available; showing all meals"}
          </Badge>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Distance:
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
            >
              {[5, 10, 15, 25, 50].map((miles) => (
                <option key={miles} value={miles}>{miles} miles</option>
              ))}
              <option value={0}>Any</option>
            </select>
          </label>
          {locationStatus !== "ready" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLocationStatus("pending");
                if (!("geolocation" in navigator)) {
                  setLocationStatus("unavailable");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationStatus("ready");
                  },
                  () => setLocationStatus("denied"),
                  { enableHighAccuracy: false, timeout: 8000 }
                );
              }}
            >
              Retry location
            </Button>
          )}
        </div>

        {/* Meals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredMeals.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredMeals.map((meal) => (
                <motion.div
                  key={meal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <MealCard 
                    meal={meal} 
                    onRequestMeal={setSelectedMealForDetails}
                    onEdit={handleEditMeal}
                    onDelete={handleDeleteMeal}
                    isOwn={user?.email === meal.created_by}
                    averageRating={mealRatings[meal.id] ? mealRatings[meal.id].total / mealRatings[meal.id].count : null}
                    reviewCount={mealRatings[meal.id]?.count || 0}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No meals available</h3>
            <p className="text-slate-500 mb-6">Be the first to share a homemade meal!</p>
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share a Meal
            </Button>
          </div>
        )}
      </div>

      {/* Testimonials - moving carousel */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white/85 backdrop-blur-sm border border-orange-100/60 rounded-3xl shadow-xl shadow-orange-200/30 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.08),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(234,88,12,0.08),transparent_35%)]" />
          <div className="flex items-center justify-between gap-4 relative z-10 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-600 font-semibold">Voices from the table</p>
              <h2 className="text-3xl font-bold text-slate-900">Real moments from our community</h2>
              <p className="text-xs text-slate-500 mt-1">*Sample stories for this demo build</p>
            </div>
            <div className="hidden md:flex flex-col items-end text-right">
              <div className="inline-flex items-center gap-2 bg-white/90 border border-orange-100 rounded-full px-3 py-1 shadow-sm">
                <span className="text-sm font-semibold text-slate-900">4.8</span>
                <span className="text-xs text-slate-500">avg experience</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="absolute inset-y-0 right-0 w-16 pointer-events-none bg-gradient-to-l from-white to-transparent" />
            <motion.div
              className="flex gap-4"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
              style={{ width: 'max-content', animationPlayState: isPaused ? 'paused' : 'running' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div
                  key={idx}
                  className="min-w-[300px] max-w-[320px] bg-white/90 backdrop-blur-md border border-orange-100/60 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_50px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute -top-6 -left-4 text-6xl text-orange-100 pointer-events-none">“</div>
                  <p className="text-slate-800 text-sm leading-relaxed mb-4 relative z-10">“{t.quote}”</p>
                  <div className="text-sm font-semibold text-slate-900 relative z-10">{t.name}</div>
                  <div className="text-xs text-slate-500 relative z-10">
                    {t.role} · {t.location}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-lg shadow-slate-900/5 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 display-font">FAQs</h2>
          <p className="text-slate-600 mb-6">Quick answers about how SharePlate works.</p>
          <div className="space-y-4">
            {faqs.map((item, idx) => (
              <details
                key={idx}
                className="group border border-slate-100 rounded-xl px-4 py-3 bg-slate-50/50 hover:bg-slate-50/80 transition-colors duration-200"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-slate-900">{item.q}</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {item.a}
                  {item.link && (
                    <>
                      {" "}
                      <a href={item.link} className="text-orange-600 font-semibold hover:underline">
                        View Policies
                      </a>
                    </>
                  )}
                </p>
              </details>
            ))}
            <div className="text-sm text-slate-600">
              Want the full details?{" "}
              <a href="/policies" className="text-orange-600 font-semibold hover:underline">
                View Policies
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Meal Sheet */}
      <Sheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          setShowCreateSheet(open);
          if (!open) setEditingMeal(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">{editingMeal ? "Edit Meal" : "Share a Meal"}</SheetTitle>
          </SheetHeader>
          <CreateMealForm
            initialData={editingMeal}
            onSubmit={handleCreateOrUpdateMeal}
            onCancel={() => {
              setEditingMeal(null);
              setShowCreateSheet(false);
            }}
            isSubmitting={isSubmitting}
          />
        </SheetContent>
      </Sheet>

      {/* Meal Details Modal */}
      <MealDetailsModal
        meal={selectedMealForDetails}
        open={!!selectedMealForDetails}
        onClose={() => setSelectedMealForDetails(null)}
        onRequestMeal={handleOpenRequest}
        currentUserEmail={user?.email}
      />

      {/* Request Modal */}
      <MealRequestModal
        meal={selectedMeal}
        open={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onSubmit={handleRequestSubmit}
        isSubmitting={isSubmitting}
      />
      
      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}
