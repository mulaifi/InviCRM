import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import { useZoomStore, selectZoomScale, type ZoomLevel } from '@/stores/zoomStore';

interface ZoomContainerProps {
  children: ReactNode;
}

export function ZoomContainer({ children }: ZoomContainerProps) {
  const { level, isTransitioning } = useZoomStore();
  const scale = selectZoomScale(level);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="w-full h-full"
        animate={{
          scale,
          opacity: isTransitioning ? 0.9 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transformOrigin: 'center center',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface ZoomViewProps {
  level: ZoomLevel;
  children: ReactNode;
}

export function ZoomView({ level, children }: ZoomViewProps) {
  const currentLevel = useZoomStore((state) => state.level);
  const isActive = currentLevel === level;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={level}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
