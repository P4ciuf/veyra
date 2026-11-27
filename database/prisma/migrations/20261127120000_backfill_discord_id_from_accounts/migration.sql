-- Backfill `User.discordId` from the Discord identity linked by NextAuth.
-- Before the Discord profile mapper persisted the id, `Account.providerAccountId`
-- was the only reliable source: it is the stable Discord account id that
-- `getUserByAccount` matches on. Users without a linked Discord account keep NULL
-- and are populated on their next Discord sign-in. An id already owned by another
-- row is left untouched so the unique index and its foreign keys stay valid.
-- MIN() makes the result deterministic for users with several Discord accounts.
UPDATE "User" AS u
SET "discordId" = linked."discordId"
FROM (
    SELECT "userId", MIN("providerAccountId") AS "discordId"
    FROM "Account"
    WHERE "provider" = 'discord'
    GROUP BY "userId"
) AS linked
WHERE linked."userId" = u."id"
  AND u."discordId" IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM "User" AS other
      WHERE other."discordId" = linked."discordId"
  );
