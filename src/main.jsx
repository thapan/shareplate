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
import AdminDashboard from '@/Pages/AdminDashboard';
import ErrorBoundary from '@/Components/ErrorBoundary';
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                <Route path="/cooks" element={<ErrorBoundary><CookProfiles /></ErrorBoundary>} />
                <Route path="/cook" element={<ErrorBoundary><CookProfile /></ErrorBoundary>} />
                <Route
                  path="/messages"
                  element={
                    <RequireAuth>
                      <ErrorBoundary><Messages /></ErrorBoundary>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my-meals"
                  element={
                    <RequireAuth>
                      <ErrorBoundary><MyMeals /></ErrorBoundary>
                    </RequireAuth>
                  }
                />
                <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                <Route path="/signup" element={<ErrorBoundary><Signup /></ErrorBoundary>} />
                <Route path="/policies" element={<ErrorBoundary><Policies /></ErrorBoundary>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
