FROM node:22-slim AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy shared package
COPY packages/shared/ packages/shared/

# Copy backend package
COPY packages/backend/ packages/backend/

# Install all workspace dependencies
RUN npm ci

# Build shared first, then backend
RUN npx turbo build --filter=@bedrex/backend

# Production stage
FROM node:22-slim
WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/index.js"]
