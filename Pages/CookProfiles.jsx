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
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
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
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Cooks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
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
            <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No cooks found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
