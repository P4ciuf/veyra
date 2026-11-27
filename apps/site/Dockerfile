FROM node:24-alpine AS build
RUN npm install --global pnpm@12.23.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/site/package.json apps/site/next.config.ts apps/site/tsconfig.json ./apps/site/
# `site` declares both workspaces; their manifests are required for a frozen install.
COPY database/ ./database/
COPY shared/ ./shared/
COPY apps/site/src ./apps/site/src
# globals.css imports the brand tokens by relative path: reproduce that path in the image.
COPY docs/brand-identity/tokens/tokens.css ./docs/brand-identity/tokens/

# Lifecycle scripts are skipped: the packages are built explicitly below, after
# all their sources are present.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Both workspaces expose dist/ through `exports`, and the auth routes import the
# generated Prisma client, so they must be built before Turbopack bundles the site.
RUN pnpm --filter shared build
RUN pnpm --filter database build
# No DATABASE_CONNECTION_STRING is needed here: the database barrel exports a
# lazy client, so collecting route handlers has no runtime env requirements.
RUN pnpm --filter site run build
RUN pnpm --filter site --prod deploy /out

# `pnpm deploy` rebuilds node_modules from the lockfile and therefore drops two
# build artifacts: the generated Prisma client inside @prisma/client's virtual
# store entry, and Turbopack's hashed external packages under .next/node_modules.
# Copy both back so the deployed server can require them at runtime.
RUN for src in node_modules/.pnpm/@prisma+client@*/node_modules/.prisma; do \
      [ -d "$src/client" ] || continue; \
      mkdir -p "/out/$(dirname "$src")/.prisma"; \
      cp -a "$src/client" "/out/$(dirname "$src")/.prisma/client"; \
    done
RUN cp -a apps/site/.next/node_modules /out/.next/node_modules
# These links were generated for the deeper apps/site workspace layout. The
# deployed package sits two directory levels higher, so drop two "../" segments
# to make them resolve against /out/node_modules in the runtime stage.
RUN for link in /out/.next/node_modules/* /out/.next/node_modules/*/*; do \
      [ -L "$link" ] || continue; \
      target=$(readlink "$link"); \
      rm -f "$link"; \
      ln -s "${target#../../}" "$link"; \
    done

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /out ./

# `next` is not on PATH in the runtime stage: the deployed package exposes it
# through its local node_modules/.bin created by `pnpm deploy`.
CMD ["node_modules/.bin/next", "start"]