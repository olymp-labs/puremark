ARG NODE_VERSION=23

FROM node:${NODE_VERSION}-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy local dependencies
COPY nextjs-security-headers/nextjs-security-headers.tgz ./nextjs-security-headers/nextjs-security-headers.tgz
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild source code only when needed
FROM base AS builder
ARG COMMIT_HASH="unknown"

WORKDIR /app
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest without local dependencies
COPY . .
RUN rm -rf nextjs-security-headers

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_COMMIT_HASH=$COMMIT_HASH

RUN corepack enable pnpm && pnpm run build
RUN mkdir -p db

# Production image, copy all files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db ./db

USER nextjs

EXPOSE 3000
ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
