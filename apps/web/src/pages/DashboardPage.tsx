import { AnimatePresence } from 'framer-motion';
import { AmbientShell, ZoomView } from '@/components/layout';
import { CommandBar } from '@/features/command-bar';
import { NowView, HorizonView, LandscapeView } from '@/features/zoom-views';
import { ReportCanvas } from '@/features/report-builder';
import { useKeyboardShortcuts, useZoom } from '@/hooks';
import { useZoomStore } from '@/stores/zoomStore';
import { useCommandStore } from '@/stores/commandStore';

export function DashboardPage() {
  useKeyboardShortcuts();
  const { containerRef } = useZoom();
  const level = useZoomStore((state) => state.level);
  const activeReport = useCommandStore((state) => state.activeReport);
  const setReport = useCommandStore((state) => state.setReport);

  return (
    <>
      <AmbientShell>
        <div ref={containerRef} className="h-full">
          {/* Active Report Display */}
          {activeReport ? (
            <ReportCanvas
              report={activeReport}
              onClose={() => setReport(null)}
            />
          ) : (
            <AnimatePresence mode="wait">
              {level === 'now' && (
                <ZoomView level="now">
                  <NowView />
                </ZoomView>
              )}
              {level === 'horizon' && (
                <ZoomView level="horizon">
                  <HorizonView />
                </ZoomView>
              )}
              {level === 'landscape' && (
                <ZoomView level="landscape">
                  <LandscapeView />
                </ZoomView>
              )}
            </AnimatePresence>
          )}
        </div>
      </AmbientShell>

      {/* Command Bar - always rendered, shown/hidden via state */}
      <CommandBar />
    </>
  );
}
