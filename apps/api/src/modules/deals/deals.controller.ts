import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('deals')
@Controller({ path: 'deals', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() createDealDto: CreateDealDto,
  ) {
    return this.dealsService.create(user.tenantId, user.id, createDealDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all deals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'pipelineId', required: false, type: String })
  @ApiQuery({ name: 'stageId', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.dealsService.findAll(tenantId, {
      page,
      limit,
      pipelineId,
      stageId,
      ownerId,
    });
  }

  @Get('closing-this-month')
  @ApiOperation({ summary: 'Get deals closing this month' })
  getClosingThisMonth(@CurrentUser('tenantId') tenantId: string) {
    return this.dealsService.getDealsClosingThisMonth(tenantId);
  }

  @Get('pipeline-stats')
  @ApiOperation({ summary: 'Get pipeline statistics' })
  @ApiQuery({ name: 'pipelineId', required: false, type: String })
  getPipelineStats(
    @CurrentUser('tenantId') tenantId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.dealsService.getPipelineStats(tenantId, pipelineId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dealsService.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    return this.dealsService.update(tenantId, id, updateDealDto);
  }

  @Patch(':id/stage/:stageId')
  @ApiOperation({ summary: 'Move deal to a different stage' })
  moveStage(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ) {
    return this.dealsService.moveStage(tenantId, id, stageId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete deal' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dealsService.softDelete(tenantId, id);
  }
}
