import React, { useState, useEffect } from 'react';
import { mockApi } from '../mockApi';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { ChefHat, Star, ArrowLeft, Utensils, MessageSquare, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import RatingStars from "@/Components/reviews/RatingStars";
import ReviewCard from "@/Components/reviews/ReviewCard";
import MealCard from "@/Components/meals/MealCard";
import MealDetailsModal from "@/Components/meals/MealDetailsModal";
import MealRequestModal from "@/Components/meals/MealRequestModal";
import { getStoredUser, DEMO_USER } from '../auth';

export default function CookProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const cookEmail = urlParams.get('email');
  const [user, setUser] = useState(() => getStoredUser() || DEMO_USER);
  const [selectedMealForDetails, setSelectedMealForDetails] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const handleSendMessage = () => {
    if (!user) setUser(demoUser);
    window.location.href = createPageUrl("Messages") + `?start=${encodeURIComponent(cookEmail)}`;
  };

  const { data: cook, isLoading: loadingCook } = useQuery({
    queryKey: ['cook-profile', cookEmail],
    queryFn: async () => {
      const users = await mockApi.entities.User.filter({ email: cookEmail });
      return users[0] || null;
    },
    enabled: !!cookEmail,
  });

  const { data: cookMeals = [], isLoading: loadingMeals } = useQuery({
    queryKey: ['cook-meals', cookEmail],
    queryFn: () => mockApi.entities.Meal.filter({ created_by: cookEmail }, '-created_date'),
    enabled: !!cookEmail,
  });

  const { data: cookReviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['cook-reviews', cookEmail],
    queryFn: () => mockApi.entities.Review.filter({ cook_email: cookEmail }, '-created_date'),
    enabled: !!cookEmail,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews-for-ratings'],
    queryFn: () => mockApi.entities.Review.list('-created_date', 1000),
  });

  // Calculate ratings
  const mealRatings = {};
  allReviews.forEach(review => {
    if (!mealRatings[review.meal_id]) {
      mealRatings[review.meal_id] = { total: 0, count: 0 };
    }
    mealRatings[review.meal_id].total += review.rating;
    mealRatings[review.meal_id].count += 1;
  });

  const averageRating = cookReviews.length > 0
    ? cookReviews.reduce((sum, r) => sum + r.rating, 0) / cookReviews.length
    : 0;

  const isLoading = loadingCook || loadingMeals || loadingReviews;

  if (!cookEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Invalid cook profile</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  const cookName = cook?.full_name || cookMeals[0]?.cook_name || "Cook";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Link to={createPageUrl("CookProfiles")}>
            <Button variant="ghost" size="icon" className="mb-4 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture */}
            {cook?.profile_picture ? (
              <img 
                src={cook.profile_picture} 
                alt={cookName}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-orange-500" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{cookName}</h1>
                {user?.email !== cookEmail && (
                  <Button
                    onClick={handleSendMessage}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-3">
                {averageRating > 0 && (
                  <RatingStars rating={averageRating} size="md" count={cookReviews.length} />
                )}
                <span className="text-slate-600">
                  {cookMeals.length} meal{cookMeals.length !== 1 ? 's' : ''} shared
                </span>
              </div>

              {cook?.bio && (
                <p className="text-slate-700 leading-relaxed max-w-2xl">
                  {cook.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-100 rounded-xl p-1 h-12">
            <TabsTrigger value="meals" className="rounded-lg">
              <Utensils className="w-4 h-4 mr-2" />
              Meals ({cookMeals.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">
              <Star className="w-4 h-4 mr-2" />
              Reviews ({cookReviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Meals Tab */}
          <TabsContent value="meals">
            <AnimatePresence mode="wait">
              {cookMeals.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {cookMeals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No meals shared yet</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <AnimatePresence mode="wait">
              {cookReviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Average rating card */}
                  <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm mb-3">
                        <div className="text-3xl font-bold text-slate-900">
                          {averageRating.toFixed(1)}
                        </div>
                      </div>
                      <RatingStars rating={averageRating} size="lg" showNumber={false} />
                      <p className="text-slate-600 mt-2">
                        Average rating from {cookReviews.length} review{cookReviews.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Reviews list */}
                  <div className="space-y-3">
                    {cookReviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <ReviewCard review={review} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No reviews yet</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <MealDetailsModal
        meal={selectedMealForDetails}
        open={!!selectedMealForDetails}
        onClose={() => setSelectedMealForDetails(null)}
        onRequestMeal={setSelectedMeal}
      />

      <MealRequestModal
        meal={selectedMeal}
        open={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onSubmit={() => {}}
        isSubmitting={false}
      />
    </div>
  );
}
