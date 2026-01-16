import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Activity, Task } from '@invicrm/database';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async createActivity(
    tenantId: string,
    userId: string,
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      ...createActivityDto,
      tenantId,
      userId,
      occurredAt: createActivityDto.occurredAt
        ? new Date(createActivityDto.occurredAt)
        : new Date(),
    });

    return this.activityRepository.save(activity);
  }

  async findActivities(
    tenantId: string,
    options: {
      contactId?: string;
      dealId?: string;
      type?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: Activity[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (options.contactId) {
      where.contactId = options.contactId;
    }
    if (options.dealId) {
      where.dealId = options.dealId;
    }
    if (options.type) {
      where.type = options.type;
    }
    if (options.from && options.to) {
      where.occurredAt = Between(options.from, options.to);
    } else if (options.from) {
      where.occurredAt = MoreThanOrEqual(options.from);
    } else if (options.to) {
      where.occurredAt = LessThanOrEqual(options.to);
    }

    const [data, total] = await this.activityRepository.findAndCount({
      where,
      relations: ['contact', 'deal', 'user'],
      order: { occurredAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findActivityById(tenantId: string, id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId, isDeleted: false },
      relations: ['contact', 'deal', 'user'],
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async logEmailActivity(
    tenantId: string,
    data: {
      contactId?: string;
      dealId?: string;
      subject: string;
      body?: string;
      direction: 'inbound' | 'outbound';
      externalId: string;
      threadId?: string;
      occurredAt: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      tenantId,
      type: 'email',
      direction: data.direction,
      contactId: data.contactId,
      dealId: data.dealId,
      subject: data.subject,
      body: data.body,
      externalId: data.externalId,
      threadId: data.threadId,
      occurredAt: data.occurredAt,
      metadata: data.metadata,
      source: 'gmail_sync',
    });

    return this.activityRepository.save(activity);
  }

  async logMeetingActivity(
    tenantId: string,
    data: {
      contactId?: string;
      dealId?: string;
      subject: string;
      startTime: Date;
      endTime: Date;
      externalId: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Activity> {
    const durationMinutes = Math.round(
      (data.endTime.getTime() - data.startTime.getTime()) / 60000,
    );

    const activity = this.activityRepository.create({
      tenantId,
      type: 'meeting',
      contactId: data.contactId,
      dealId: data.dealId,
      subject: data.subject,
      occurredAt: data.startTime,
      durationMinutes,
      externalId: data.externalId,
      metadata: data.metadata,
      source: 'calendar_sync',
    });

    return this.activityRepository.save(activity);
  }

  async logCallActivity(
    tenantId: string,
    userId: string,
    data: {
      contactId: string;
      dealId?: string;
      subject: string;
      notes?: string;
      durationMinutes?: number;
      direction: 'inbound' | 'outbound';
    },
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      tenantId,
      userId,
      type: 'call',
      direction: data.direction,
      contactId: data.contactId,
      dealId: data.dealId,
      subject: data.subject,
      body: data.notes,
      durationMinutes: data.durationMinutes,
      occurredAt: new Date(),
      source: 'manual',
    });

    return this.activityRepository.save(activity);
  }

  // Task management
  async createTask(
    tenantId: string,
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      tenantId,
      assignedToId: createTaskDto.assignedToId || userId,
      createdById: userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    return this.taskRepository.save(task);
  }

  async getTasks(
    tenantId: string,
    userId: string,
    options: {
      status?: string;
      contactId?: string;
      dealId?: string;
      includeOverdue?: boolean;
    } = {},
  ): Promise<Task[]> {
    const where: any = {
      tenantId,
      assignedToId: userId,
      isDeleted: false,
    };

    if (options.status) {
      where.status = options.status;
    }
    if (options.contactId) {
      where.contactId = options.contactId;
    }
    if (options.dealId) {
      where.dealId = options.dealId;
    }

    return this.taskRepository.find({
      where,
      relations: ['contact', 'deal'],
      order: { dueDate: 'ASC' },
    });
  }

  async completeTask(tenantId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, tenantId, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.status = 'completed';
    task.completedAt = new Date();
    return this.taskRepository.save(task);
  }

  async getContactTimeline(
    tenantId: string,
    contactId: string,
    limit = 50,
  ): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { tenantId, contactId, isDeleted: false },
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentActivities(
    tenantId: string,
    days = 7,
    limit = 20,
  ): Promise<Activity[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.activityRepository.find({
      where: {
        tenantId,
        isDeleted: false,
        occurredAt: MoreThanOrEqual(fromDate),
      },
      relations: ['contact', 'deal'],
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }
}
