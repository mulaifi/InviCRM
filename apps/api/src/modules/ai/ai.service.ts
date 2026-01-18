import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIClient, NaturalLanguageParser, type ParsedQuery, type AIProvider } from '@invicrm/ai-client';
import { ReportSpec, ReportComponent } from './dto/report.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiClient: AIClient;
  private readonly nlParser: NaturalLanguageParser;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('ai.provider', 'ollama') as AIProvider;
    const apiKey = this.configService.get<string>('ai.apiKey');
    const baseUrl = this.configService.get<string>('ai.baseUrl');
    const model = this.configService.get<string>('ai.model');

    this.logger.log(`Initializing AI client with provider: ${provider}, model: ${model}`);

    this.aiClient = new AIClient({
      provider,
      apiKey,
      baseUrl,
      model,
    });

    this.nlParser = new NaturalLanguageParser(this.aiClient);
  }

  async parseQuery(query: string): Promise<ParsedQuery> {
    this.logger.debug(`Parsing query: "${query}"`);

    try {
      const result = await this.nlParser.parseQuery(query);
      this.logger.debug(`Parsed result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to parse query: ${error}`);
      return {
        intent: 'unknown',
        entities: {},
        originalText: query,
        confidence: 0,
      };
    }
  }

  async generateResponse(query: ParsedQuery, context: Record<string, unknown>): Promise<string> {
    try {
      return await this.nlParser.generateResponse(query, context);
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error}`);
      return 'Sorry, I could not process that request.';
    }
  }

  async generateReport(query: string, analyticsData: {
    pipelineHealth?: { total: number; weighted: number; averageDealSize: number };
    dealsByStage?: Array<{ stage: string; count: number; value: number }>;
    trends?: Array<{ date: string; newDeals: number; closedValue: number }>;
    weeklyMetrics?: { newDeals: number; closedWon: number; closedLost: number; totalValue: number };
  }): Promise<ReportSpec> {
    const reportId = `report-${Date.now()}`;

    try {
      // Use AI to determine the best components for the query
      const systemPrompt = `You are an AI assistant that generates CRM report specifications.
Based on the user's query and available data, suggest which report components would be most useful.

Available component types:
- metric_card: For single values (pipeline total, win rate, deal count)
- bar_chart: For comparing categories (deals by stage, rep performance)
- pie_chart: For showing distribution (deal types, sources)
- trend_line: For showing changes over time
- funnel: For conversion/stage progression
- table: For detailed data
- list: For ranked items

Respond with a JSON array of component suggestions.`;

      const userMessage = `Query: "${query}"

Available data:
- Pipeline: ${analyticsData.pipelineHealth ? `Total: ${analyticsData.pipelineHealth.total}, Weighted: ${analyticsData.pipelineHealth.weighted}, Avg Deal: ${analyticsData.pipelineHealth.averageDealSize}` : 'Not available'}
- Deals by Stage: ${analyticsData.dealsByStage ? JSON.stringify(analyticsData.dealsByStage) : 'Not available'}
- Trends: ${analyticsData.trends?.length || 0} weeks of data
- Weekly: ${analyticsData.weeklyMetrics ? JSON.stringify(analyticsData.weeklyMetrics) : 'Not available'}

Suggest 4-6 components that would best answer this query. Return JSON array with objects containing:
{ "type": "component_type", "title": "Component Title", "reason": "Why this helps" }`;

      const suggestions = await this.aiClient.completeJSON<Array<{ type: string; title: string; reason: string }>>(
        systemPrompt,
        userMessage,
      );

      // Build the report components based on suggestions and available data
      const components = this.buildReportComponents(suggestions || [], analyticsData);

      return {
        id: reportId,
        title: this.generateReportTitle(query),
        description: `AI-generated report for: ${query}`,
        layout: 'grid',
        components,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error}`);
      // Return a default report structure
      return this.getDefaultReport(reportId, query, analyticsData);
    }
  }

  private generateReportTitle(query: string): string {
    // Clean up and capitalize the query for a title
    const words = query.toLowerCase().split(/\s+/);
    const titleWords = words.map(w => w.charAt(0).toUpperCase() + w.slice(1));
    return titleWords.join(' ').substring(0, 50) + (query.length > 50 ? '...' : '');
  }

  private buildReportComponents(
    suggestions: Array<{ type: string; title: string }>,
    data: {
      pipelineHealth?: { total: number; weighted: number; averageDealSize: number };
      dealsByStage?: Array<{ stage: string; count: number; value: number }>;
      trends?: Array<{ date: string; newDeals: number; closedValue: number }>;
      weeklyMetrics?: { newDeals: number; closedWon: number; closedLost: number; totalValue: number };
    },
  ): ReportComponent[] {
    const components: ReportComponent[] = [];

    for (const suggestion of suggestions) {
      const component = this.createComponent(suggestion.type, suggestion.title, data);
      if (component) {
        components.push(component);
      }
    }

    // Ensure we have at least some components
    if (components.length === 0) {
      return this.getDefaultComponents(data);
    }

    return components;
  }

  private createComponent(
    type: string,
    title: string,
    data: {
      pipelineHealth?: { total: number; weighted: number; averageDealSize: number };
      dealsByStage?: Array<{ stage: string; count: number; value: number }>;
      trends?: Array<{ date: string; newDeals: number; closedValue: number }>;
      weeklyMetrics?: { newDeals: number; closedWon: number; closedLost: number; totalValue: number };
    },
  ): ReportComponent | null {
    switch (type) {
      case 'metric_card':
        if (data.pipelineHealth) {
          return {
            type: 'metric_card',
            title: title || 'Pipeline Value',
            value: data.pipelineHealth.total,
            format: 'currency',
          };
        }
        break;

      case 'bar_chart':
        if (data.dealsByStage) {
          return {
            type: 'bar_chart',
            title: title || 'Deals by Stage',
            data: data.dealsByStage.map(s => ({ label: s.stage, value: s.value })),
          };
        }
        break;

      case 'trend_line':
        if (data.trends && data.trends.length > 0) {
          return {
            type: 'trend_line',
            title: title || 'Revenue Trend',
            data: data.trends.map(t => ({ date: t.date, value: t.closedValue })),
          };
        }
        break;

      case 'funnel':
        if (data.dealsByStage) {
          return {
            type: 'funnel',
            title: title || 'Deal Funnel',
            stages: data.dealsByStage.map(s => ({ name: s.stage, value: s.count })),
          };
        }
        break;
    }

    return null;
  }

  private getDefaultComponents(data: {
    pipelineHealth?: { total: number; weighted: number; averageDealSize: number };
    dealsByStage?: Array<{ stage: string; count: number; value: number }>;
    trends?: Array<{ date: string; newDeals: number; closedValue: number }>;
    weeklyMetrics?: { newDeals: number; closedWon: number; closedLost: number; totalValue: number };
  }): ReportComponent[] {
    const components: ReportComponent[] = [];

    if (data.pipelineHealth) {
      components.push({
        type: 'metric_card',
        title: 'Total Pipeline',
        value: data.pipelineHealth.total,
        format: 'currency',
      });
      components.push({
        type: 'metric_card',
        title: 'Weighted Pipeline',
        value: data.pipelineHealth.weighted,
        format: 'currency',
      });
      components.push({
        type: 'metric_card',
        title: 'Avg Deal Size',
        value: data.pipelineHealth.averageDealSize,
        format: 'currency',
      });
    }

    if (data.dealsByStage) {
      components.push({
        type: 'bar_chart',
        title: 'Pipeline by Stage',
        data: data.dealsByStage.map(s => ({ label: s.stage, value: s.value })),
      });
    }

    if (data.trends && data.trends.length > 0) {
      components.push({
        type: 'trend_line',
        title: 'Closed Revenue Trend',
        data: data.trends.map(t => ({ date: t.date, value: t.closedValue })),
      });
    }

    return components;
  }

  private getDefaultReport(
    id: string,
    query: string,
    data: {
      pipelineHealth?: { total: number; weighted: number; averageDealSize: number };
      dealsByStage?: Array<{ stage: string; count: number; value: number }>;
      trends?: Array<{ date: string; newDeals: number; closedValue: number }>;
      weeklyMetrics?: { newDeals: number; closedWon: number; closedLost: number; totalValue: number };
    },
  ): ReportSpec {
    return {
      id,
      title: this.generateReportTitle(query),
      description: `Report for: ${query}`,
      layout: 'grid',
      components: this.getDefaultComponents(data),
      generatedAt: new Date().toISOString(),
    };
  }
}
