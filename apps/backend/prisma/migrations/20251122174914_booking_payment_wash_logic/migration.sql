/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_CUSTOMER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_order_id_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_worker_id_service_code_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "items_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payment_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "payment_confirmed_by" BIGINT,
ADD COLUMN     "payment_notes" TEXT,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "washes_count" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'REQUESTED',
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "max_items_per_wash" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "price_per_wash" INTEGER NOT NULL DEFAULT 30;

-- DropTable
DROP TABLE "OrderItem";

-- CreateTable
CREATE TABLE "OrderPaymentProof" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "media_id" BIGINT NOT NULL,
    "uploaded_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPaymentProof_order_id_idx" ON "OrderPaymentProof"("order_id");

-- AddForeignKey
ALTER TABLE "OrderPaymentProof" ADD CONSTRAINT "OrderPaymentProof_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentProof" ADD CONSTRAINT "OrderPaymentProof_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentProof" ADD CONSTRAINT "OrderPaymentProof_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
