/*
  Warnings:

  - The values [CLOSED] on the enum `ActionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "public"."Action" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Action" ALTER COLUMN "status" TYPE "ActionStatus_new" USING ("status"::text::"ActionStatus_new");
ALTER TYPE "ActionStatus" RENAME TO "ActionStatus_old";
ALTER TYPE "ActionStatus_new" RENAME TO "ActionStatus";
DROP TYPE "public"."ActionStatus_old";
ALTER TABLE "Action" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
