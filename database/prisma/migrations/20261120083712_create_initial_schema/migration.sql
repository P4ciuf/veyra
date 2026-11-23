-- CreateEnum
CREATE TYPE "AuthorizationRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECT');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('GENERAL_SUPPORT', 'REPORT_BUG', 'REPORT_USER', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRoles" AS ENUM ('ADMIN', 'STAFF', 'AUTHORIZED_DEVELOPER', 'USER');

-- CreateTable
CREATE TABLE "AuthorizationRequest" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "githubAccount" TEXT NOT NULL,
    "portfolioLink" TEXT,
    "status" "AuthorizationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "managedByDiscordUserId" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "botAddRequest" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "githubRepository" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "botAddRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTestCategory" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "ownerDiscordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateTestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTestChannel" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "categoryDiscordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateTestChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "discordChannelId" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordId" TEXT,
    "username" TEXT NOT NULL,
    "avatarHash" TEXT,
    "authorizedDeveloper" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRoles" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warn" (
    "id" SERIAL NOT NULL,
    "warnedDiscordUserId" TEXT NOT NULL,
    "warnAddByDiscordUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotCategory_name_key" ON "BotCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTestCategory_discordId_key" ON "PrivateTestCategory"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTestCategory_ownerDiscordId_key" ON "PrivateTestCategory"("ownerDiscordId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_discordChannelId_key" ON "Ticket"("discordChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "User"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "BotCategory"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "botAddRequest" ADD CONSTRAINT "botAddRequest_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "User"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTestChannel" ADD CONSTRAINT "PrivateTestChannel_categoryDiscordId_fkey" FOREIGN KEY ("categoryDiscordId") REFERENCES "PrivateTestCategory"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warn" ADD CONSTRAINT "Warn_warnedDiscordUserId_fkey" FOREIGN KEY ("warnedDiscordUserId") REFERENCES "User"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warn" ADD CONSTRAINT "Warn_warnAddByDiscordUserId_fkey" FOREIGN KEY ("warnAddByDiscordUserId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
