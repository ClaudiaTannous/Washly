-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pickup_lat" DOUBLE PRECISION,
ADD COLUMN     "pickup_lng" DOUBLE PRECISION,
ADD COLUMN     "delivery_lat" DOUBLE PRECISION,
ADD COLUMN     "delivery_lng" DOUBLE PRECISION;
