import { Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/loading/PageSkeleton';
import logoImg from '@/assets/logo.png';

/**
 * Focused layout for game/event experiences.
 * No sidebar, no topbar — just a minimal branded header
 * with a back button and the game content.
 */
export function FocusedLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal branded bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Flowkyn" className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-foreground hidden sm:inline">Flowkyn</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gamepad2 className="h-4 w-4" />
              <span className="text-[11px] font-medium uppercase tracking-wider hidden sm:inline">Live Experience</span>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
