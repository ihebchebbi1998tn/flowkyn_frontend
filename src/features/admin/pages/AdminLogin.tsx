/**
 * Admin Login page — authenticates against the real backend (api.flowkyn.com).
 * 
 * Default credentials (seeded by backend):
 *   Email:    support@flowkyn.com
 *   Password: Flowkyn2026
 * 
 * Only super-admin emails can access /admin/* endpoints after login.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { ArrowRight, Shield, Lock } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ADMIN_ROUTES.DASHBOARD;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err?.message || err?.error || 'Login failed';
      if (message.includes('suspended')) {
        setError('This account has been suspended.');
      } else if (message.includes('verify')) {
        setError('Please verify your email first.');
      } else {
        setError('Invalid credentials. Only Flowkyn admins can access this panel.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10 overflow-hidden" style={{ background: 'hsl(var(--auth-panel))' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--auth-panel-foreground)) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, hsl(var(--destructive)), transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Flowkyn" className="h-10 w-10 object-contain brightness-0 invert" />
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">Admin</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-[30px] font-bold leading-[1.2] tracking-[-0.01em]" style={{ color: 'hsl(var(--auth-panel-foreground))' }}>
              Flowkyn<br />Admin Panel
            </h2>
            <p className="text-[15px] max-w-[360px] leading-[1.7]" style={{ color: 'hsl(var(--auth-panel-foreground) / 0.5)' }}>
              Internal dashboard for managing the Flowkyn platform. Authorized personnel only.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { icon: Shield, text: 'Super-admin access only' },
                { icon: Lock, text: 'All actions are audit-logged' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / 0.15)' }}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: 'hsl(var(--auth-panel-foreground) / 0.5)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px]" style={{ color: 'hsl(var(--auth-panel-foreground) / 0.2)' }}>© 2026 Flowkyn. Internal use only.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-[380px] space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <img src={logoImg} alt="Flowkyn" className="h-9 w-9 object-contain" />
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Admin</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
            <p className="text-[13px] text-muted-foreground">Sign in to the Flowkyn admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <Input id="email" type="email" placeholder="support@flowkyn.com" value={email}
                onChange={e => setEmail(e.target.value)} className="h-10 text-[13px]" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px]">Password</Label>
              <PasswordInput id="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} className="h-10 text-[13px]" />
            </div>

            <LoadingButton type="submit" loading={isLoading} className="w-full h-10 text-[13px] gap-2 rounded-lg">
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </LoadingButton>
          </form>
        </div>
      </div>
    </div>
  );
}
