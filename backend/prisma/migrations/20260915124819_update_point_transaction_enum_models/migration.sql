/*
  Warnings:

  - The values [USER_BANNED] on the enum `PointReason` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[event_key]` on the table `PointTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_key` to the `PointTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PointReason_new" AS ENUM ('ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ACTION_PARTICIPANTS', 'ORGANIZATION_JOINED', 'USER_SUSPENDED', 'USER_BANNED_FROM_ORG');
ALTER TABLE "PointTransaction" ALTER COLUMN "reason" TYPE "PointReason_new" USING (
  CASE "reason"::text
    WHEN 'USER_BANNED' THEN 'USER_BANNED_FROM_ORG'
    ELSE "reason"::text
  END::"PointReason_new"
);
ALTER TYPE "PointReason" RENAME TO "PointReason_old";
ALTER TYPE "PointReason_new" RENAME TO "PointReason";
DROP TYPE "public"."PointReason_old";
COMMIT;

-- Add a stable key for existing transactions before making the column required.
ALTER TABLE "PointTransaction" ADD COLUMN "event_key" TEXT;

UPDATE "PointTransaction"
SET "event_key" = 'legacy:' || "point_transaction_id";

ALTER TABLE "PointTransaction" ALTER COLUMN "event_key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_event_key_key" ON "PointTransaction"("event_key");