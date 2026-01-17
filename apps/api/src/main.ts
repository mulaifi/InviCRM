import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DEFAULT_JWT_SECRET = 'development-secret-change-in-production';

function validateEnvironment(): void {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;

  // JWT_SECRET validation
  if (isProduction) {
    if (!jwtSecret) {
      logger.error('FATAL: JWT_SECRET environment variable is required in production');
      process.exit(1);
    }
    if (jwtSecret === DEFAULT_JWT_SECRET) {
      logger.error('FATAL: JWT_SECRET cannot use the default development secret in production');
      process.exit(1);
    }
    if (jwtSecret.length < 32) {
      logger.error('FATAL: JWT_SECRET must be at least 32 characters in production');
      process.exit(1);
    }
  } else {
    if (!jwtSecret || jwtSecret === DEFAULT_JWT_SECRET) {
      logger.warn('WARNING: Using default JWT_SECRET - do not use in production');
    }
  }

  // ENCRYPTION_KEY validation for token encryption
  if (isProduction && !process.env.ENCRYPTION_KEY) {
    logger.error('FATAL: ENCRYPTION_KEY environment variable is required in production for OAuth token encryption');
    process.exit(1);
  }
}

async function bootstrap() {
  // Validate critical environment variables before starting
  validateEnvironment();
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  });

  // API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('InviCRM API')
      .setDescription('AI-powered invisible CRM API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('contacts', 'Contact management')
      .addTag('deals', 'Deal pipeline')
      .addTag('activities', 'Activity tracking')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`InviCRM API is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
