-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "bookingMode" TEXT NOT NULL DEFAULT 'form',
ADD COLUMN "bookingUrl" TEXT;
