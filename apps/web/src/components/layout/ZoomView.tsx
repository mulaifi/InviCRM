import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import { useZoomStore, type ZoomLevel } from '@/stores/zoomStore';

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
