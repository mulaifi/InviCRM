// Command types for the command bar

export type ViewCommand =
  | 'VIEW:PIPELINE'
  | 'VIEW:QUARTER'
  | 'VIEW:CONTACTS'
  | 'VIEW:TODAY'
  | 'VIEW:WEEK'
  | 'VIEW:ACTIVITIES'
  | 'VIEW:SETTINGS';

export type EntityCommand =
  | { type: 'VIEW:DEAL'; id: string }
  | { type: 'VIEW:CONTACT'; id: string }
  | { type: 'VIEW:COMPANY'; id: string };

export type ActionCommand =
  | { type: 'CREATE:DEAL' }
  | { type: 'CREATE:CONTACT' }
  | { type: 'CREATE:TASK' }
  | { type: 'SEARCH'; query: string };

export type ReportCommand = {
  type: 'REPORT';
  query: string;
};

export type CommandIntent =
  | { kind: 'view'; command: ViewCommand }
  | { kind: 'entity'; command: EntityCommand }
  | { kind: 'action'; command: ActionCommand }
  | { kind: 'report'; command: ReportCommand };

export interface CommandSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  command: CommandIntent;
  keywords: string[];
}

export interface CommandCategory {
  name: string;
  commands: CommandSuggestion[];
}
