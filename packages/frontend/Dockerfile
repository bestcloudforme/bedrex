FROM node:22-slim AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy shared package
COPY packages/shared/ packages/shared/

# Copy frontend package
COPY packages/frontend/ packages/frontend/

# Install all workspace dependencies
RUN npm ci

# Build shared first, then frontend
RUN npx turbo build --filter=@bedrex/frontend

# Nginx stage
FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
