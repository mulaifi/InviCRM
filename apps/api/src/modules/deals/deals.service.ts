import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Deal, Pipeline, Stage } from '@invicrm/database';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Pipeline)
    private readonly pipelineRepository: Repository<Pipeline>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
  ) {}

  async create(tenantId: string, ownerId: string, createDealDto: CreateDealDto): Promise<Deal> {
    // Get default pipeline if not specified
    let pipelineId = createDealDto.pipelineId;
    let stageId = createDealDto.stageId;

    if (!pipelineId) {
      const defaultPipeline = await this.getOrCreateDefaultPipeline(tenantId);
      pipelineId = defaultPipeline.id;
      if (!stageId) {
        stageId = defaultPipeline.stages[0]?.id;
      }
    }

    const deal = this.dealRepository.create({
      ...createDealDto,
      tenantId,
      ownerId,
      pipelineId,
      stageId,
      probability: createDealDto.probability || 0,
      currency: createDealDto.currency || 'KWD',
    });

    return this.dealRepository.save(deal);
  }

  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      pipelineId?: string;
      stageId?: string;
      ownerId?: string;
      closingDateFrom?: Date;
      closingDateTo?: Date;
    } = {},
  ): Promise<{ data: Deal[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (options.pipelineId) {
      where.pipelineId = options.pipelineId;
    }
    if (options.stageId) {
      where.stageId = options.stageId;
    }
    if (options.ownerId) {
      where.ownerId = options.ownerId;
    }
    if (options.closingDateFrom && options.closingDateTo) {
      where.expectedCloseDate = Between(
        options.closingDateFrom,
        options.closingDateTo,
      );
    } else if (options.closingDateFrom) {
      where.expectedCloseDate = MoreThanOrEqual(options.closingDateFrom);
    } else if (options.closingDateTo) {
      where.expectedCloseDate = LessThanOrEqual(options.closingDateTo);
    }

    const [data, total] = await this.dealRepository.findAndCount({
      where,
      relations: ['contact', 'company', 'stage', 'owner'],
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId, isDeleted: false },
      relations: ['contact', 'company', 'stage', 'pipeline', 'owner', 'activities'],
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(
    tenantId: string,
    id: string,
    updateDealDto: UpdateDealDto,
  ): Promise<Deal> {
    const deal = await this.findById(tenantId, id);
    Object.assign(deal, updateDealDto);
    return this.dealRepository.save(deal);
  }

  async moveStage(tenantId: string, id: string, stageId: string): Promise<Deal> {
    const deal = await this.findById(tenantId, id);

    // Get stage to update probability
    const stage = await this.stageRepository.findOne({ where: { id: stageId } });
    if (stage) {
      deal.stageId = stageId;
      deal.probability = stage.probability;

      // Auto-set status based on stage type
      if (stage.type === 'won') {
        deal.status = 'won';
        deal.closedAt = new Date();
      } else if (stage.type === 'lost') {
        deal.status = 'lost';
        deal.closedAt = new Date();
      } else {
        deal.status = 'open';
      }
    }

    return this.dealRepository.save(deal);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const deal = await this.findById(tenantId, id);
    deal.isDeleted = true;
    deal.deletedAt = new Date();
    await this.dealRepository.save(deal);
  }

  async getDealsClosingThisMonth(tenantId: string): Promise<Deal[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.dealRepository.find({
      where: {
        tenantId,
        isDeleted: false,
        status: 'open',
        expectedCloseDate: Between(startOfMonth, endOfMonth),
      },
      relations: ['contact', 'company', 'stage'],
      order: { expectedCloseDate: 'ASC' },
    });
  }

  async getPipelineStats(tenantId: string, pipelineId?: string): Promise<any> {
    const pipeline = pipelineId
      ? await this.pipelineRepository.findOne({
          where: { id: pipelineId, tenantId },
          relations: ['stages'],
        })
      : await this.pipelineRepository.findOne({
          where: { tenantId, isDefault: true },
          relations: ['stages'],
        });

    if (!pipeline) {
      return { stages: [], totalValue: 0, totalDeals: 0 };
    }

    const stats = await Promise.all(
      pipeline.stages.map(async (stage) => {
        const [deals, count] = await this.dealRepository.findAndCount({
          where: { tenantId, stageId: stage.id, isDeleted: false, status: 'open' },
        });
        const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
        const weightedValue = deals.reduce(
          (sum, d) => sum + (d.amount || 0) * (d.probability || 0),
          0,
        );
        return {
          stageId: stage.id,
          stageName: stage.name,
          dealCount: count,
          totalValue,
          weightedValue,
        };
      }),
    );

    return {
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stages: stats,
      totalDeals: stats.reduce((sum, s) => sum + s.dealCount, 0),
      totalValue: stats.reduce((sum, s) => sum + s.totalValue, 0),
      totalWeightedValue: stats.reduce((sum, s) => sum + s.weightedValue, 0),
    };
  }

  private async getOrCreateDefaultPipeline(tenantId: string): Promise<Pipeline> {
    let pipeline = await this.pipelineRepository.findOne({
      where: { tenantId, isDefault: true },
      relations: ['stages'],
    });

    if (!pipeline) {
      pipeline = this.pipelineRepository.create({
        tenantId,
        name: 'Sales Pipeline',
        isDefault: true,
      });
      pipeline = await this.pipelineRepository.save(pipeline);

      // Create default stages
      const defaultStages = [
        { name: 'Lead', position: 1, probability: 10, type: 'open' },
        { name: 'Qualified', position: 2, probability: 25, type: 'open' },
        { name: 'Proposal', position: 3, probability: 50, type: 'open' },
        { name: 'Negotiation', position: 4, probability: 75, type: 'open' },
        { name: 'Won', position: 5, probability: 100, type: 'won' },
        { name: 'Lost', position: 6, probability: 0, type: 'lost' },
      ];

      pipeline.stages = [];
      for (const stageData of defaultStages) {
        const stage = this.stageRepository.create({
          ...stageData,
          pipelineId: pipeline.id,
          tenantId,
        });
        const savedStage = await this.stageRepository.save(stage);
        pipeline.stages.push(savedStage);
      }
    }

    return pipeline;
  }
}
