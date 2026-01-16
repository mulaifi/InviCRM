import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserIntegration } from '@invicrm/database';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserIntegration)
    private readonly integrationRepository: Repository<UserIntegration>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['tenant'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isDeleted: false },
    });
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId, isDeleted: false },
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async updateGoogleTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string },
  ): Promise<void> {
    let integration = await this.integrationRepository.findOne({
      where: { userId, provider: 'google' },
    });

    if (integration) {
      integration.accessToken = tokens.accessToken;
      integration.refreshToken = tokens.refreshToken;
      integration.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
    } else {
      integration = this.integrationRepository.create({
        userId,
        provider: 'google',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      });
    }

    await this.integrationRepository.save(integration);
  }

  async getGoogleTokens(userId: string): Promise<UserIntegration | null> {
    return this.integrationRepository.findOne({
      where: { userId, provider: 'google' },
    });
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    await this.userRepository.save(user);
  }
}
