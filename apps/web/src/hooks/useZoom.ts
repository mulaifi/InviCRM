import { useCallback, useEffect, useRef } from 'react';
import { useZoomStore } from '@/stores/zoomStore';

interface UseZoomOptions {
  enableGestures?: boolean;
}

export function useZoom(options: UseZoomOptions = {}) {
  const { enableGestures = true } = options;
  const { level, setLevel, zoomIn, zoomOut, isTransitioning } = useZoomStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchY = useRef<number | null>(null);

  // Handle wheel/scroll to zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!enableGestures || isTransitioning) return;

      // Only zoom with ctrl/cmd key held
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    },
    [enableGestures, isTransitioning, zoomIn, zoomOut]
  );

  // Handle touch gestures (pinch to zoom)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      lastTouchY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enableGestures || isTransitioning) return;
      if (e.touches.length !== 2) return;

      // Simple two-finger swipe detection
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (!touch1 || !touch2) return;
      const avgY = (touch1.clientY + touch2.clientY) / 2;

      if (lastTouchY.current !== null) {
        const deltaY = avgY - lastTouchY.current;
        if (Math.abs(deltaY) > 50) {
          if (deltaY > 0) {
            zoomOut();
          } else {
            zoomIn();
          }
          lastTouchY.current = avgY;
        }
      } else {
        lastTouchY.current = avgY;
      }
    },
    [enableGestures, isTransitioning, zoomIn, zoomOut]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchY.current = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    level,
    setLevel,
    zoomIn,
    zoomOut,
    isTransitioning,
    containerRef,
  };
}
