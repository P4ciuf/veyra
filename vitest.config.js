import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

// `shared` is resolved from its TypeScript source so the test suite does not
// depend on the gitignored `shared/dist` build output (keeps a fresh clone testable).
const sharedSource = fileURLToPath(new URL("./shared/src/index.ts", import.meta.url));

// `discord.js` is only a dependency of the `discord-bot` workspace package, so it is
// not resolvable from the root-level `tests/` directory; point the alias at the
// package's own node_modules link.
const discordJs = fileURLToPath(
  new URL("./apps/discordBot/node_modules/discord.js", import.meta.url),
);

// Same situation as `discord.js`: `dotenv` is a workspace-package dependency, not
// a root one. Without the alias, `vi.mock("dotenv")` in the env tests cannot bind
// to the module instance that `env.ts` imports.
const dotenv = fileURLToPath(new URL("./apps/discordBot/node_modules/dotenv", import.meta.url));

// `@prisma/client`, `@prisma/adapter-pg`, and `@prisma/config` are dependencies
// of the `database` workspace package, not of the root. The suite imports
// `database/*` by relative path, so these aliases let `vi.mock("@prisma/client")`
// and friends resolve from the root-level `tests/` directory and bind to the
// exact module ids the database sources import. Mocking them also keeps the
// suite independent of `prisma generate`: the tests never import the real
// generated client, even though `pnpm install` runs the database `prepare`
// script that generates it.
const prismaClient = fileURLToPath(
  new URL("./database/node_modules/@prisma/client", import.meta.url),
);
const prismaAdapterPg = fileURLToPath(
  new URL("./database/node_modules/@prisma/adapter-pg", import.meta.url),
);
const prismaConfig = fileURLToPath(
  new URL("./database/node_modules/@prisma/config", import.meta.url),
);

// React is only a dependency of the `site` workspace package; aliasing it to
// the site's own copy keeps exactly one React instance in the test process
// (the one `@testing-library/react` renders with is the one the components
// were written against). Without the alias, the root `node_modules` copy
// installed for the testing library's peer range would diverge from it.
const siteReact = fileURLToPath(new URL("./apps/site/node_modules/react", import.meta.url));
const siteReactDom = fileURLToPath(new URL("./apps/site/node_modules/react-dom", import.meta.url));

// `next/font/google` is mocked by the layout tests (its real module is a build
// stub with an empty runtime file), and the specifier must resolve from the
// root-level `tests/` directory for the mock to bind to the id `layout.tsx`
// imports.
const nextFontGoogle = fileURLToPath(
  new URL("./apps/site/node_modules/next/font/google/index.js", import.meta.url),
);

export default defineConfig({
  // Enables the automatic JSX runtime for `.tsx` sources. The site's tsconfig
  // declares `react-jsx`, which is a type-only setting for Next.js; the runtime
  // transform for the tests is performed by this plugin.
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^shared$/, replacement: sharedSource },
      { find: /^discord\.js$/, replacement: discordJs },
      { find: /^dotenv$/, replacement: dotenv },
      { find: /^@prisma\/client$/, replacement: prismaClient },
      { find: /^@prisma\/adapter-pg$/, replacement: prismaAdapterPg },
      { find: /^@prisma\/config$/, replacement: prismaConfig },
      { find: /^react$/, replacement: siteReact },
      { find: /^react\/(.*)$/, replacement: `${siteReact}/$1` },
      { find: /^react-dom$/, replacement: siteReactDom },
      { find: /^react-dom\/(.*)$/, replacement: `${siteReactDom}/$1` },
      { find: /^next\/font\/google$/, replacement: nextFontGoogle },
    ],
  },
  test: {
    // Globstar is required: a plain "node_modules/**" would match only the root
    // one, letting nested installs (e.g. apps/site) leak dependency-internal
    // test files into the suite.
    exclude: ["**/node_modules/**"],
  },
});
