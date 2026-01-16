export const ACTIVITY_TYPES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
} as const;

export const ACTIVITY_SOURCES = {
  MANUAL: 'manual',
  GMAIL_SYNC: 'gmail_sync',
  CALENDAR_SYNC: 'calendar_sync',
  WHATSAPP_EXTENSION: 'whatsapp_extension',
  SLACK: 'slack',
  API: 'api',
} as const;

export const ACTIVITY_DIRECTIONS = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  call: 'Phone Call',
  meeting: 'Meeting',
  note: 'Note',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  email: 'mail',
  call: 'phone',
  meeting: 'calendar',
  note: 'file-text',
  whatsapp: 'message-circle',
  sms: 'smartphone',
};
