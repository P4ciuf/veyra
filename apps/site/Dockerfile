FROM node:24-alpine AS build
RUN npm install --global pnpm@12.18.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/site/package.json apps/site/next.config.ts apps/site/tsconfig.json ./apps/site/
# `site` declares `database: workspace:*`; its manifest is required for a frozen install.
COPY database/package.json ./database/

# Lifecycle scripts are skipped: the sources they build are copied in the next layer
# and the site's own build step does not consume the database package yet.
RUN pnpm install --frozen-lockfile --filter site --ignore-scripts

COPY apps/site/src ./apps/site/src

RUN pnpm --filter site run build
RUN pnpm --filter site --prod deploy /out

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /out ./

# `next` is not on PATH in the runtime stage: the deployed package exposes it
# through its local node_modules/.bin created by `pnpm deploy`.
CMD ["node_modules/.bin/next", "start"]