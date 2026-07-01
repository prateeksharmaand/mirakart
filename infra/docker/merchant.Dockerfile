# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @mirakart/merchant --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@mirakart/merchant

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant/.next/static ./apps/merchant/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant/public ./apps/merchant/public
USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "apps/merchant/server.js"]
