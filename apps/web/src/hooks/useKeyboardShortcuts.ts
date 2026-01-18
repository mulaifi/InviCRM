import { useEffect } from 'react';
import { useZoomStore } from '@/stores/zoomStore';
import { useCommandStore } from '@/stores/commandStore';

export function useKeyboardShortcuts() {
  const { setLevel, zoomIn, zoomOut } = useZoomStore();
  const { toggle: toggleCommand, isOpen: isCommandOpen } = useCommandStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to close command bar even in inputs
        if (e.key === 'Escape' && isCommandOpen) {
          useCommandStore.getState().close();
        }
        return;
      }

      // Command bar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommand();
        return;
      }

      // Zoom level shortcuts (Cmd+1/2/3)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setLevel('now');
            break;
          case '2':
            e.preventDefault();
            setLevel('horizon');
            break;
          case '3':
            e.preventDefault();
            setLevel('landscape');
            break;
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
        }
      }

      // Escape to close command bar
      if (e.key === 'Escape') {
        if (isCommandOpen) {
          useCommandStore.getState().close();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setLevel, zoomIn, zoomOut, toggleCommand, isCommandOpen]);
}
