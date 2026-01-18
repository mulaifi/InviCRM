import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create tenant if not provided
    let tenantId = registerDto.tenantId;
    if (!tenantId) {
      const tenant = await this.tenantsService.create({
        name: registerDto.companyName || `${registerDto.firstName}'s Team`,
        slug: this.generateSlug(registerDto.email),
      });
      tenantId = tenant.id;
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      tenantId,
      role: registerDto.tenantId ? 'rep' : 'admin', // Admin if creating new tenant
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get tenant details
    const tenant = await this.tenantsService.findById(user.tenantId);

    const tokens = await this.generateTokens(user);
    return {
      data: {
        user: this.sanitizeUser(user),
        tenant: tenant ? { id: tenant.id, name: tenant.name, settings: tenant.settings || {} } : null,
        ...tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user);
      return {
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    accessToken: string;
    refreshToken: string;
  }) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user with Google auth
      const tenant = await this.tenantsService.create({
        name: `${profile.firstName}'s Team`,
        slug: this.generateSlug(profile.email),
      });

      user = await this.usersService.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        tenantId: tenant.id,
        role: 'admin',
        googleId: profile.googleId,
      });
    }

    // Store Google tokens for Gmail/Calendar integration
    await this.usersService.updateGoogleTokens(user.id, {
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  private async generateTokens(user: { id: string; email: string; tenantId: string; role: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  private generateSlug(email: string): string {
    const domain = email.split('@')[1];
    const base = domain.split('.')[0];
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`.toLowerCase();
  }
}
