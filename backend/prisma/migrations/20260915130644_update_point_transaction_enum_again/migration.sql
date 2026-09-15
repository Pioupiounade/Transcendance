/*
  Warnings:

  - The values [ORGANIZATION_JOINED,USER_BANNED_FROM_ORG] on the enum `PointReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PointReason_new" AS ENUM ('ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ACTION_PARTICIPANTS', 'ORGANIZATION_MEMBER_JOINED', 'ORGANIZATION_MEMBER_LEFT', 'ORGANIZATION_MEMBER_REMOVED', 'ORGANIZATION_MEMBER_BANNED', 'USER_SUSPENDED', 'USER_BANNED_FROM_ORGANIZATION', 'ADMIN_ADJUSTMENT');
ALTER TABLE "PointTransaction" ALTER COLUMN "reason" TYPE "PointReason_new" USING ("reason"::text::"PointReason_new");
ALTER TYPE "PointReason" RENAME TO "PointReason_old";
ALTER TYPE "PointReason_new" RENAME TO "PointReason";
DROP TYPE "public"."PointReason_old";
COMMIT;
