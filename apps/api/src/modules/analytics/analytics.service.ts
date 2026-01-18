import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Deal, Activity, Task, Pipeline, Stage } from '@invicrm/database';
import { ConfigService } from '@nestjs/config';

// Map Deal entity to frontend format
function mapDealToFrontend(deal: Deal) {
  return {
    id: deal.id,
    title: deal.name, // name -> title
    value: deal.amount || 0, // amount -> value
    currency: deal.currency,
    stageId: deal.stageId,
    stage: deal.stage,
    pipelineId: deal.pipelineId,
    pipeline: deal.pipeline,
    contact: deal.contact,
    contactId: deal.contactId,
    company: deal.company,
    companyId: deal.companyId,
    ownerId: deal.ownerId,
    owner: deal.owner,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate?.toISOString(),
    closedAt: deal.closedAt?.toISOString(),
    status: deal.status,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Pipeline)
    private readonly pipelineRepository: Repository<Pipeline>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    private configService: ConfigService,
  ) {}

  async getDashboardNow(tenantId: string, userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get urgent deals (high value or closing soon)
    const urgentDeals = await this.dealRepository.find({
      where: [
        {
          tenantId,
          status: 'open',
          isDeleted: false,
          expectedCloseDate: LessThanOrEqual(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
        },
      ],
      relations: ['contact', 'company', 'stage'],
      order: { amount: 'DESC' },
      take: 5,
    });

    // Get pending tasks for today
    const pendingTasks = await this.taskRepository.find({
      where: {
        tenantId,
        assignedToId: userId,
        status: 'pending',
        dueDate: LessThanOrEqual(endOfToday),
      },
      order: { priority: 'DESC', dueDate: 'ASC' },
      take: 10,
    });

    // Get today's meetings
    const todayMeetings = await this.activityRepository.find({
      where: {
        tenantId,
        type: 'meeting',
        occurredAt: Between(startOfToday, endOfToday),
      },
      relations: ['contact'],
      order: { occurredAt: 'ASC' },
    });

    // Get recent activities
    const recentActivities = await this.activityRepository.find({
      where: { tenantId },
      relations: ['contact'],
      order: { occurredAt: 'DESC' },
      take: 10,
    });

    // Generate briefing
    const briefing = this.generateDefaultBriefing(urgentDeals.length, pendingTasks.length, todayMeetings.length);

    return {
      briefing,
      urgentDeals: urgentDeals.map(mapDealToFrontend),
      pendingTasks,
      todayMeetings,
      recentActivities,
    };
  }

  async getDashboardHorizon(tenantId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get deals closing this week
    const weeklyDeals = await this.dealRepository.find({
      where: {
        tenantId,
        status: 'open',
        isDeleted: false,
        expectedCloseDate: Between(startOfWeek, endOfWeek),
      },
      relations: ['contact', 'company', 'stage'],
      order: { expectedCloseDate: 'ASC' },
    });

    // Get upcoming meetings this week
    const upcomingMeetings = await this.activityRepository.find({
      where: {
        tenantId,
        type: 'meeting',
        occurredAt: Between(now, endOfWeek),
      },
      relations: ['contact'],
      order: { occurredAt: 'ASC' },
    });

    // Get deals by stage
    const pipeline = await this.pipelineRepository.findOne({
      where: { tenantId, isDefault: true },
      relations: ['stages'],
    });

    const dealsByStage = pipeline
      ? await Promise.all(
          pipeline.stages.map(async (stage) => {
            const deals = await this.dealRepository.find({
              where: { tenantId, stageId: stage.id, status: 'open', isDeleted: false },
            });
            return {
              stage: stage.name,
              count: deals.length,
              value: deals.reduce((sum, d) => sum + (d.amount || 0), 0),
            };
          }),
        )
      : [];

    // Calculate weekly metrics
    const newDealsThisWeek = await this.dealRepository.count({
      where: {
        tenantId,
        isDeleted: false,
        createdAt: Between(startOfWeek, endOfWeek),
      },
    });

    const closedWon = await this.dealRepository.find({
      where: {
        tenantId,
        status: 'won',
        closedAt: Between(startOfWeek, endOfWeek),
      },
    });

    const closedLost = await this.dealRepository.count({
      where: {
        tenantId,
        status: 'lost',
        closedAt: Between(startOfWeek, endOfWeek),
      },
    });

    return {
      weeklyDeals: weeklyDeals.map(mapDealToFrontend),
      upcomingMeetings,
      dealsByStage,
      weeklyMetrics: {
        newDeals: newDealsThisWeek,
        closedWon: closedWon.length,
        closedLost,
        totalValue: closedWon.reduce((sum, d) => sum + (d.amount || 0), 0),
      },
    };
  }

  async getDashboardLandscape(tenantId: string) {
    const now = new Date();
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

    // Calculate quarterly forecast (weighted pipeline value)
    const openDeals = await this.dealRepository.find({
      where: {
        tenantId,
        status: 'open',
        isDeleted: false,
        expectedCloseDate: Between(startOfQuarter, endOfQuarter),
      },
    });

    const quarterlyForecast = openDeals.reduce(
      (sum, d) => sum + (d.amount || 0) * ((d.probability || 0) / 100),
      0,
    );

    // Pipeline health metrics
    const allOpenDeals = await this.dealRepository.find({
      where: { tenantId, status: 'open', isDeleted: false },
    });

    const totalPipelineValue = allOpenDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const weightedPipelineValue = allOpenDeals.reduce(
      (sum, d) => sum + (d.amount || 0) * ((d.probability || 0) / 100),
      0,
    );

    // Get closed deals for cycle time calculation
    const closedDeals = await this.dealRepository.find({
      where: { tenantId, status: 'won', isDeleted: false },
      take: 50,
      order: { closedAt: 'DESC' },
    });

    const cycleTimes = closedDeals
      .filter(d => d.closedAt && d.createdAt)
      .map(d => (d.closedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const averageCycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 0;

    // Stage conversion rates
    const pipeline = await this.pipelineRepository.findOne({
      where: { tenantId, isDefault: true },
      relations: ['stages'],
    });

    const stageConversion = [];
    if (pipeline && pipeline.stages.length > 1) {
      const sortedStages = pipeline.stages.sort((a, b) => a.position - b.position);
      for (let i = 0; i < sortedStages.length - 1; i++) {
        stageConversion.push({
          from: sortedStages[i].name,
          to: sortedStages[i + 1].name,
          rate: sortedStages[i + 1].probability - sortedStages[i].probability,
        });
      }
    }

    // Trends (last 12 weeks)
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 * i) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const newDeals = await this.dealRepository.count({
        where: {
          tenantId,
          isDeleted: false,
          createdAt: Between(weekStart, weekEnd),
        },
      });

      const closedValue = await this.dealRepository.find({
        where: {
          tenantId,
          status: 'won',
          closedAt: Between(weekStart, weekEnd),
        },
      });

      trends.push({
        date: weekStart.toISOString().split('T')[0],
        newDeals,
        closedValue: closedValue.reduce((sum, d) => sum + (d.amount || 0), 0),
      });
    }

    return {
      quarterlyForecast,
      pipelineHealth: {
        total: totalPipelineValue,
        weighted: weightedPipelineValue,
        averageDealSize: allOpenDeals.length > 0 ? totalPipelineValue / allOpenDeals.length : 0,
        averageCycleTime: Math.round(averageCycleTime),
      },
      stageConversion,
      trends,
    };
  }

  private generateDefaultBriefing(urgentDeals: number, pendingTasks: number, meetings: number): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';

    const parts = [greeting];

    if (urgentDeals > 0) {
      parts.push(`You have ${urgentDeals} deal${urgentDeals > 1 ? 's' : ''} requiring attention.`);
    }

    if (pendingTasks > 0) {
      parts.push(`${pendingTasks} task${pendingTasks > 1 ? 's' : ''} due today.`);
    }

    if (meetings > 0) {
      parts.push(`${meetings} meeting${meetings > 1 ? 's' : ''} scheduled.`);
    }

    if (urgentDeals === 0 && pendingTasks === 0 && meetings === 0) {
      parts.push('Your schedule looks clear. Great time to reach out to prospects!');
    }

    return parts.join(' ');
  }
}
