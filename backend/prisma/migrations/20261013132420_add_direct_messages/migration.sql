-- CreateTable
CREATE TABLE "DirectMessage" (
    "message_id" BIGSERIAL NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "content" VARCHAR(280) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_sender_id_receiver_id_created_at_idx" ON "DirectMessage"("sender_id", "receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "DirectMessage_receiver_id_sender_id_created_at_idx" ON "DirectMessage"("receiver_id", "sender_id", "created_at");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
