# syntax=docker/dockerfile:1

# ==== BUILDER PROJECT GENERATOR ====
FROM oven/bun:alpine AS builder-project-generator
ENV NODE_ENV=production
WORKDIR /app

RUN apk --no-cache add imagemagick exiftool

COPY shared ./shared
COPY projectGenerator/package.json projectGenerator/bun.lock ./projectGenerator/
RUN --mount=type=cache,target=/root/.bun/install/cache \
	cd projectGenerator && bun install --frozen-lockfile
COPY projectGenerator ./projectGenerator
RUN cd projectGenerator && bun run lint:check && bun run build

# ======== BUILDER FRONTEND =========
FROM oven/bun:alpine AS builder-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile
COPY shared ../shared
COPY frontend ./

ENV NODE_ENV=production
RUN bun run check && bun run lint:check && bun run build

# ========= BACKEND DEPS ============
FROM oven/bun:alpine AS deps-backend
WORKDIR /app
COPY backend/package.json backend/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --production

# ======== BUILDER BACKEND ==========
FROM oven/bun:alpine AS builder-backend
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile
COPY shared ../shared
COPY backend ./
RUN bun run check && bun run lint:check

# ======== PROJECT GENERATOR ========
FROM builder-project-generator AS project-generator
WORKDIR /app/projectGenerator
CMD ["bun", "run", "start"]

# =============== APP ===============
FROM oven/bun:alpine AS app
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app/backend
COPY --from=deps-backend /app/node_modules ./node_modules
COPY --from=builder-backend /app/backend/package.json ./package.json
COPY --from=builder-backend /app/backend/assets ./assets
COPY --from=builder-backend /app/backend/src ./src
COPY --from=builder-backend /app/shared/api.ts ../shared/api.ts
COPY --from=builder-frontend /app/frontend/dist ../frontend/dist
CMD ["bun", "src/app.ts"]
