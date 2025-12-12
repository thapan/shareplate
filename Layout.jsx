import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from "@/src/lib/supabaseClient";
import { DEMO_USER, getStoredUser, setStoredUser } from './auth';
import { signOut, getSession } from "@/src/lib/authClient";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { ChefHat, LogOut, Utensils, Menu, X, Users, MessageSquare, ShieldCheck } from "lucide-react";
import { ModernLogo, ModernLogoMark } from "@/Components/ModernLogo";



export default function Layout({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const cooksPath = user ? createPageUrl("CookProfiles") : createPageUrl("Login");

  const hydrateUser = async (authedEmail, metadataName) => {
    if (!authedEmail) return null;
    const { data: profile } = await supabase.from('users').select('*').eq('email', authedEmail).maybeSingle();
    const full_name = profile?.full_name || metadataName || 'User';
    const profile_picture = profile?.profile_picture;
    const is_admin = profile?.is_admin || false;
    const hydrated = { email: authedEmail, full_name, profile_picture };
    setStoredUser(hydrated);
    setUser(hydrated);
    setIsAdmin(is_admin);
    return hydrated;
  };

  const handleSignIn = (u = DEMO_USER) => {
    setStoredUser(u);
    setUser(u);
  };

  const handleSignOut = () => {
    setStoredUser(null);
    setUser(null);
    setIsAdmin(false);
    signOut();
    navigate(createPageUrl("Login"));
  };

  // Hydrate user from Supabase session/profile
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const authedEmail = data?.session?.user?.email;
      const metadataName = data?.session?.user?.user_metadata?.full_name;
      if (authedEmail) await hydrateUser(authedEmail, metadataName);
    };
    loadUser();
  }, []);

  // Keep nav in sync with auth changes (sign in/out) without page reload
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        hydrateUser(session.user.email, session.user.user_metadata?.full_name);
      }
      if (event === 'SIGNED_OUT') {
        setStoredUser(null);
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    if (!user?.email) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_email', user.email)
        .eq('is_read', false);
      if (!error && typeof count === 'number') {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user?.email]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")}>
              <ModernLogo size="default" showBeta={true} />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link to={cooksPath}>
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                  title={user ? "Browse cooks" : "Sign in required"}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Cooks
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Link to={createPageUrl("Messages")}>
                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900 relative">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  
                  <Link to={createPageUrl("MyMeals")}>
                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                      <ChefHat className="w-4 h-4 mr-2" />
                      My Meals
                    </Button>
                  </Link>
                  
                  {isAdmin && (
                    <Link to={createPageUrl("Admin")}>
                      <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 pr-1 pl-1.5">
                        <div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-tight text-left max-w-[160px]">
                          <span className="text-slate-900 font-semibold truncate">{user.full_name || 'Account'}</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                      <div className="px-3 py-2">
                        <p className="font-semibold text-slate-900 truncate">{user.full_name || 'Account'}</p>
                        {user.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MyMeals")} className="cursor-pointer">
                          <ChefHat className="w-4 h-4 mr-2" />
                          My Meals
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Admin")} className="cursor-pointer">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="text-red-600 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 rounded-full px-6"
                >
                  <Link to={createPageUrl("Login")}>Sign In</Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100">
              <Link 
                to={cooksPath} 
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  title={user ? "Browse cooks" : "Sign in required"}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Cooks
                </Button>
              </Link>
              {user ? (
                <div className="space-y-2 mt-2">
                  <div className="px-3 py-2 mb-3">
                    <p className="font-medium text-slate-900">{user.full_name || 'Account'}</p>
                    {user.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
                  </div>
                  <Link 
                    to={createPageUrl("Messages")} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start relative">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link 
                    to={createPageUrl("MyMeals")} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      <ChefHat className="w-4 h-4 mr-2" />
                      My Meals
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link 
                      to={createPageUrl("Admin")} 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button 
                  asChild
                  className="w-full bg-slate-900 hover:bg-slate-800"
                >
                  <Link to={createPageUrl("Login")}>Sign In</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ModernLogoMark size={32} />
            <span className="font-semibold text-slate-900">SharePlate</span>
          </div>
          <p className="text-sm text-slate-500">
            Free community sharing—no payments or delivery. Participation is at your discretion; SharePlate isn’t responsible for food safety.{" "}
            <Link to={createPageUrl("Policies")} className="text-orange-600 font-semibold hover:underline">Policies</Link>
          </p>
          <p className="text-xs text-slate-400 mt-2">© 2025 SharePlate</p>
        </div>
      </footer>
    </div>
  );
}
