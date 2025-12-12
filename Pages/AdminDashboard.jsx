import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { 
  AlertTriangle, Bug, Users, TrendingUp, 
  Heart, MessageCircle, CheckCircle, Activity
} from 'lucide-react';
import { supabase } from '@/src/lib/supabaseClient';

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Utility functions
const getDaysSince = (date) => Math.floor((new Date() - new Date(date)) / MILLISECONDS_PER_DAY);
const getPercentage = (numerator, denominator) => denominator > 0 ? (numerator / denominator) * 100 : 0;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        navigate('/');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();
        
        if (error || !data?.is_admin) {
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        navigate('/');
      } finally {
        setAdminCheckComplete(true);
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);
  // Essential beta metrics only
  const { data: betaMetrics } = useQuery({
    queryKey: ['beta-metrics'],
    queryFn: async () => {
      try {
        const [usersResult, feedbackResult, mealsResult] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('feedback').select('mood, category, created_at, feedback'),
          supabase.from('meals').select('id, status, created_at')
        ]);

        const users = usersResult.data || [];
        const feedback = feedbackResult.data || [];
        const meals = mealsResult.data || [];

        // Debug logging
        console.log('Admin Dashboard Debug:', {
          usersCount: users.length,
          feedbackCount: feedback.length,
          mealsCount: meals.length,
          usersData: users.slice(0, 3) // Show first 3 users
        });

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * MILLISECONDS_PER_DAY);

        // Critical beta metrics
        const totalUsers = users.length;
        const weeklySignups = users.filter(u => new Date(u.created_at) >= weekAgo).length;
        const totalFeedback = feedback.length;
        const bugReports = feedback.filter(f => f.category === 'bug').length;
        const activeMeals = meals.filter(m => m.status === 'open').length;
        
        // User satisfaction
        const positive = feedback.filter(f => ['love', 'like'].includes(f.mood)).length;
        const satisfactionRate = getPercentage(positive, totalFeedback);

        return {
          totalUsers,
          weeklySignups,
          totalFeedback,
          bugReports,
          activeMeals,
          satisfactionRate,
          users: users.slice(0, 20), // Show recent 20 users
          recentFeedback: feedback.slice(0, 10),
          criticalBugs: feedback.filter(f => f.category === 'bug').slice(0, 5)
        };
      } catch (error) {
        console.error('Failed to fetch beta metrics:', error);
        return null;
      }
    }
  });



  const getBetaHealthStatus = (metrics) => {
    if (!metrics) return { status: 'Unknown', color: 'gray' };
    
    const { satisfactionRate, bugReports, weeklySignups } = metrics;
    
    if (bugReports > 5 || satisfactionRate < 60) {
      return { status: 'Critical', color: 'red' };
    }
    if (bugReports > 2 || satisfactionRate < 75 || weeklySignups === 0) {
      return { status: 'Warning', color: 'yellow' };
    }
    return { status: 'Healthy', color: 'green' };
  };
  
  // Don't render if not admin or still checking
  if (!adminCheckComplete || !isAdmin) {
    return adminCheckComplete ? null : (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  const healthStatus = getBetaHealthStatus(betaMetrics);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Beta Dashboard</h1>
              <p className="text-slate-600">Essential metrics for beta success</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`px-3 py-1 text-white bg-${healthStatus.color}-500`}>
                {healthStatus.status.toUpperCase()}
              </Badge>
              <Badge className="bg-orange-500 text-white px-3 py-1">BETA</Badge>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {betaMetrics && (betaMetrics.bugReports > 0 || betaMetrics.satisfactionRate < 70) && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Immediate Action Required</h3>
                  <div className="text-sm text-red-700">
                    {betaMetrics.bugReports > 0 && <span>{betaMetrics.bugReports} critical bugs reported. </span>}
                    {betaMetrics.satisfactionRate < 70 && <span>User satisfaction at {betaMetrics.satisfactionRate.toFixed(1)}%. </span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Essential Beta KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">User Satisfaction</p>
                  <p className={`text-2xl font-bold ${
                    (betaMetrics?.satisfactionRate || 0) >= 75 ? 'text-green-600' : 
                    (betaMetrics?.satisfactionRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {betaMetrics?.satisfactionRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-slate-500">Critical for beta success</p>
                </div>
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Weekly Signups</p>
                  <p className="text-2xl font-bold text-blue-600">{betaMetrics?.weeklySignups || 0}</p>
                  <p className="text-xs text-slate-500">Growth momentum</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Bug Reports</p>
                  <p className={`text-2xl font-bold ${
                    (betaMetrics?.bugReports || 0) === 0 ? 'text-green-600' : 
                    (betaMetrics?.bugReports || 0) <= 2 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {betaMetrics?.bugReports || 0}
                  </p>
                  <p className="text-xs text-slate-500">Must fix immediately</p>
                </div>
                <Bug className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-purple-600">{betaMetrics?.totalUsers || 0}</p>
                  <p className="text-xs text-slate-500">Beta community size</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beta Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active Meals</span>
                  <span className="font-semibold">{betaMetrics?.activeMeals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Feedback</span>
                  <span className="font-semibold">{betaMetrics?.totalFeedback || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Beta Health</span>
                  <span className={`font-semibold text-${healthStatus.color}-600`}>
                    {healthStatus.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Beta Success Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Satisfaction Target</span>
                  <span className="font-semibold">{betaMetrics?.satisfactionRate >= 75 ? '✅' : '❌'} 75%+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Bug-Free Target</span>
                  <span className="font-semibold">{betaMetrics?.bugReports === 0 ? '✅' : '❌'} Zero Bugs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Growth Target</span>
                  <span className="font-semibold">{betaMetrics?.weeklySignups > 0 ? '✅' : '❌'} Weekly Growth</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">👥 Users ({betaMetrics?.totalUsers || 0})</TabsTrigger>
            <TabsTrigger value="bugs" className={betaMetrics?.bugReports > 0 ? 'text-red-600' : ''}>
              🚨 Critical Bugs ({betaMetrics?.bugReports || 0})
            </TabsTrigger>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Beta Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {betaMetrics?.users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name || 'Anonymous'}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Joined {getDaysSince(user.created_at)} days ago
                        </p>
                        {getDaysSince(user.created_at) <= 7 && (
                          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-slate-500 py-8">No users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bugs">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">🚨 Critical Bug Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {!betaMetrics?.criticalBugs?.length ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-600 font-semibold">No critical bugs! 🎉</p>
                    <p className="text-sm text-slate-500">Beta is running smoothly</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {betaMetrics.criticalBugs.map((bug, index) => (
                      <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Bug className="w-4 h-4 text-red-500" />
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            URGENT
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(bug.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">{bug.feedback}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {betaMetrics?.recentFeedback?.map((item, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            ['love', 'like'].includes(item.mood) ? 'bg-green-500' : 
                            item.mood === 'okay' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {item.mood}
                              </Badge>
                              <Badge variant={item.category === 'bug' ? 'destructive' : 'secondary'} className="capitalize">
                                {item.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-700">{item.feedback}</p>
                    </div>
                  )) || (
                    <p className="text-center text-slate-500 py-8">No feedback yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}