/*
  Warnings:

  - You are about to drop the `MediaAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaVariant` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'AI');

-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "MediaVariant" DROP CONSTRAINT "MediaVariant_media_id_fkey";

-- DropForeignKey
ALTER TABLE "OrderPaymentProof" DROP CONSTRAINT "OrderPaymentProof_media_id_fkey";

-- DropForeignKey
ALTER TABLE "RatingPhoto" DROP CONSTRAINT "RatingPhoto_media_id_fkey";

-- DropTable
DROP TABLE "MediaAsset";

-- DropTable
DROP TABLE "MediaVariant";

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" BIGSERIAL NOT NULL,
    "workerId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" BIGSERIAL NOT NULL,
    "conversationId" BIGINT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIConversation_workerId_idx" ON "AIConversation"("workerId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
