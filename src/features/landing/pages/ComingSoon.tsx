import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, Mail, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';
import { earlyAccessApi } from '../api/earlyAccess';

export default function ComingSoon() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('Missing information', {
        description: 'Please fill in your name and email to join the early access list.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await earlyAccessApi.submit({ firstName, lastName, email, companyName });
      toast.success('You are on the list', {
        description: 'We will reach out as soon as Flowkyn early access is ready.',
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setCompanyName('');
    } catch (err: any) {
      const description = err?.message || 'Something went wrong while submitting your request.';
      toast.error('Could not submit', { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsVerifyingPassword(true);

    setTimeout(() => {
      if (password === 'Flowkyn2026') {
        // Session-only unlock: require password again next visit/session
        sessionStorage.setItem('flowkyn_early_access', 'granted');
        // Clean up any old persistent flag from previous versions
        localStorage.removeItem('flowkyn_early_access');
        toast.success('Access Granted', {
          description: 'Welcome to Flowkyn early access.',
        });
        window.location.reload(); // Reload to re-evaluate the guard
      } else {
        toast.error('Access Denied', {
          description: 'Incorrect password. Please try again.',
        });
        setPassword('');
      }
      setIsVerifyingPassword(false);
    }, 600); // Small artificial delay for effect
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen pointer-events-none"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg mx-auto"
      >
        <div className="bg-card/60 backdrop-blur-2xl border border-border/60 shadow-2xl rounded-3xl p-7 sm:p-9 relative overflow-hidden group">

          {/* Top Edge Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

          <div className="flex flex-col items-center text-center space-y-6">

            {/* Logo / Secret access trigger */}
            <motion.button
              type="button"
              onClick={() => setShowPassword(true)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
            >
              <img
                src={logoImg}
                alt="Flowkyn"
                className="h-8 sm:h-9 object-contain"
              />
            </motion.button>

            {/* Typography */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                Get early access to Flowkyn
              </h1>
              <p className="text-sm sm:text-[15px] text-muted-foreground font-medium max-w-[420px] mx-auto leading-relaxed">
                Flowkyn helps distributed teams run structured connection rituals that are measurable, repeatable, and easy to facilitate.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-[11px] sm:text-[12px] text-muted-foreground/90 w-full max-w-[460px] mx-auto">
                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left">
                  <p className="font-semibold text-foreground text-[11px] sm:text-[12px]">Team rituals, productized</p>
                  <p className="mt-1 leading-snug">Curated formats instead of ad‑hoc icebreakers.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left">
                  <p className="font-semibold text-foreground text-[11px] sm:text-[12px]">Measurable engagement</p>
                  <p className="mt-1 leading-snug">Track participation and sentiment over time.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left">
                  <p className="font-semibold text-foreground text-[11px] sm:text-[12px]">Built for remote teams</p>
                  <p className="mt-1 leading-snug">Works across time zones and team sizes.</p>
                </div>
              </div>
            </div>

            {/* Early access form */}
            <form onSubmit={handleEarlyAccessSubmit} className="w-full space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative group/input">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 h-10 bg-background/50 border-white/10 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl text-sm"
                  />
                </div>
                <div className="relative group/input">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 h-10 bg-background/50 border-white/10 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                <Input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10 h-10 bg-background/50 border-white/10 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl text-sm"
                />
              </div>

              <div className="relative group/input">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                <Input
                  type="text"
                  placeholder="Company name (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10 h-10 bg-background/50 border-white/10 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !firstName || !lastName || !email}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_18px_rgba(var(--primary),0.3)] hover:shadow-[0_0_22px_rgba(var(--primary),0.5)] transition-all font-medium text-sm group/btn overflow-hidden relative mt-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? 'Joining…' : 'Join early access'}
                  {!isSubmitting && (
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Button>

              <p className="text-[11px] text-muted-foreground/70 mt-1">
                No spam. Just a short note when Flowkyn is ready for your team.
              </p>
            </form>

            {/* Hidden password gate for internal access */}
            {showPassword && (
              <form onSubmit={handlePasswordSubmit} className="w-full space-y-3 pt-3 border-t border-white/10 mt-3 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground/80">
                    Team access code
                  </p>
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isVerifyingPassword}
                    className="pl-10 h-10 bg-background/60 border-white/15 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isVerifyingPassword || !password}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-xs border-white/20 hover:border-primary/40"
                >
                  {isVerifyingPassword ? 'Verifying…' : 'Unlock preview'}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Brand */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest">
            © 2026 Flowkyn
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
