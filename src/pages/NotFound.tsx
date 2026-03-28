import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import logoImg from '@/assets/flowkyn-logo.png';

const HEADING_FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";

export default function NotFound() {
  const location = useLocation();
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  // Subtle glitch effect on the 404 number
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Faded large 404 in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="text-[28vw] font-black text-foreground/[0.03] leading-none tracking-tighter"
          style={{ fontFamily: HEADING_FONT }}
        >
          404
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-lg relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <img src={logoImg} alt="Flowkyn" className="h-10 w-10 object-contain mx-auto opacity-40" />
        </motion.div>

        {/* 404 number with glitch */}
        <div className="relative mb-4">
          <h1
            className={`text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-foreground transition-all duration-75 ${
              glitchActive ? 'translate-x-[2px] skew-x-1' : ''
            }`}
            style={{ fontFamily: HEADING_FONT }}
          >
            4
            <span className={`inline-block transition-colors duration-75 ${glitchActive ? 'text-primary' : 'text-foreground'}`}>
              0
            </span>
            4
          </h1>
          {/* Glitch shadow layer */}
          {glitchActive && (
            <span
              className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-primary/20 -translate-x-1 translate-y-[1px] pointer-events-none"
              style={{ fontFamily: HEADING_FONT }}
              aria-hidden
            >
              404
            </span>
          )}
        </div>

        {/* Message */}
        <p className="text-[17px] font-semibold text-foreground mb-2" style={{ fontFamily: HEADING_FONT }}>
          Page not found
        </p>
        <p className="text-[14px] text-muted-foreground mb-2 max-w-sm mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved to a different location.
        </p>

        {/* Show attempted path */}
        <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-1.5 mb-8">
          <Search className="h-3 w-3 text-muted-foreground/60" />
          <code className="text-[11px] text-muted-foreground font-mono">{location.pathname}</code>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link to={ROUTES.HOME}>
            <Button className="h-11 px-6 text-[13px] font-semibold rounded-xl gap-2 bg-foreground text-background hover:bg-foreground/90">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-11 px-6 text-[13px] font-semibold rounded-xl"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
