import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto bg-flash-white/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
