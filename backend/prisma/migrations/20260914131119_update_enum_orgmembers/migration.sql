/*
  Warnings:

  - The values [APPROVED] on the enum `MemberStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BANNED');
ALTER TABLE "public"."OrganizationMember" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrganizationMember" ALTER COLUMN "status" TYPE "MemberStatus_new" USING ("status"::text::"MemberStatus_new");
ALTER TYPE "MemberStatus" RENAME TO "MemberStatus_old";
ALTER TYPE "MemberStatus_new" RENAME TO "MemberStatus";
DROP TYPE "public"."MemberStatus_old";
ALTER TABLE "OrganizationMember" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
