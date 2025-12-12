import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/Layout';
import Home from '@/Pages/Home';
import CookProfiles from '@/Pages/CookProfiles';
import CookProfile from '@/Pages/CookProfile';
import Messages from '@/Pages/Messages';
import Login from '@/Pages/Login';
import Signup from '@/Pages/Signup';
import MyMeals from '@/Pages/MyMeals';
import Policies from '@/Pages/Policies';
import './styles.css';
import { supabase } from '@/src/lib/supabaseClient';
import { getStoredUser, setStoredUser } from '@/auth';

const queryClient = new QueryClient();

function RequireAuth({ children }) {
  const [state, setState] = useState({ checking: true, authed: false });

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const cached = getStoredUser();
      if (cached?.email) {
        if (!cancelled) setState({ checking: false, authed: true });
        return;
      }
      const { data } = await supabase.auth.getSession();
      const authedEmail = data?.session?.user?.email;
      if (authedEmail) {
        const full_name = data.session.user.user_metadata?.full_name || 'User';
        setStoredUser({ email: authedEmail, full_name });
        if (!cancelled) setState({ checking: false, authed: true });
      } else {
        if (!cancelled) setState({ checking: false, authed: false });
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600">
        Checking your session...
      </div>
    );
  }

  if (!state.authed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cooks" element={<CookProfiles />} />
            <Route path="/cook" element={<CookProfile />} />
            <Route
              path="/messages"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />
            <Route
              path="/my-meals"
              element={
                <RequireAuth>
                  <MyMeals />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
