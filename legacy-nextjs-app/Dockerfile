# KlipCam Dockerfile
# Multi-stage build for production-ready Next.js application
# Optimized for minimal size and security

# =============================================================================
# DEPENDENCIES STAGE
# =============================================================================
FROM node:18-alpine AS deps
LABEL maintainer="KlipCam Engineering <engineering@klipcam.com>"
LABEL description="KlipCam Creator AI Platform"

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install all dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile

# Build the application
RUN npm run build

# =============================================================================
# RUNNER STAGE
# =============================================================================
FROM node:18-alpine AS runner

# Install system dependencies and security updates
RUN apk add --no-cache \
    ca-certificates \
    curl \
    dumb-init \
    && apk upgrade --no-cache \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built application
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built Next.js files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create necessary directories
RUN mkdir -p /app/logs /app/tmp && \
    chown -R nextjs:nodejs /app/logs /app/tmp

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# =============================================================================
# DEVELOPMENT STAGE (for docker-compose development)
# =============================================================================
FROM node:18-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git \
    bash

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]