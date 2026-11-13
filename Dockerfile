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

# ======== FRONTEND DEPS ============
FROM oven/bun:alpine AS deps-frontend
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --production

# ======== BUILDER FRONTEND =========
FROM oven/bun:alpine AS builder-frontend
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile
COPY frontend ./

ENV NODE_ENV=production
RUN bun run check && bun run lint:check && bun run build

# =========== CMS DEPS ==============
FROM oven/bun:alpine AS deps-cms
WORKDIR /app
COPY cmsj/package.json cmsj/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --production

# ========== BUILDER CMS ============
FROM oven/bun:alpine AS builder-cms
WORKDIR /app
COPY cmsj/package.json cmsj/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile
COPY cmsj ./

ENV NODE_ENV=production
RUN bun run build

# =============== CMS ===============
FROM oven/bun:alpine AS cms
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps-cms /app/node_modules ./node_modules
COPY --from=builder-cms /app/package.json ./package.json
COPY --from=builder-cms /app/build ./build
CMD ["bun", "./build/app.js"]

# ======== PROJECT GENERATOR ========
FROM builder-project-generator AS project-generator
WORKDIR /app/projectGenerator
CMD ["bun", "run", "start"]

# ============= FRONTEND =============
FROM oven/bun:distroless AS frontend
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=deps-frontend /app/node_modules ./node_modules
COPY --from=builder-frontend /app/package.json ./package.json
COPY --from=builder-frontend /app/build ./build
CMD ["./build/index.js"]
