import { AIClient } from '../client';

export interface ExtractedContact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  confidence: number;
}

export interface ExtractedDealInfo {
  amount?: number;
  currency?: string;
  deadline?: string;
  productOrService?: string;
  confidence: number;
}

export interface ExtractedActionItem {
  action: string;
  assignee?: string;
  deadline?: string;
  confidence: number;
}

export interface ExtractedEntities {
  contacts: ExtractedContact[];
  dealInfo?: ExtractedDealInfo;
  actionItems: ExtractedActionItem[];
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that extracts structured information from business communication.
Your task is to identify and extract:
1. Contact information (names, emails, phones, titles, companies)
2. Deal-related information (amounts, currencies, deadlines)
3. Action items and commitments
4. Overall sentiment

Be conservative with confidence scores:
- 0.9-1.0: Explicitly stated in text
- 0.7-0.9: Strongly implied
- 0.5-0.7: Inferred with some uncertainty
- Below 0.5: Don't include

For GCC region, watch for:
- Arabic names (extract both Arabic and Latin scripts if present)
- Phone formats: +965, +971, +966, etc.
- Currencies: KWD, AED, SAR, USD

Respond in JSON format only.`;

export class EntityExtractor {
  constructor(private client: AIClient) {}

  async extractFromEmail(
    subject: string,
    body: string,
    signature?: string,
  ): Promise<ExtractedEntities> {
    const userMessage = `Extract entities from this email:

Subject: ${subject}

Body:
${body}

${signature ? `Signature:\n${signature}` : ''}

Return JSON with this structure:
{
  "contacts": [
    {
      "name": "full name",
      "firstName": "first",
      "lastName": "last",
      "email": "email@example.com",
      "phone": "+XXX-XXXX-XXXX",
      "title": "job title",
      "company": "company name",
      "confidence": 0.0-1.0
    }
  ],
  "dealInfo": {
    "amount": 50000,
    "currency": "KWD",
    "deadline": "YYYY-MM-DD",
    "productOrService": "description",
    "confidence": 0.0-1.0
  },
  "actionItems": [
    {
      "action": "what needs to be done",
      "assignee": "who should do it",
      "deadline": "when",
      "confidence": 0.0-1.0
    }
  ],
  "sentiment": "positive|neutral|negative",
  "summary": "one sentence summary"
}`;

    const result = await this.client.completeJSON<ExtractedEntities>(
      SYSTEM_PROMPT,
      userMessage,
      { maxTokens: 2000 },
    );

    return (
      result || {
        contacts: [],
        actionItems: [],
        sentiment: 'neutral',
        summary: 'Unable to extract information',
      }
    );
  }

  async extractFromSignature(signature: string): Promise<ExtractedContact | null> {
    const userMessage = `Extract contact information from this email signature:

${signature}

Return JSON with this structure:
{
  "name": "full name",
  "firstName": "first",
  "lastName": "last",
  "email": "email@example.com",
  "phone": "+XXX-XXXX-XXXX",
  "title": "job title",
  "company": "company name",
  "confidence": 0.0-1.0
}`;

    return this.client.completeJSON<ExtractedContact>(SYSTEM_PROMPT, userMessage);
  }

  async extractFromMeetingNotes(notes: string): Promise<ExtractedEntities> {
    const userMessage = `Extract entities from these meeting notes:

${notes}

Return JSON with this structure:
{
  "contacts": [...],
  "dealInfo": {...},
  "actionItems": [...],
  "sentiment": "positive|neutral|negative",
  "summary": "one sentence summary"
}`;

    const result = await this.client.completeJSON<ExtractedEntities>(
      SYSTEM_PROMPT,
      userMessage,
      { maxTokens: 2000 },
    );

    return (
      result || {
        contacts: [],
        actionItems: [],
        sentiment: 'neutral',
        summary: 'Unable to extract information',
      }
    );
  }
}
