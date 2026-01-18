import type { CommandSuggestion, CommandCategory, ViewCommand } from '@/types/command';

// View commands that are always deterministic
export const VIEW_COMMANDS: CommandSuggestion[] = [
  {
    id: 'view-today',
    label: 'Today',
    description: 'View today\'s priorities and urgent items',
    icon: 'calendar',
    command: { kind: 'view', command: 'VIEW:TODAY' },
    keywords: ['today', 'now', 'current', 'priorities'],
  },
  {
    id: 'view-week',
    label: 'This Week',
    description: 'View this week\'s pipeline and meetings',
    icon: 'calendar-days',
    command: { kind: 'view', command: 'VIEW:WEEK' },
    keywords: ['week', 'horizon', 'weekly', 'upcoming'],
  },
  {
    id: 'view-pipeline',
    label: 'Pipeline',
    description: 'View deals kanban board',
    icon: 'kanban',
    command: { kind: 'view', command: 'VIEW:PIPELINE' },
    keywords: ['pipeline', 'kanban', 'deals', 'board', 'stages'],
  },
  {
    id: 'view-quarter',
    label: 'Quarter View',
    description: 'View quarterly forecast and trends',
    icon: 'chart-line',
    command: { kind: 'view', command: 'VIEW:QUARTER' },
    keywords: ['quarter', 'landscape', 'forecast', 'trends', 'quarterly'],
  },
  {
    id: 'view-contacts',
    label: 'Contacts',
    description: 'View all contacts',
    icon: 'users',
    command: { kind: 'view', command: 'VIEW:CONTACTS' },
    keywords: ['contacts', 'people', 'customers', 'leads'],
  },
  {
    id: 'view-activities',
    label: 'Activities',
    description: 'View recent activities and timeline',
    icon: 'activity',
    command: { kind: 'view', command: 'VIEW:ACTIVITIES' },
    keywords: ['activities', 'timeline', 'history', 'events'],
  },
  {
    id: 'view-settings',
    label: 'Settings',
    description: 'Open settings',
    icon: 'settings',
    command: { kind: 'view', command: 'VIEW:SETTINGS' },
    keywords: ['settings', 'preferences', 'config'],
  },
];

export const ACTION_COMMANDS: CommandSuggestion[] = [
  {
    id: 'create-deal',
    label: 'New Deal',
    description: 'Create a new deal',
    icon: 'plus-circle',
    command: { kind: 'action', command: { type: 'CREATE:DEAL' } },
    keywords: ['new', 'create', 'add', 'deal'],
  },
  {
    id: 'create-contact',
    label: 'New Contact',
    description: 'Create a new contact',
    icon: 'user-plus',
    command: { kind: 'action', command: { type: 'CREATE:CONTACT' } },
    keywords: ['new', 'create', 'add', 'contact', 'person'],
  },
  {
    id: 'create-task',
    label: 'New Task',
    description: 'Create a new task',
    icon: 'check-square',
    command: { kind: 'action', command: { type: 'CREATE:TASK' } },
    keywords: ['new', 'create', 'add', 'task', 'todo'],
  },
];

export const COMMAND_CATEGORIES: CommandCategory[] = [
  { name: 'Views', commands: VIEW_COMMANDS },
  { name: 'Actions', commands: ACTION_COMMANDS },
];

// Match a query against commands locally (before falling back to AI)
export function matchCommands(query: string): CommandSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [...VIEW_COMMANDS.slice(0, 4), ...ACTION_COMMANDS.slice(0, 2)];
  }

  const allCommands = [...VIEW_COMMANDS, ...ACTION_COMMANDS];

  return allCommands.filter((cmd) => {
    const labelMatch = cmd.label.toLowerCase().includes(normalizedQuery);
    const keywordMatch = cmd.keywords.some((kw) =>
      kw.includes(normalizedQuery)
    );
    const descMatch = cmd.description?.toLowerCase().includes(normalizedQuery);

    return labelMatch || keywordMatch || descMatch;
  });
}

// Check if query might be a report request (needs AI)
export function isReportQuery(query: string): boolean {
  const reportIndicators = [
    'show me',
    'report',
    'analyze',
    'compare',
    'trend',
    'breakdown',
    'summary',
    'how many',
    'what is',
    'performance',
    'health',
    'status',
  ];

  const normalizedQuery = query.toLowerCase();
  return reportIndicators.some((indicator) =>
    normalizedQuery.includes(indicator)
  );
}

// Map view command to zoom level
export function getZoomFromCommand(command: ViewCommand): 'now' | 'horizon' | 'landscape' | null {
  switch (command) {
    case 'VIEW:TODAY':
      return 'now';
    case 'VIEW:WEEK':
      return 'horizon';
    case 'VIEW:QUARTER':
    case 'VIEW:PIPELINE':
    case 'VIEW:CONTACTS':
    case 'VIEW:ACTIVITIES':
      return 'landscape';
    default:
      return null;
  }
}
