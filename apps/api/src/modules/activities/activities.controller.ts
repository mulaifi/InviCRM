import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('activities')
@Controller({ path: 'activities', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(
      user.tenantId,
      user.id,
      createActivityDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List activities' })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'dealId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.activitiesService.findActivities(tenantId, {
      contactId,
      dealId,
      type,
      page,
      limit,
    });
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecent(
    @CurrentUser('tenantId') tenantId: string,
    @Query('days') days?: number,
    @Query('limit') limit?: number,
  ) {
    return this.activitiesService.getRecentActivities(tenantId, days, limit);
  }

  @Get('contact/:contactId/timeline')
  @ApiOperation({ summary: 'Get contact activity timeline' })
  getContactTimeline(
    @CurrentUser('tenantId') tenantId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activitiesService.getContactTimeline(tenantId, contactId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.findActivityById(tenantId, id);
  }

  // Task endpoints
  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task/reminder' })
  createTask(
    @CurrentUser() user: CurrentUserData,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.activitiesService.createTask(
      user.tenantId,
      user.id,
      createTaskDto,
    );
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get my tasks' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'dealId', required: false, type: String })
  getTasks(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
  ) {
    return this.activitiesService.getTasks(user.tenantId, user.id, {
      status,
      contactId,
      dealId,
    });
  }

  @Patch('tasks/:id/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  completeTask(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.completeTask(tenantId, id);
  }
}
