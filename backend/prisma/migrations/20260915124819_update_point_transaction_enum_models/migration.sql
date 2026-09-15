/*
  Warnings:

  - The values [USER_BANNED] on the enum `PointReason` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[event_key]` on the table `PointTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_key` to the `PointTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PointReason_new" AS ENUM ('ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ACTION_PARTICIPANTS', 'ORGANIZATION_JOINED', 'USER_SUSPENDED', 'USER_BANNED_FROM_ORG');
ALTER TABLE "PointTransaction" ALTER COLUMN "reason" TYPE "PointReason_new" USING ("reason"::text::"PointReason_new");
ALTER TYPE "PointReason" RENAME TO "PointReason_old";
ALTER TYPE "PointReason_new" RENAME TO "PointReason";
DROP TYPE "public"."PointReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "PointTransaction" ADD COLUMN     "event_key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_event_key_key" ON "PointTransaction"("event_key");
