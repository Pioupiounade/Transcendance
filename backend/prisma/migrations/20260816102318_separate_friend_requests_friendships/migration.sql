/*
  Warnings:

  - The values [PENDING,ACCEPTED,REJECTED] on the enum `FriendshipStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Friendship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accepted_at` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `addressee_id` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `requester_id` on the `Friendship` table. All the data in the column will be lost.
  - Added the required column `user1_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "FriendshipStatus_new" AS ENUM ('ACTIVE', 'BLOCKED');
ALTER TABLE "public"."Friendship" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Friendship" ALTER COLUMN "status" TYPE "FriendshipStatus_new" USING ("status"::text::"FriendshipStatus_new");
ALTER TYPE "FriendshipStatus" RENAME TO "FriendshipStatus_old";
ALTER TYPE "FriendshipStatus_new" RENAME TO "FriendshipStatus";
DROP TYPE "public"."FriendshipStatus_old";
ALTER TABLE "Friendship" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_addressee_id_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_requester_id_fkey";

-- AlterTable
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_pkey",
DROP COLUMN "accepted_at",
DROP COLUMN "addressee_id",
DROP COLUMN "requester_id",
ADD COLUMN     "user1_id" BIGINT NOT NULL,
ADD COLUMN     "user2_id" BIGINT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY ("user1_id", "user2_id");

-- CreateTable
CREATE TABLE "FriendRequest" (
    "friend_request_id" BIGSERIAL NOT NULL,
    "requester_id" BIGINT NOT NULL,
    "addressee_id" BIGINT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("friend_request_id")
);

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
