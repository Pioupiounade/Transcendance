/*
  Warnings:

  - The values [ACTION_CREATED] on the enum `PointReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PointReason_new" AS ENUM ('ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ACTION_PARTICIPANTS', 'ORGANIZATION_JOINED', 'USER_SUSPENDED', 'USER_BANNED');
ALTER TABLE "PointTransaction" ALTER COLUMN "reason" TYPE "PointReason_new" USING (
  CASE "reason"::text
    WHEN 'ACTION_CREATED' THEN 'ACTION_COMPLETED'
    ELSE "reason"::text
  END::"PointReason_new"
);
ALTER TYPE "PointReason" RENAME TO "PointReason_old";
ALTER TYPE "PointReason_new" RENAME TO "PointReason";
DROP TYPE "public"."PointReason_old";
COMMIT;
