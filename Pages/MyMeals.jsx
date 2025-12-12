import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/src/lib/supabaseClient";
import { getStoredUser, setStoredUser, DEMO_USER } from "@/auth";
import CreateMealForm from "@/Components/meals/CreateMealForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { Plus, Edit3, Trash2, MapPin, Clock, Calendar, Users, Check, X, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MyMeals() {
  const [user, setUser] = useState(() => getStoredUser());
  const [editingMeal, setEditingMeal] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const [expandedMealId, setExpandedMealId] = useState(null);
  const toOptimizedUrl = (bucket, path) => {
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path, {
      transform: { width: 900, quality: 75 },
    });
    return publicUrlData?.publicUrl || '';
  };

  const { data: meals = [], isLoading } = useQuery({
    enabled: !!user?.email,
    queryKey: ['my-meals', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('created_by', user.email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: requests = [] } = useQuery({
    enabled: !!user?.email,
    queryKey: ['my-meal-requests', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_requests')
        .select('*')
        .eq('cook_email', user.email);
      if (error) throw error;
      return data || [];
    },
  });

  const requestCounts = useMemo(() => {
    const counts = {};
    requests.forEach((req) => {
      counts[req.meal_id] = counts[req.meal_id] || { total: 0, pending: 0 };
      counts[req.meal_id].total += 1;
      if (req.status === 'pending') counts[req.meal_id].pending += 1;
    });
    return counts;
  }, [requests]);

  const createMealMutation = useMutation({
    mutationFn: async ({ user: creator = DEMO_USER, image_file, ...data }) => {
      if (!creator?.email) throw new Error("Missing user email");
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
      queryClient.invalidateQueries({ queryKey: ['my-meals', user?.email] });
      toast.success("Meal created");
      setShowSheet(false);
    },
    onError: (err) => toast.error(err?.message || "Could not save meal."),
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
      queryClient.invalidateQueries({ queryKey: ['my-meals', user?.email] });
      toast.success("Meal updated");
      setEditingMeal(null);
      setShowSheet(false);
    },
    onError: (err) => toast.error(err?.message || "Could not update meal."),
  });

  const deleteMealMutation = useMutation({
    mutationFn: async ({ meal, userEmail }) => {
      if (!userEmail) throw new Error("Missing user email");
      await supabase.from('meal_requests').delete().eq('meal_id', meal.id);

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
          // ignore cleanup errors
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
      queryClient.invalidateQueries({ queryKey: ['my-meals', user?.email] });
      toast.success("Meal removed");
    },
    onError: (err) => toast.error(err?.message || "Could not delete meal."),
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ request, meal, status }) => {
      // Re-check availability before approving to avoid overbooking
      let latestMeal = meal;
      if (status === 'approved') {
        const { data: freshMeal, error: mealErr } = await supabase
          .from('meals')
          .select('id, portions_available, portions_claimed')
          .eq('id', meal.id)
          .single();
        if (mealErr) throw mealErr;
        latestMeal = freshMeal;
        const remaining = (freshMeal.portions_available || 0) - (freshMeal.portions_claimed || 0);
        if (request.portions_requested > remaining) {
          throw new Error("Not enough portions left to approve this request.");
        }
      }

      const { error } = await supabase
        .from('meal_requests')
        .update({ status })
        .eq('id', request.id)
        .eq('cook_email', meal.created_by);
      if (error) throw error;

      // Adjust claimed portions only on approval; no change on deny/completed
      if (status === 'approved') {
        const newClaimed = (latestMeal.portions_claimed || 0) + request.portions_requested;
        await supabase
          .from('meals')
          .update({
            portions_claimed: newClaimed,
            status: newClaimed >= (latestMeal.portions_available || 0) ? 'full' : 'open',
          })
          .eq('id', meal.id)
          .eq('created_by', meal.created_by);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meals', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['my-meal-requests', user?.email] });
      toast.success("Request updated");
    },
    onError: (err) => toast.error(err?.message || "Could not update request."),
  });

  const handleSubmit = async (payload) => {
    const currentUser = user || DEMO_USER;
    setStoredUser(currentUser);
    setUser(currentUser);
    setIsSubmitting(true);
    try {
      if (editingMeal) {
        await updateMealMutation.mutateAsync({
          ...payload,
          id: editingMeal.id,
          userEmail: currentUser.email,
          existingImageUrl: editingMeal.image_url,
        });
      } else {
        await createMealMutation.mutateAsync({ ...payload, user: currentUser });
      }
    } catch (err) {
      // error handled in mutations
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (meal) => {
    const currentUser = user || DEMO_USER;
    setStoredUser(currentUser);
    setUser(currentUser);
    const confirmed = window.confirm("Delete this meal? This cannot be undone.");
    if (!confirmed) return;
    await deleteMealMutation.mutateAsync({ meal, userEmail: currentUser.email });
  };

  const stats = useMemo(() => {
    const total = meals.length;
    const open = meals.filter((m) => m.status === 'open').length;
    const portions = meals.reduce((acc, m) => acc + (m.portions_available || 0), 0);
    const claimed = meals.reduce((acc, m) => acc + (m.portions_claimed || 0), 0);
    return { total, open, portions, claimed };
  }, [meals]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold">My Meals</p>
          <h1 className="text-3xl font-bold text-slate-900">Manage what you’re sharing</h1>
          <p className="text-slate-600">Edit, publish, or remove your shared meals in one place.</p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 rounded-full px-5"
          onClick={() => {
            setEditingMeal(null);
            setShowSheet(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Share a Meal
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500">Total meals</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500">Open</p>
          <p className="text-2xl font-semibold text-emerald-600">{stats.open}</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500">Portions offered</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.portions}</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500">Portions claimed</p>
          <p className="text-2xl font-semibold text-amber-600">{stats.claimed}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : meals.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-lg font-semibold text-slate-900 mb-2">No meals yet</p>
          <p className="text-slate-600 mb-4">Share your first meal to connect with neighbors.</p>
          <Button className="bg-slate-900 hover:bg-slate-800 rounded-full px-5" onClick={() => setShowSheet(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Share a Meal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meals.map((meal) => {
            const counts = requestCounts[meal.id] || { total: 0, pending: 0 };
            const mealRequests = (requests || []).filter((r) => r.meal_id === meal.id).sort((a, b) => {
              const order = { pending: 0, approved: 1, completed: 2, denied: 3 };
              return (order[a.status] ?? 4) - (order[b.status] ?? 4);
            });
            return (
              <div key={meal.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{meal.title}</h3>
                      <Badge variant="outline" className="capitalize">
                        {meal.cuisine_type || 'Cuisine'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{meal.description || "No description provided."}</p>
                  </div>
                  <Badge
                    className={meal.status === 'open' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                  >
                    {meal.status === 'open' ? 'Open' : 'Full'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{meal.date ? format(new Date(meal.date), "MMM d, yyyy") : "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{meal.time || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{meal.location || "No location"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{(meal.portions_available || 0) - (meal.portions_claimed || 0)} of {meal.portions_available || 0} left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      {counts.pending} pending · {counts.total} total requests
                    </Badge>
                  </div>
                </div>

                {mealRequests.length > 0 && (
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800">Requests</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        {expandedMealId === meal.id ? "Hide" : "View"}
                      </Button>
                    </div>
                    {expandedMealId === meal.id && (
                      <div className="space-y-3">
                        {mealRequests.map((req) => (
                          <div key={req.id} className="bg-white border border-slate-100 rounded-lg p-3 shadow-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{req.requester_name || "Guest"}</p>
                                <p className="text-xs text-slate-500">{req.requester_email}</p>
                              </div>
                              <Badge
                                className={
                                  req.status === 'pending'
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : req.status === 'approved'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : req.status === 'completed'
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }
                              >
                                {req.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{req.portions_requested} portions</span>
                              {req.created_at && <span>{format(new Date(req.created_at), "MMM d, h:mm a")}</span>}
                            </div>
                            {req.message && <p className="text-sm text-slate-700 mb-3">{req.message}</p>}
                            <div className="flex flex-wrap gap-2">
                              {req.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => updateRequestStatus.mutate({ request: req, meal, status: 'approved' })}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:text-red-700"
                                    onClick={() => updateRequestStatus.mutate({ request: req, meal, status: 'denied' })}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Deny
                                  </Button>
                                </>
                              )}
                              {req.status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-200 text-blue-700"
                                  onClick={() => updateRequestStatus.mutate({ request: req, meal, status: 'completed' })}
                                >
                                  <ShieldCheck className="w-4 h-4 mr-1" /> Mark picked up
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:text-slate-900"
                    onClick={() => {
                      setEditingMeal(meal);
                      setShowSheet(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(meal)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet
        open={showSheet}
        onOpenChange={(open) => {
          setShowSheet(open);
          if (!open) setEditingMeal(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">{editingMeal ? "Edit Meal" : "Share a Meal"}</SheetTitle>
          </SheetHeader>
          <CreateMealForm
            initialData={editingMeal}
            onSubmit={handleSubmit}
            onCancel={() => {
              setEditingMeal(null);
              setShowSheet(false);
            }}
            isSubmitting={isSubmitting}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
