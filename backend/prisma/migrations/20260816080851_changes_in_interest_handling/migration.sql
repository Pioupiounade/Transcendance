/*
  Warnings:

  - The primary key for the `UserInterest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `interest_id` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the `Interest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `interest` to the `UserInterest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('ENV_FLOWER_POWER', 'ENV_CLEAN', 'ENV_DO', 'SOCIAL_SHARE', 'SOCIAL_MEET', 'SOCIAL_DO', 'CULTURAL_LEARN', 'CULTURAL_CREATE', 'CULTURAL_DO');

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_interest_id_fkey";

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_user_id_fkey";

-- AlterTable
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_pkey",
DROP COLUMN "interest_id",
ADD COLUMN     "interest" "InterestCategory" NOT NULL,
ADD CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("user_id", "interest");

-- DropTable
DROP TABLE "Interest";

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
