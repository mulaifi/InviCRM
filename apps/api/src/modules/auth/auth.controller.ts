import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    // Validate redirect URL against allowlist
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:3001';
    const allowedRedirects = this.configService.get<string[]>(
      'frontend.allowedRedirects',
    );

    if (!this.isAllowedRedirect(frontendUrl, allowedRedirects)) {
      throw new BadRequestException(
        'Frontend URL is not in the allowed redirect list',
      );
    }

    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  private isAllowedRedirect(
    url: string,
    allowedUrls: string[] | undefined,
  ): boolean {
    if (!allowedUrls || allowedUrls.length === 0) {
      return false;
    }

    try {
      const targetOrigin = new URL(url).origin;
      return allowedUrls.some((allowed) => {
        try {
          return new URL(allowed.trim()).origin === targetOrigin;
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }
}
