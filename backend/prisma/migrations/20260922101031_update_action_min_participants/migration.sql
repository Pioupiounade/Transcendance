/*
  Warnings:

  - Made the column `min_participants` on table `Action` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Action" ALTER COLUMN "min_participants" SET NOT NULL,
ALTER COLUMN "min_participants" SET DEFAULT 3;
