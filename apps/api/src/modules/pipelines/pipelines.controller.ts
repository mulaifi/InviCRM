import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PipelinesService, PipelineResponse, StageResponse } from './pipelines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('pipelines')
@Controller({ path: 'pipelines', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @ApiOperation({ summary: 'List all pipelines' })
  findAllPipelines(@CurrentUser('tenantId') tenantId: string): Promise<PipelineResponse[]> {
    return this.pipelinesService.findAllPipelines(tenantId);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default pipeline with stages' })
  findDefaultPipeline(@CurrentUser('tenantId') tenantId: string): Promise<PipelineResponse> {
    return this.pipelinesService.findDefaultPipeline(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline by ID with stages' })
  findPipelineById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PipelineResponse> {
    return this.pipelinesService.findPipelineById(tenantId, id);
  }
}

@ApiTags('stages')
@Controller({ path: 'stages', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StagesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @ApiOperation({ summary: 'List all stages' })
  @ApiQuery({ name: 'pipelineId', required: false, type: String })
  findAllStages(
    @CurrentUser('tenantId') tenantId: string,
    @Query('pipelineId') pipelineId?: string,
  ): Promise<StageResponse[]> {
    return this.pipelinesService.findAllStages(tenantId, pipelineId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stage by ID' })
  findStageById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StageResponse> {
    return this.pipelinesService.findStageById(tenantId, id);
  }
}

// Alias controller for frontend compatibility (clik-platform used /pipeline-stages)
@ApiTags('pipeline-stages')
@Controller({ path: 'pipeline-stages', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PipelineStagesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @ApiOperation({ summary: 'List all stages (alias for /stages)' })
  findAllStages(@CurrentUser('tenantId') tenantId: string): Promise<StageResponse[]> {
    return this.pipelinesService.findAllStages(tenantId);
  }
}
