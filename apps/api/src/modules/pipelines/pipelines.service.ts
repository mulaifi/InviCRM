import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline, Stage } from '@invicrm/database';

export interface StageResponse {
  id: string;
  tenantId: string;
  pipelineId: string;
  name: string;
  position: number;
  probability: number;
  type: string;
  color: string | null;
  isClosed: boolean;
  isWon: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineResponse {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  stages: StageResponse[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline)
    private readonly pipelineRepository: Repository<Pipeline>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
  ) {}

  private transformStage(stage: Stage): StageResponse {
    return {
      id: stage.id,
      tenantId: stage.tenantId,
      pipelineId: stage.pipelineId,
      name: stage.name,
      position: stage.position,
      probability: stage.probability,
      type: stage.type,
      color: stage.color,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
      isClosed: stage.type === 'won' || stage.type === 'lost',
      isWon: stage.type === 'won',
    };
  }

  private transformPipeline(pipeline: Pipeline): PipelineResponse {
    return {
      id: pipeline.id,
      tenantId: pipeline.tenantId,
      name: pipeline.name,
      isDefault: pipeline.isDefault,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      stages: (pipeline.stages || [])
        .sort((a, b) => a.position - b.position)
        .map((stage) => this.transformStage(stage)),
    };
  }

  async findAllPipelines(tenantId: string): Promise<PipelineResponse[]> {
    const pipelines = await this.pipelineRepository.find({
      where: { tenantId },
      relations: ['stages'],
      order: { createdAt: 'ASC' },
    });
    return pipelines.map((p) => this.transformPipeline(p));
  }

  async findPipelineById(tenantId: string, id: string): Promise<PipelineResponse> {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
      relations: ['stages'],
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return this.transformPipeline(pipeline);
  }

  async findDefaultPipeline(tenantId: string): Promise<PipelineResponse> {
    let pipeline = await this.pipelineRepository.findOne({
      where: { tenantId, isDefault: true },
      relations: ['stages'],
    });

    if (!pipeline) {
      // Fall back to first pipeline if no default
      pipeline = await this.pipelineRepository.findOne({
        where: { tenantId },
        relations: ['stages'],
        order: { createdAt: 'ASC' },
      });

      if (!pipeline) {
        throw new NotFoundException('No pipeline found for tenant');
      }
    }

    return this.transformPipeline(pipeline);
  }

  async findAllStages(tenantId: string, pipelineId?: string): Promise<StageResponse[]> {
    const where: { tenantId: string; pipelineId?: string } = { tenantId };
    if (pipelineId) {
      where.pipelineId = pipelineId;
    }

    const stages = await this.stageRepository.find({
      where,
      order: { position: 'ASC' },
    });

    return stages.map((s) => this.transformStage(s));
  }

  async findStageById(tenantId: string, id: string): Promise<StageResponse> {
    const stage = await this.stageRepository.findOne({
      where: { id, tenantId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }

    return this.transformStage(stage);
  }
}
