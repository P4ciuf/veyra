/**
 * Database access for the site's registration endpoint, credentials provider and
 * Discord id persistence. All helpers use the Prisma singleton, so they inherit
 * its connection and fail at call time when the connection string is missing.
 */
import { randomBytes } from "crypto";
import { Prisma, prisma } from "database";
import { logger } from "shared";
import { createHash } from "./hash";

/**
 * Finds the first user matching a Prisma filter.
 *
 * @param options - Prisma user filter, normally an email lookup
 * @returns The matching row, or `null` when no user matches
 */
async function getUser(options: Prisma.UserWhereInput) {
  return await prisma.user.findFirst({ where: options });
}

/**
 * Creates a user row with a generated username when none is supplied.
 *
 * Only the columns declared by the `User` model are passed to Prisma: an
 * explicit `username` or `avatarUrl` overrides the generated default, and the
 * plaintext password is used solely to derive `passwordHash` via `createHash`
 * so it is never persisted or forwarded to the database layer.
 *
 * @param inputData - Email, plaintext password and optional profile fields
 * @returns The newly created user row
 */
async function createUser(inputData: {
  email: string;
  password: string;
  username?: string;
  avatarUrl?: string;
}) {
  return await prisma.user.create({
    data: {
      email: inputData.email,
      username: inputData.username ?? `user-${randomBytes(12).toString("hex")}`,
      passwordHash: await createHash(inputData.password),
      ...(inputData.avatarUrl !== undefined ? { avatarUrl: inputData.avatarUrl } : {}),
    },
  });
}

/**
 * Sets `discordId` on an existing user when it is missing or different.
 *
 * The lookup first checks whether another row already owns the id: `discordId`
 * is unique and is referenced by foreign keys, so a conflicting write must not
 * fail the sign-in. The conflict is logged with both row ids instead of being
 * swallowed, giving operators a concrete reconciliation target; taking the id
 * away from the other row would risk breaking its foreign keys. `updateMany`
 * makes the write idempotent — a row that already has the id is not updated at
 * all. The explicit `null` branch is required because Prisma's `not` filter
 * excludes NULL rows in SQL.
 *
 * @param userId - Primary key of the user to update
 * @param discordId - Non-empty Discord snowflake id from the OAuth profile
 * @returns `true` when the id is stored or already present, `false` when another user owns it
 */
async function setUserDiscordId(userId: string, discordId: string): Promise<boolean> {
  const otherOwner = await prisma.user.findFirst({
    where: { discordId, id: { not: userId } },
    select: { id: true },
  });
  if (otherOwner) {
    logger.warn("Discord id is already linked to another user", {
      userId,
      ownerUserId: otherOwner.id,
    });
    return false;
  }

  await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ discordId: null }, { discordId: { not: discordId } }],
    },
    data: { discordId },
  });
  return true;
}

export { getUser, createUser, setUserDiscordId };
