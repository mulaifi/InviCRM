import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ParseQueryDto } from './dto/parse-query.dto';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  async parseQuery(@Body() dto: ParseQueryDto) {
    const result = await this.aiService.parseQuery(dto.query);
    return result;
  }

  @Post('generate-report')
  @HttpCode(HttpStatus.OK)
  async generateReport(@Body() dto: GenerateReportDto, @Request() req: any) {
    const tenantId = req.user.tenantId;

    // Get analytics data to populate the report
    const [horizonData, landscapeData] = await Promise.all([
      this.analyticsService.getDashboardHorizon(tenantId),
      this.analyticsService.getDashboardLandscape(tenantId),
    ]);

    // Generate the report using AI
    const report = await this.aiService.generateReport(dto.query, {
      pipelineHealth: landscapeData.pipelineHealth,
      dealsByStage: horizonData.dealsByStage,
      trends: landscapeData.trends,
      weeklyMetrics: horizonData.weeklyMetrics,
    });

    return { data: report };
  }
}
