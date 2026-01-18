import { type ReactNode } from 'react';
import { Command } from 'lucide-react';
import { useZoomStore, selectZoomLabel } from '@/stores/zoomStore';
import { useCommandStore } from '@/stores/commandStore';
import { cn } from '@/lib/utils';

interface AmbientShellProps {
  children: ReactNode;
}

export function AmbientShell({ children }: AmbientShellProps) {
  const { level, setLevel } = useZoomStore();
  const { open: openCommand } = useCommandStore();

  const zoomLevels = ['now', 'horizon', 'landscape'] as const;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-bg-tertiary/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-semibold text-sm">IC</span>
            </div>
            <span className="text-text-primary font-medium hidden sm:block">
              InviCRM
            </span>
          </div>

          {/* Zoom indicator */}
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

          {/* Command trigger */}
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 h-full">{children}</div>
      </main>
    </div>
  );
}
