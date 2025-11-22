-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_orders_per_day" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "min_notice_minutes" INTEGER NOT NULL DEFAULT 120;
