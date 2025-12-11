import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/Layout';
import Home from '@/Pages/Home';
import CookProfiles from '@/Pages/CookProfiles';
import CookProfile from '@/Pages/CookProfile';
import Messages from '@/Pages/Messages';
import Login from '@/Pages/Login';
import './styles.css';

const queryClient = new QueryClient();

function MyMealsPlaceholder() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">My Meals</h1>
      <p className="text-slate-600">This view is not implemented yet in the mock environment.</p>
    </div>
  );
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
            <Route path="/messages" element={<Messages />} />
            <Route path="/my-meals" element={<MyMealsPlaceholder />} />
            <Route path="/login" element={<Login />} />
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
