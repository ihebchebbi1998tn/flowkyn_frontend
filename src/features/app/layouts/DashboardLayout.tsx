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
          <main className="flex-1 overflow-auto bg-background">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 animate-fade-in">
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