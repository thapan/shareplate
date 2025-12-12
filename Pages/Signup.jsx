import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { setStoredUser } from '../auth';
import { sendOtp, verifyOtp, getSession } from "@/src/lib/authClient";
import { supabase } from "@/src/lib/supabaseClient";
import { createPageUrl } from '@/utils';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ sending: false, verifying: false, error: '' });
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) {
      setStatus({ sending: false, verifying: false, error: 'Please enter your name and email.' });
      return;
    }
    if (!isValidEmail(form.email)) {
      setStatus({ sending: false, verifying: false, error: 'Enter a valid email address.' });
      return;
    }
    setStatus({ sending: true, verifying: false, error: '' });

    // If the user already exists, prompt them to sign in instead of re-creating
    const { count, error: existsError } = await supabase
      .from('users')
      .select('email', { count: 'exact', head: true })
      .eq('email', form.email);

    if (!existsError && typeof count === 'number' && count > 0) {
      setStatus({ sending: false, verifying: false, error: 'An account already exists for this email. Please sign in instead.' });
      return;
    }

    sendOtp(form.email)
      .then(({ error }) => {
        if (error) throw error;
        setOtpSent(true);
        setResendTimer(30);
        setStatus({ sending: false, verifying: false, error: '' });
      })
      .catch((err) => {
        setStatus({ sending: false, verifying: false, error: err.message || 'Could not send code.' });
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-100">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold">Join SharePlate</p>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-600 text-sm">Get a one-time code by email to finish signing up.</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Jamie Oliver"
                  required
                />
              </div>
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
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={status.sending}>
                {status.sending ? 'Sending code...' : 'Send code'}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                We’ll email a one-time code. New users will be created automatically after verification.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1 text-sm text-slate-600">
                <p>We sent a code to <span className="font-semibold">{form.email}</span>.</p>
                <p className="text-xs text-slate-500">Enter it below to finish creating your account.</p>
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-1/3" onClick={() => setOtpSent(false)} disabled={status.verifying}>
                  Edit email
                </Button>
                <Button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white" disabled={status.verifying}>
                  {status.verifying ? 'Verifying...' : 'Verify & continue'}
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Code valid for a short time.</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-amber-600"
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

          <Button asChild variant="outline" className="w-full">
            <Link to={createPageUrl("Login")}>Already have an account? Sign in</Link>
          </Button>

          <p className="text-xs text-slate-500 text-center mt-2">
            By continuing, you agree to our{" "}
            <Link to={createPageUrl("Policies") + "#terms"} className="text-amber-600 font-semibold hover:underline">Terms</Link>{" "}
            and{" "}
            <Link to={createPageUrl("Policies") + "#privacy"} className="text-amber-600 font-semibold hover:underline">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
