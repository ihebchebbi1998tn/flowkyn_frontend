import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ComingSoon() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (password === 'Flowkyn2026') {
        localStorage.setItem('flowkyn_early_access', 'granted');
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
      setIsLoading(false);
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
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-8 sm:p-12 relative overflow-hidden group">
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Logo/Icon Area */}
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500"
            >
              <ShieldCheck className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </motion.div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                Coming Soon
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
                We are crafting something extraordinary. Enter password to access the preview.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary z-10" />
                <Input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-12 bg-background/50 border-white/10 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl transition-all"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all font-medium text-base group/btn overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? 'Verifying...' : 'Unlock Early Access'}
                  {!isLoading && (
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  )}
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </Button>
            </form>
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
