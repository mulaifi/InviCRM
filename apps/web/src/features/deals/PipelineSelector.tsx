import { ChevronDown, LayoutGrid } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Pipeline } from '@/types';

export interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipelineId: string | undefined;
  onSelect: (pipelineId: string) => void;
  isLoading?: boolean;
}

export function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onSelect,
  isLoading = false,
}: PipelineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pipelines.length <= 1) {
    // Single pipeline, just show the name
    return (
      <div className="flex items-center gap-2 text-text-primary">
        <LayoutGrid className="h-4 w-4 text-text-muted" />
        <span className="font-medium">
          {selectedPipeline?.name || 'Pipeline'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-bg-secondary hover:bg-bg-tertiary',
          'border border-bg-tertiary',
          'text-text-primary font-medium text-sm',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-accent/50',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <LayoutGrid className="h-4 w-4 text-text-muted" />
        <span>{selectedPipeline?.name || 'Select Pipeline'}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-text-muted transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 z-50',
            'min-w-[200px] py-1',
            'bg-bg-primary border border-bg-tertiary rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
        >
          {pipelines.map((pipeline) => (
            <button
              key={pipeline.id}
              type="button"
              onClick={() => {
                onSelect(pipeline.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-bg-secondary transition-colors',
                pipeline.id === selectedPipelineId
                  ? 'text-accent font-medium'
                  : 'text-text-primary'
              )}
            >
              <div className="flex items-center justify-between">
                <span>{pipeline.name}</span>
                {pipeline.isDefault && (
                  <span className="text-xs text-text-muted">Default</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
