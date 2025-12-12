import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { DEMO_USER, setStoredUser } from '../auth';
import { sendOtp, verifyOtp, getSession } from "@/src/lib/authClient";
import { createPageUrl } from '@/utils';
import { supabase } from "@/src/lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ sending: false, verifying: false, error: '' });
  const [resendTimer, setResendTimer] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    // If already have a Supabase session, keep the user stored
    getSession()
      .then(({ session }) => {
        if (session?.user?.email) {
          setStoredUser({ email: session.user.email, full_name: session.user.user_metadata?.full_name || 'User' });
          navigate(createPageUrl("Home"));
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpSent, resendTimer]);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const checkUserExists = async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();
    
    if (!error && data) {
      setForm(prev => ({ ...prev, full_name: data.full_name || '' }));
      return true;
    }
    setStatus({ sending: false, verifying: false, error: 'No account found with this email. Please sign up first.' });
    return false;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.email) {
      setStatus({ sending: false, verifying: false, error: 'Please enter your email.' });
      return;
    }
    if (!isValidEmail(form.email)) {
      setStatus({ sending: false, verifying: false, error: 'Enter a valid email address.' });
      return;
    }
    
    const userExists = await checkUserExists(form.email);
    if (!userExists) return;
    
    setStatus({ sending: true, verifying: false, error: '' });
    
    try {
      const { error } = await sendOtp(form.email);
      if (error) {
        // Handle specific error types
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        if (error.message?.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        throw error;
      }
      
      setOtpSent(true);
      setResendTimer(30);
      setStatus({ sending: false, verifying: false, error: '' });
    } catch (err) {
      console.error('OTP send error:', err);
      setStatus({ 
        sending: false, 
        verifying: false, 
        error: err.message || 'Could not send code. Please try again.' 
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || !form.email) return;
    setStatus({ sending: false, verifying: true, error: '' });
    try {
      const { error } = await verifyOtp({ email: form.email, token: code });
      if (error) throw error;
      setStoredUser({ email: form.email, full_name: form.full_name });
      navigate(createPageUrl("Home"));
    } catch (err) {
      setStatus({ sending: false, verifying: false, error: err.message || 'Invalid code.' });
      return;
    }
    setStatus({ sending: false, verifying: false, error: '' });
  };

  const handleDemo = () => {
    setStoredUser(DEMO_USER);
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-20 left-10 w-2 h-2 bg-orange-300/40 rounded-full animate-pulse" />
      <div className="absolute top-32 right-20 w-1 h-1 bg-orange-400/60 rounded-full animate-pulse delay-1000" />
      <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-orange-200/50 rounded-full animate-pulse delay-500" />
      
      <div className="w-full max-w-md">
        {/* Beta Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg shadow-orange-500/10 border border-orange-100/50 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-slate-900">SharePlate</span>
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Early Access</span>
          </div>
        </div>
        
        <Card className="shadow-xl border-slate-100 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600 text-sm">Sign in to start sharing meals with your community</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {status.error && <p className="text-sm text-red-600">{status.error}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105" disabled={status.sending}>
                {status.sending ? 'Sending code...' : 'Send verification code'}
              </Button>
              <p className="text-xs text-slate-500">
                We’ll send a one-time code to your email. Check spam if you don’t see it within a minute.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1 text-sm text-slate-600">
                <p>We sent a code to <span className="font-semibold">{form.email}</span>.</p>
                <p className="text-xs text-slate-500">Enter it below to finish signing in.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Enter your code"
                  inputMode="numeric"
                  required
                />
              </div>
      {status.error && <p className="text-sm text-red-600">{status.error}</p>}
              {status.error && <p className="text-sm text-red-600">{status.error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-1/3" onClick={() => setOtpSent(false)} disabled={status.verifying}>
                  Edit email
                </Button>
                <Button type="submit" className="w-2/3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl" disabled={status.verifying}>
                  {status.verifying ? 'Verifying...' : 'Continue'}
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Code valid for a short time.</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-orange-600"
                  disabled={resendTimer > 0 || status.sending}
                  onClick={handleSendOtp}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </Button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs uppercase text-slate-400">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="text-center text-sm text-slate-600">
            <span className="mr-2">New to SharePlate?</span>
            <Link to={createPageUrl("Signup")} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">Join the beta</Link>
          </div>

          <p className="text-xs text-slate-500 text-center">
            By continuing, you agree to our{" "}
            <Link to={createPageUrl("Policies") + "#terms"} className="text-orange-600 font-semibold hover:underline">Terms</Link>{" "}
            and{" "}
            <Link to={createPageUrl("Policies") + "#privacy"} className="text-orange-600 font-semibold hover:underline">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
      
      {/* Beta Footer */}
      <div className="text-center mt-6">
        <p className="text-xs text-slate-500">
          🧪 Early Access • Help us improve by sharing feedback
        </p>
      </div>
      </div>
    </div>
  );
}
