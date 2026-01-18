import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard-now')
  async getDashboardNow(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const data = await this.analyticsService.getDashboardNow(tenantId, userId);
    return { data };
  }

  @Get('dashboard-horizon')
  async getDashboardHorizon(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const data = await this.analyticsService.getDashboardHorizon(tenantId);
    return { data };
  }

  @Get('dashboard-landscape')
  async getDashboardLandscape(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const data = await this.analyticsService.getDashboardLandscape(tenantId);
    return { data };
  }
}
