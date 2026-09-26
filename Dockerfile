# syntax=docker/dockerfile:1

# Global Deals Network - production API image.
#
# Builds only the compiled src/ output (dist/index.js, per
# tsconfig.build.json) and runs it with production dependencies.
# Database migrations (`npm run db:migrate`) are NOT run by this
# image - they are a separate, idempotent release step that already
# runs this way in .github/workflows/ci.yml. See deploy/README.md.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/index.js"]
