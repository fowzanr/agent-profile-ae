-- AlterTable
ALTER TABLE "AgentLink" ADD COLUMN "kind" TEXT,
ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
