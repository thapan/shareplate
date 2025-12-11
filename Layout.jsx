import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from './mockApi';
import { DEMO_USER, getStoredUser, setStoredUser } from './auth';
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { ChefHat, User, LogOut, Utensils, Menu, X, Users, MessageSquare } from "lucide-react";

export default function Layout({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSignIn = (u = DEMO_USER) => {
    setStoredUser(u);
    setUser(u);
  };

  const handleSignOut = () => {
    setStoredUser(null);
    setUser(null);
  };

  // Fetch unread message count
  useEffect(() => {
    if (!user?.email) return;

    const fetchUnreadCount = async () => {
      const messages = await mockApi.entities.Message.filter({ 
        receiver_email: user.email,
        is_read: false 
      });
      setUnreadCount(messages.length);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user?.email]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 hidden sm:block">
                FoodShare
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link to={createPageUrl("CookProfiles")}>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
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
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-slate-700">{user.full_name?.split(' ')[0]}</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <div className="px-3 py-2">
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MyMeals")} className="cursor-pointer">
                          <ChefHat className="w-4 h-4 mr-2" />
                          My Meals
                        </Link>
                      </DropdownMenuItem>
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
                to={createPageUrl("CookProfiles")} 
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Cooks
                </Button>
              </Link>
              
              {user ? (
                <div className="space-y-2 mt-2">
                  <div className="px-3 py-2 mb-3">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
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
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">FoodShare</span>
          </div>
          <p className="text-sm text-slate-500">
            Sharing homemade meals, one dish at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
