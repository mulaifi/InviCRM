import { useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  TrendingUp,
  Users,
  Activity,
  Settings,
  PlusCircle,
  UserPlus,
  CheckSquare,
  Search,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCommandStore } from '@/stores/commandStore';
import { useZoomStore } from '@/stores/zoomStore';
import { useCommandParser } from './useCommandParser';
import { getZoomFromCommand, COMMAND_CATEGORIES } from './command-registry';
import type { CommandIntent, ViewCommand } from '@/types/command';
import { cn } from '@/lib/utils';

const ICONS: Record<string, typeof Calendar> = {
  calendar: Calendar,
  'calendar-days': CalendarDays,
  kanban: LayoutGrid,
  'chart-line': TrendingUp,
  users: Users,
  activity: Activity,
  settings: Settings,
  'plus-circle': PlusCircle,
  'user-plus': UserPlus,
  'check-square': CheckSquare,
};

export function CommandBar() {
  const navigate = useNavigate();
  const { isOpen, query, isProcessing, close, setQuery, setProcessing } =
    useCommandStore();
  const { setLevel } = useZoomStore();
  const { suggestions, needsAI, isReportRequest } = useCommandParser(query);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useCommandStore.getState().toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    async (intent: CommandIntent) => {
      if (intent.kind === 'view') {
        const zoom = getZoomFromCommand(intent.command as ViewCommand);
        if (zoom) {
          setLevel(zoom);
        }

        // Navigate based on view
        switch (intent.command) {
          case 'VIEW:CONTACTS':
            navigate('/contacts');
            break;
          case 'VIEW:ACTIVITIES':
            navigate('/activities');
            break;
          case 'VIEW:SETTINGS':
            navigate('/settings');
            break;
          default:
            navigate('/');
        }
        close();
      } else if (intent.kind === 'action') {
        switch (intent.command.type) {
          case 'CREATE:DEAL':
            navigate('/deals/new');
            break;
          case 'CREATE:CONTACT':
            navigate('/contacts/new');
            break;
          case 'CREATE:TASK':
            navigate('/tasks/new');
            break;
        }
        close();
      } else if (intent.kind === 'report') {
        // Handle report generation
        setProcessing(true);
        // AI will generate report - for now just close
        close();
        setProcessing(false);
      }
    },
    [navigate, setLevel, close, setProcessing]
  );

  const handleAISubmit = useCallback(async () => {
    if (!query.trim() || isProcessing) return;

    setProcessing(true);
    // In production, this would call the AI endpoint
    // For now, just simulate and close
    setTimeout(() => {
      setProcessing(false);
      close();
    }, 1000);
  }, [query, isProcessing, setProcessing, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="command-overlay"
            onClick={close}
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <Command
              className="bg-bg-primary border border-bg-tertiary rounded-xl shadow-2xl overflow-hidden"
              loop
            >
              <div className="flex items-center gap-2 px-4 border-b border-bg-tertiary">
                <Search className="h-4 w-4 text-text-muted" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Type a command or ask a question..."
                  className="flex-1 h-12 bg-transparent text-text-primary placeholder:text-text-muted outline-none"
                />
                {isProcessing && (
                  <Loader2 className="h-4 w-4 text-accent animate-spin" />
                )}
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto scrollbar-subtle p-2">
                <Command.Empty className="py-6 text-center text-text-secondary">
                  {needsAI ? (
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <p>
                        {isReportRequest
                          ? 'Press Enter to generate report'
                          : 'Press Enter to search with AI'}
                      </p>
                    </div>
                  ) : (
                    'No results found.'
                  )}
                </Command.Empty>

                {COMMAND_CATEGORIES.map((category) => {
                  const categoryCommands = suggestions.filter((s) =>
                    category.commands.some((c) => c.id === s.id)
                  );

                  if (categoryCommands.length === 0) return null;

                  return (
                    <Command.Group
                      key={category.name}
                      heading={category.name}
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:font-medium"
                    >
                      {categoryCommands.map((suggestion) => {
                        const Icon = ICONS[suggestion.icon || 'activity'] || Activity;

                        return (
                          <Command.Item
                            key={suggestion.id}
                            value={suggestion.label}
                            onSelect={() => handleSelect(suggestion.command)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
                              'text-text-primary',
                              'data-[selected=true]:bg-accent-muted',
                              'transition-colors'
                            )}
                          >
                            <Icon className="h-4 w-4 text-text-secondary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {suggestion.label}
                              </p>
                              {suggestion.description && (
                                <p className="text-xs text-text-secondary">
                                  {suggestion.description}
                                </p>
                              )}
                            </div>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}

                {/* AI action hint */}
                {needsAI && query.trim() && (
                  <div className="border-t border-bg-tertiary mt-2 pt-2">
                    <Command.Item
                      value="ai-search"
                      onSelect={handleAISubmit}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
                        'text-accent',
                        'data-[selected=true]:bg-accent-muted',
                        'transition-colors'
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {isReportRequest
                            ? `Generate report: "${query}"`
                            : `Ask AI: "${query}"`}
                        </p>
                      </div>
                    </Command.Item>
                  </div>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-bg-tertiary text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">esc</kbd>
                  close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
