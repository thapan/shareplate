import React, { useState, useEffect } from 'react';
import { mockApi } from '../mockApi';
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
import { Plus, Search, Utensils, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MealCard from "@/Components/meals/MealCard";
import MealRequestModal from "@/Components/meals/MealRequestModal";
import MealDetailsModal from "@/Components/meals/MealDetailsModal";
import CreateMealForm from "@/Components/meals/CreateMealForm";
import { DEMO_USER, getStoredUser, setStoredUser } from '../auth';
import { Badge } from "@/Components/ui/badge";

export default function Home() {
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
  const RADIUS_MILES = 15;
  
  const queryClient = useQueryClient();

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['meals'],
    queryFn: () => mockApi.entities.Meal.filter({ status: 'open' }, '-created_date'),
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => mockApi.entities.Review.list('-created_date', 1000),
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
    mutationFn: ({ user: creator = DEMO_USER, ...data }) => mockApi.entities.Meal.create({
      ...data,
      cook_name: creator.full_name || "Home Cook",
      status: "open",
      portions_claimed: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setShowCreateSheet(false);
      toast.success("Meal shared successfully!");
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async ({ meal, portions, message, user: requester = DEMO_USER }) => {
      await mockApi.entities.MealRequest.create({
        meal_id: meal.id,
        meal_title: meal.title,
        cook_email: meal.created_by,
        requester_name: requester.full_name || "Food Lover",
        requester_email: requester.email,
        portions_requested: portions,
        message,
        status: "pending",
      });
      
      await mockApi.entities.Meal.update(meal.id, {
        portions_claimed: (meal.portions_claimed || 0) + portions,
        status: (meal.portions_claimed || 0) + portions >= meal.portions_available ? "full" : "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setSelectedMeal(null);
      toast.success("Request sent to the cook!");
    },
  });

  const handleRequestSubmit = async ({ portions, message }) => {
    const currentUser = user || DEMO_USER;
    setStoredUser(currentUser);
    setUser(currentUser);
    setIsSubmitting(true);
    await createRequestMutation.mutateAsync({ meal: selectedMeal, portions, message, user: currentUser });
    setIsSubmitting(false);
  };

  const handleCreateMeal = async (data) => {
    const currentUser = user || DEMO_USER;
    setStoredUser(currentUser);
    setUser(currentUser);
    setIsSubmitting(true);
    await createMealMutation.mutateAsync({ ...data, user: currentUser });
    setIsSubmitting(false);
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
      ? distanceInMiles(userLocation, { lat: meal.lat, lng: meal.lng }) <= RADIUS_MILES
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 text-sm text-slate-600 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Share homemade meals with your community</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
              Home cooking,
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent"> shared</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Discover delicious homemade meals from talented home cooks in your neighborhood. Share your own creations too!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => setShowCreateSheet(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 text-base shadow-lg shadow-slate-900/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share a Meal
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('meals-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white hover:bg-slate-50 rounded-full px-8 h-14 text-base border-slate-200"
              >
                <Utensils className="w-5 h-5 mr-2" />
                Browse Meals
              </Button>
            </div>
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
      <div id="meals-section" className="max-w-6xl mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search meals, cuisines, or cooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>
          
          <div className="flex flex-1 gap-3">
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="h-12 bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="all" className="rounded-lg px-4">All</TabsTrigger>
                <TabsTrigger value="today" className="rounded-lg px-4">Today</TabsTrigger>
                <TabsTrigger value="week" className="rounded-lg px-4">This Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge variant="outline" className="bg-white border-slate-200">
            {locationStatus === "ready" && userLocation
              ? `Showing meals within ${RADIUS_MILES} miles of you`
              : locationStatus === "pending"
                ? "Detecting your location..."
                : "Location not available; showing all meals"}
          </Badge>
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
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
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
              onClick={() => setShowCreateSheet(true)}
              className="bg-slate-900 hover:bg-slate-800 rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share a Meal
            </Button>
          </div>
        )}
      </div>

      {/* Create Meal Sheet */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">Share a Meal</SheetTitle>
          </SheetHeader>
          <CreateMealForm
            onSubmit={handleCreateMeal}
            onCancel={() => setShowCreateSheet(false)}
            isSubmitting={isSubmitting}
          />
        </SheetContent>
      </Sheet>

      {/* Meal Details Modal */}
      <MealDetailsModal
        meal={selectedMealForDetails}
        open={!!selectedMealForDetails}
        onClose={() => setSelectedMealForDetails(null)}
        onRequestMeal={setSelectedMeal}
      />

      {/* Request Modal */}
      <MealRequestModal
        meal={selectedMeal}
        open={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onSubmit={handleRequestSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
