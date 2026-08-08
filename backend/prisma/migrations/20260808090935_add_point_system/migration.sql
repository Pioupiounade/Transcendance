-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('ACTION_CREATED', 'ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ORGANIZATION_JOINED');

-- CreateEnum
CREATE TYPE "PiouPiouStatus" AS ENUM ('PETIT_PIOUPIOU', 'GRAND_PIOUPIOU', 'PIOUPIOU_OR');

-- CreateTable
CREATE TABLE "PointTransaction" (
    "point_transaction_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" "PointReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("point_transaction_id")
);

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
