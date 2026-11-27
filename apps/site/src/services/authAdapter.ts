/**
 * Decorates the NextAuth Prisma adapter with the platform-specific fields that
 * a new `User` row requires. No authentication logic is reimplemented here.
 */
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { completePlatformUser } from "@/lib/authUser";

/** Fields NextAuth passes to `createUser` before the database assigns an id. */
type CreateUserInput = {
  name?: string | null;
  email: string;
  image?: string | null;
  emailVerified: Date | null;
  /** Discord snowflake id, present only on the Discord provider's mapped profile. */
  discordId?: string;
};

/** Narrowed `createUser` signature used by this wrapper. */
type CreateUser = (user: CreateUserInput) => Promise<AdapterUser>;

/**
 * Wraps `createUser` so first-time OAuth users get a valid platform row.
 *
 * NextAuth supplies `name`, `email`, `image` and `emailVerified`, plus the
 * Discord provider's `discordId`; the platform table also requires `username`
 * and mirrors the avatar in `avatarUrl`. Without this wrapper the adapter insert
 * fails on the NOT NULL column. Extra fields such as `discordId` are forwarded
 * to Prisma, which writes the declared column. All other adapter methods are
 * passed through unchanged.
 *
 * @param base - Adapter returned by `PrismaAdapter(prisma)`
 * @returns An adapter whose `createUser` fills the platform-only columns
 * @example
 * const adapter = createAuthAdapter(PrismaAdapter(prisma));
 */
export function createAuthAdapter(base: Adapter): Adapter {
  const createUser = base.createUser as CreateUser | undefined;
  if (!createUser) {
    return base;
  }

  return {
    ...base,
    createUser(user: CreateUserInput) {
      const { username, avatarUrl } = completePlatformUser(user);
      // The adapter's public type omits platform columns; Prisma accepts them
      // at runtime because the generated `User` model declares these fields.
      const platformUser = { ...user, username, avatarUrl, discordId: user.discordId };
      return createUser(platformUser);
    },
  };
}
