# InviCRM Multi-stage Dockerfile
# Builds all apps from the monorepo with shared dependencies

# ============================================
# Stage 1: Base - Install dependencies
# ============================================
FROM node:20-alpine AS base

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/sync-service/package.json ./apps/sync-service/
COPY apps/slack-bot/package.json ./apps/slack-bot/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-client/package.json ./packages/ai-client/

# Install all dependencies
RUN npm ci --ignore-scripts
RUN npm rebuild bcrypt

# ============================================
# Stage 2: Builder - Compile TypeScript
# ============================================
FROM base AS builder

# Copy all source code
COPY . .

# Build all packages and apps (turborepo handles order)
RUN npm run build

# ============================================
# Stage 3: API - Production API server
# ============================================
FROM node:20-alpine AS api

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Rebuild bcrypt for this stage
RUN apk add --no-cache python3 make g++ && \
    npm rebuild bcrypt && \
    apk del python3 make g++

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/api/dist/main.js"]

# ============================================
# Stage 4: Sync Service - Background workers
# ============================================
FROM node:20-alpine AS sync-service

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/sync-service/package.json ./apps/sync-service/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-client/package.json ./packages/ai-client/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/apps/sync-service/dist ./apps/sync-service/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai-client/dist ./packages/ai-client/dist

# Set environment
ENV NODE_ENV=production

CMD ["node", "apps/sync-service/dist/main.js"]

# ============================================
# Stage 5: Slack Bot - Slack integration
# ============================================
FROM node:20-alpine AS slack-bot

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/slack-bot/package.json ./apps/slack-bot/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-client/package.json ./packages/ai-client/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/apps/slack-bot/dist ./apps/slack-bot/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai-client/dist ./packages/ai-client/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

# Health check for Slack bot
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "apps/slack-bot/dist/main.js"]
