-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "action_comments" DROP CONSTRAINT "action_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_comments" DROP CONSTRAINT "organization_comments_user_id_fkey";

-- AlterTable
ALTER TABLE "Action" ALTER COLUMN "creator_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "creator_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "action_comments" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organization_comments" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_comments" ADD CONSTRAINT "action_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_comments" ADD CONSTRAINT "organization_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
