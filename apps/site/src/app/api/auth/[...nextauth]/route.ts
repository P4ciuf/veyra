/**
 * NextAuth catch-all API route.
 *
 * Provider registration, session policy and the Credentials flow live in the
 * pure `buildAuthOptions` helper so they can be tested in isolation; this
 * module only wires the real Prisma adapter, the Discord id persistence service
 * and the project logger.
 */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "database";
import NextAuth from "next-auth";
import { logger } from "shared";
import { buildAuthOptions } from "@/lib/authConfig";
import { createAuthAdapter } from "@/services/authAdapter";
import { setUserDiscordId } from "@/services/auth";

const handler = NextAuth({
  ...buildAuthOptions(process.env, createAuthAdapter(PrismaAdapter(prisma)), setUserDiscordId),
  logger: {
    error(code, metadata) {
      logger.error("auth error", { code, metadata });
    },
    warn(code) {
      logger.warn(code);
    },
    debug(code, metadata) {
      logger.debug("auth", { code, metadata });
    },
  },
});

export { handler as GET, handler as POST };
