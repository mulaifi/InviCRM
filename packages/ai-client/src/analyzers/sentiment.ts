import { AIClient } from '../client';

export type Sentiment = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1.0 to 1.0
  confidence: number;
  reasoning: string;
  buyingSignals: string[];
  riskIndicators: string[];
}

const SENTIMENT_PROMPT = `You are an AI assistant that analyzes sentiment in business communications.
Focus on B2B sales context and look for:

Positive indicators:
- Interest in pricing, proposals
- Questions about implementation timeline
- References to budget availability
- Positive language about the product/service
- Engagement with features/benefits
- Mentions of urgency or need

Negative indicators:
- Price concerns or budget issues
- Mentions of competitors
- Delays or postponements
- Lack of response or engagement
- Objections or concerns raised
- Request for more time

Be culturally aware for GCC business context:
- Relationship-building language is common
- Indirect communication style
- Importance of formality and respect

Respond in JSON format only.`;

export class SentimentAnalyzer {
  constructor(private client: AIClient) {}

  async analyzeCommunication(text: string, context?: string): Promise<SentimentResult> {
    const userMessage = `Analyze the sentiment of this business communication:

${context ? `Context: ${context}\n\n` : ''}
Text:
${text}

Return JSON with this structure:
{
  "sentiment": "very_positive|positive|neutral|negative|very_negative",
  "score": -1.0 to 1.0,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "buyingSignals": ["list of positive buying signals if any"],
  "riskIndicators": ["list of risk indicators if any"]
}`;

    const result = await this.client.completeJSON<SentimentResult>(
      SENTIMENT_PROMPT,
      userMessage,
    );

    return (
      result || {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        reasoning: 'Unable to analyze sentiment',
        buyingSignals: [],
        riskIndicators: [],
      }
    );
  }

  async analyzeEmailThread(emails: { subject: string; body: string; direction: 'inbound' | 'outbound' }[]): Promise<{
    overallSentiment: Sentiment;
    trend: 'improving' | 'stable' | 'declining';
    summary: string;
  }> {
    const userMessage = `Analyze the sentiment trend in this email thread:

${emails.map((e, i) => `
Email ${i + 1} (${e.direction}):
Subject: ${e.subject}
Body: ${e.body}
`).join('\n---\n')}

Return JSON with this structure:
{
  "overallSentiment": "very_positive|positive|neutral|negative|very_negative",
  "trend": "improving|stable|declining",
  "summary": "brief summary of the relationship/deal status"
}`;

    const result = await this.client.completeJSON<{
      overallSentiment: Sentiment;
      trend: 'improving' | 'stable' | 'declining';
      summary: string;
    }>(SENTIMENT_PROMPT, userMessage);

    return (
      result || {
        overallSentiment: 'neutral',
        trend: 'stable',
        summary: 'Unable to analyze thread',
      }
    );
  }
}
