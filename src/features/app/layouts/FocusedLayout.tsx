import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2 } from 'lucide-react';
import { PageSkeleton } from '@/components/loading/PageSkeleton';
import { LanguageSelector } from '@/components/common';

/**
 * Focused layout for game/event experiences.
 * No sidebar, no topbar — just a minimal branded header
 * with a back button and the game content.
 */
export function FocusedLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal branded bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-end px-4 sm:px-6 h-14 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider hidden sm:inline">{t('layout.liveExperience')}</span>
          </div>
            <LanguageSelector align="end" />
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
