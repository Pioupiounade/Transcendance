-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "blocked_by_user_id" BIGINT;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_blocked_by_user_id_fkey" FOREIGN KEY ("blocked_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
