/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AIConversation` table. All the data in the column will be lost.
  - You are about to drop the column `workerId` on the `AIConversation` table. All the data in the column will be lost.
  - Added the required column `worker_id` to the `AIConversation` table without a default value. This is not possible if the table is not empty.
  - Made the column `pickup_apartment_house` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `delivery_apartment_house` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AIConversation" DROP CONSTRAINT "AIConversation_workerId_fkey";

-- DropIndex
DROP INDEX "AIConversation_workerId_idx";

-- AlterTable
ALTER TABLE "AIConversation" DROP COLUMN "createdAt",
DROP COLUMN "workerId",
ADD COLUMN     "worker_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "pickup_apartment_house" SET NOT NULL,
ALTER COLUMN "delivery_apartment_house" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkerService" ADD COLUMN     "base_price" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AIConversation_worker_id_idx" ON "AIConversation"("worker_id");

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
