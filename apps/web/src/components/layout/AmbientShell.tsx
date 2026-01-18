import { type ReactNode } from 'react';
import { Command, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useZoomStore, selectZoomLabel } from '@/stores/zoomStore';
import { useCommandStore } from '@/stores/commandStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface AmbientShellProps {
  children: ReactNode;
  showZoomControls?: boolean;
  title?: string;
  showBackButton?: boolean;
}

export function AmbientShell({
  children,
  showZoomControls = true,
  title,
  showBackButton = false,
}: AmbientShellProps) {
  const navigate = useNavigate();
  const { level, setLevel } = useZoomStore();
  const { open: openCommand } = useCommandStore();
  const logout = useAuthStore((state) => state.logout);

  const zoomLevels = ['now', 'horizon', 'landscape'] as const;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col safe-area-inset">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-bg-tertiary/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo / Back button */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:block">Dashboard</span>
              </button>
            ) : (
              <>
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">IC</span>
                </div>
                <span className="text-text-primary font-medium hidden sm:block">
                  InviCRM
                </span>
              </>
            )}
          </div>

          {/* Center: Zoom indicator or Page title */}
          {showZoomControls ? (
            <div className="flex items-center gap-1 bg-bg-secondary rounded-full p-1">
              {zoomLevels.map((z) => (
                <button
                  key={z}
                  onClick={() => setLevel(z)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    level === z
                      ? 'bg-bg-primary text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {selectZoomLabel(z)}
                </button>
              ))}
            </div>
          ) : title ? (
            <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          ) : (
            <div />
          )}

          {/* Command trigger and logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={openCommand}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
            >
              <Command className="h-4 w-4" />
              <span className="text-sm hidden sm:block">Command</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-tertiary text-xs text-text-muted">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 h-full">{children}</div>
      </main>
    </div>
  );
}
