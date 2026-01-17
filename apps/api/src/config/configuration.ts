export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433', 10),
    username: process.env.DATABASE_USER || 'invicrm',
    password: process.env.DATABASE_PASSWORD || 'invicrm_dev',
    name: process.env.DATABASE_NAME || 'invicrm',
    ssl: process.env.DATABASE_SSL === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/google/callback',
  },

  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
    // Allowed redirect URLs (defaults to CORS_ORIGINS)
    allowedRedirects:
      process.env.ALLOWED_REDIRECT_URLS?.split(',') ||
      process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  },
});
