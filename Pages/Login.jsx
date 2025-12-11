import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { DEMO_USER, setStoredUser, issueEmailOtp, verifyEmailOtp } from '../auth';
import { createPageUrl } from '@/utils';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ sending: false, verifying: false, error: '' });
  const [devCode, setDevCode] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) return;
    setStatus({ sending: true, verifying: false, error: '' });
    try {
      const generated = issueEmailOtp(form.email, form.full_name);
      setOtpSent(true);
      setDevCode(generated); // dev-helper since no real email service
    } catch (err) {
      setStatus({ sending: false, verifying: false, error: err.message || 'Could not send code.' });
      return;
    }
    setStatus({ sending: false, verifying: false, error: '' });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || !form.email) return;
    setStatus({ sending: false, verifying: true, error: '' });
    try {
      const user = verifyEmailOtp(form.email, code);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-100">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
            <p className="text-slate-600 text-sm">Use your email to get a one-time code.</p>
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
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1 text-sm text-slate-600">
                <p>We sent a 6-digit code to <span className="font-semibold">{form.email}</span>.</p>
                <p className="text-xs text-slate-500">Enter it below to finish signing in.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  required
                />
              </div>
              {devCode && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  Dev preview: code is {devCode}
                </p>
              )}
              {status.error && <p className="text-sm text-red-600">{status.error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-1/3" onClick={() => setOtpSent(false)}>
                  Edit email
                </Button>
                <Button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white" disabled={status.verifying}>
                  {status.verifying ? 'Verifying...' : 'Verify & continue'}
                </Button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs uppercase text-slate-400">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={handleDemo}
          >
            Continue as Demo User
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
