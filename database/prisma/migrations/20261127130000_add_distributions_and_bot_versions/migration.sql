-- Independent releases for catalog bots. `Bot.version` is kept as a
-- denormalized mirror of the current release so existing consumers keep working,
-- while every published version retains its own artifact and metadata.
CREATE TABLE "BotVersion" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotVersion_pkey" PRIMARY KEY ("id")
);

-- Generated packages. Environment values supplied by users are written to the
-- generated `.env` only: no secret and no signed URL is persisted here.
-- `expiresAt` is the single source of truth for link validity and cleanup.
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "packagePath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotVersion_botId_version_key" ON "BotVersion"("botId", "version");

-- CreateIndex
CREATE INDEX "Distribution_userId_createdAt_idx" ON "Distribution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Distribution_expiresAt_idx" ON "Distribution"("expiresAt");

-- CreateIndex
CREATE INDEX "Distribution_botId_idx" ON "Distribution"("botId");

-- CreateIndex
CREATE INDEX "Distribution_versionId_idx" ON "Distribution"("versionId");

-- AddForeignKey
ALTER TABLE "BotVersion" ADD CONSTRAINT "BotVersion_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: a distribution must keep pointing at the exact release it used.
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BotVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
