import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/Components/ui/input";
import { Search, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CookProfileCard from "@/Components/cooks/CookProfileCard";
import { supabase } from "@/src/lib/supabaseClient";

export default function CookProfiles() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allMeals = [], isLoading: loadingMeals } = useQuery({
    queryKey: ['all-meals-for-cooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allReviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['all-reviews-for-cooks'],
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

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique cook emails from meals
  const cookEmails = [...new Set(allMeals.map(meal => meal.created_by))];
  
  // Create cook profiles with stats
  const cooks = cookEmails.map(email => {
    const user = allUsers.find(u => u.email === email) || { 
      email, 
      full_name: allMeals.find(m => m.created_by === email)?.cook_name || "Anonymous Cook"
    };
    const userMeals = allMeals.filter(m => m.created_by === email);
    const userReviews = allReviews.filter(r => r.cook_email === email);
    const averageRating = userReviews.length > 0
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
      : 0;

    return {
      ...user,
      mealCount: userMeals.length,
      reviewCount: userReviews.length,
      averageRating,
    };
  }).filter(cook => cook.mealCount > 0); // Only show cooks with meals

  // Sort by average rating descending
  const sortedCooks = cooks.sort((a, b) => b.averageRating - a.averageRating);

  // Filter by search
  const filteredCooks = sortedCooks.filter(cook =>
    cook.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cook.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = loadingMeals || loadingReviews || loadingUsers;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.08),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(249,115,22,0.06),transparent_50%)] pointer-events-none" />
      {/* Header */}
      <div className="relative bg-gradient-to-br from-orange-50 via-orange-25 to-orange-100/50 border-b border-orange-100/50">
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-300/40 rounded-full animate-pulse" />
        <div className="absolute top-32 right-20 w-1 h-1 bg-orange-400/60 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-orange-200/50 rounded-full animate-pulse delay-500" />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-orange-500/20 mb-4 border border-orange-100/50">
              <ChefHat className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Our Cooks
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Meet the talented home cooks sharing their delicious creations with the community
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search cooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm focus:shadow-md transition-shadow duration-200"
            />
          </div>
        </div>

        {/* Cooks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl h-32 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredCooks.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence>
              {filteredCooks.map((cook) => (
                <motion.div
                  key={cook.email}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <CookProfileCard 
                    cook={cook}
                    mealCount={cook.mealCount}
                    averageRating={cook.averageRating}
                    reviewCount={cook.reviewCount}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No cooks found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
