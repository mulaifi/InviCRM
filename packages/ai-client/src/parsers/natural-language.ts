import { AIClient } from '../client';

export type QueryIntent =
  | 'contact_lookup'
  | 'company_lookup'
  | 'deal_status'
  | 'deals_list'
  | 'activity_log'
  | 'reminder_create'
  | 'task_create'
  | 'relationship_status'
  | 'pipeline_overview'
  | 'unknown';

export interface ParsedQuery {
  intent: QueryIntent;
  entities: {
    contactName?: string;
    companyName?: string;
    dealName?: string;
    timeframe?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    activityType?: string;
  };
  originalText: string;
  confidence: number;
}

export interface ParsedActivityLog {
  type: 'call' | 'meeting' | 'note';
  contactName?: string;
  subject: string;
  notes?: string;
  duration?: number;
  confidence: number;
}

const QUERY_PARSER_PROMPT = `You are an AI assistant that parses natural language CRM queries.
Convert user queries into structured commands.

Supported intents:
- contact_lookup: "What's happening with John?", "Tell me about Sarah"
- company_lookup: "What's the status with ABC Corp?"
- deal_status: "Update on the Microsoft deal"
- deals_list: "Show my deals closing this month"
- activity_log: "Just had a call with Sarah about the proposal"
- reminder_create: "Remind me to follow up with John tomorrow"
- task_create: "Create a task to send proposal to ABC Corp"
- relationship_status: "Who haven't I contacted in 2 weeks?"
- pipeline_overview: "What's my pipeline looking like?"

For dates, parse relative terms:
- "tomorrow" -> next day's date
- "next week" -> 7 days from now
- "in 3 days" -> 3 days from now
- "next Tuesday" -> specific date

For GCC context, be aware of:
- Arabic names (handle transliterations)
- Local companies and naming conventions

Respond in JSON format only.`;

export class NaturalLanguageParser {
  constructor(private client: AIClient) {}

  async parseQuery(query: string): Promise<ParsedQuery> {
    const userMessage = `Parse this CRM query:

"${query}"

Return JSON with this structure:
{
  "intent": "contact_lookup|company_lookup|deal_status|deals_list|activity_log|reminder_create|task_create|relationship_status|pipeline_overview|unknown",
  "entities": {
    "contactName": "extracted name if mentioned",
    "companyName": "company name if mentioned",
    "dealName": "deal name if mentioned",
    "timeframe": "time period if mentioned (e.g., 'this month', '2 weeks')",
    "amount": 50000,
    "currency": "KWD",
    "dueDate": "YYYY-MM-DD",
    "activityType": "email|call|meeting"
  },
  "confidence": 0.0-1.0
}`;

    const result = await this.client.completeJSON<Omit<ParsedQuery, 'originalText'>>(
      QUERY_PARSER_PROMPT,
      userMessage,
    );

    return {
      intent: result?.intent || 'unknown',
      entities: result?.entities || {},
      originalText: query,
      confidence: result?.confidence || 0,
    };
  }

  async parseActivityLog(message: string): Promise<ParsedActivityLog | null> {
    const userMessage = `Parse this activity log message:

"${message}"

The user is logging an activity they just performed (call, meeting, or note).

Return JSON with this structure:
{
  "type": "call|meeting|note",
  "contactName": "who they talked to",
  "subject": "brief subject line",
  "notes": "any details mentioned",
  "duration": minutes (if mentioned),
  "confidence": 0.0-1.0
}`;

    return this.client.completeJSON<ParsedActivityLog>(
      QUERY_PARSER_PROMPT,
      userMessage,
    );
  }

  async generateResponse(
    query: ParsedQuery,
    context: Record<string, unknown>,
  ): Promise<string> {
    const systemPrompt = `You are a helpful CRM assistant. Generate a concise, friendly response based on the query and data provided.
Keep responses brief and actionable. Use bullet points for lists.
Format currency as KWD by default unless specified otherwise.
Format dates as "DD Month YYYY" (e.g., "15 January 2026").`;

    const userMessage = `Query: "${query.originalText}"
Intent: ${query.intent}
Extracted entities: ${JSON.stringify(query.entities)}

Context data:
${JSON.stringify(context, null, 2)}

Generate a helpful response for the user.`;

    return this.client.complete(systemPrompt, userMessage, { maxTokens: 500 });
  }
}
