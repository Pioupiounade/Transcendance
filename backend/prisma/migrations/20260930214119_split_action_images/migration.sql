/*
  Warnings:

  - You are about to drop the column `imagesList` on the `Action` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Action" DROP COLUMN "imagesList",
ADD COLUMN     "images_after" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images_before" TEXT[] DEFAULT ARRAY[]::TEXT[];
