import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { PageSkeleton } from '@/components/loading/PageSkeleton';
import { AppJoyride } from '../components/tour/AppJoyride';

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppJoyride />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-5 py-2 sm:py-4">
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
