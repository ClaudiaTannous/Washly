-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "street_name" TEXT NOT NULL,
    "building_number" INTEGER,
    "apartment_house_number" INTEGER,
    "floor_number" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" BIGINT NOT NULL,
    "is_professional" BOOLEAN NOT NULL DEFAULT false,
    "pickup_available" BOOLEAN NOT NULL DEFAULT false,
    "delivery_available" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "image_url" TEXT,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerBusinessHours" (
    "worker_id" BIGINT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_hhmm" TEXT NOT NULL,
    "end_hhmm" TEXT NOT NULL,

    CONSTRAINT "WorkerBusinessHours_pkey" PRIMARY KEY ("worker_id","day_of_week","start_hhmm")
);

-- CreateTable
CREATE TABLE "ServiceCatalog" (
    "service_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "default_proximate_turnaround_hours" INTEGER,
    "description" TEXT,
    "delicate_fabric" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("service_code")
);

-- CreateTable
CREATE TABLE "WorkerService" (
    "worker_id" BIGINT NOT NULL,
    "service_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_price" DECIMAL(65,30) NOT NULL,
    "min_qty" DECIMAL(65,30),
    "max_qty" DECIMAL(65,30),
    "turnaround_proximate_hours" INTEGER,
    "notes" TEXT,

    CONSTRAINT "WorkerService_pkey" PRIMARY KEY ("worker_id","service_code")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" BIGSERIAL NOT NULL,
    "customer_user_id" BIGINT NOT NULL,
    "worker_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "pickup_city" TEXT NOT NULL,
    "pickup_street" TEXT NOT NULL,
    "pickup_building" INTEGER,
    "pickup_apartment_house" INTEGER,
    "pickup_floor" INTEGER,
    "delivery_city" TEXT NOT NULL,
    "delivery_street" TEXT NOT NULL,
    "delivery_building" INTEGER,
    "delivery_apartment_house" INTEGER,
    "delivery_floor" INTEGER,
    "scheduled_pickup" TIMESTAMP(3),
    "scheduled_dropoff" TIMESTAMP(3),
    "payment_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "worker_id" BIGINT NOT NULL,
    "service_code" TEXT NOT NULL,
    "item_type" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" BIGSERIAL NOT NULL,
    "owner_user_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "checksum_sha1" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" BIGSERIAL NOT NULL,
    "media_id" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "bytes" BIGINT,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "rater_id" BIGINT NOT NULL,
    "rated_worker" BIGINT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingPhoto" (
    "id" BIGSERIAL NOT NULL,
    "rating_id" BIGINT NOT NULL,
    "media_id" BIGINT NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RatingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrderItem_service_code_idx" ON "OrderItem"("service_code");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_order_id_key" ON "Rating"("order_id");

-- CreateIndex
CREATE INDEX "RatingPhoto_rating_id_idx" ON "RatingPhoto"("rating_id");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerBusinessHours" ADD CONSTRAINT "WorkerBusinessHours_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerService" ADD CONSTRAINT "WorkerService_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerService" ADD CONSTRAINT "WorkerService_service_code_fkey" FOREIGN KEY ("service_code") REFERENCES "ServiceCatalog"("service_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_worker_id_service_code_fkey" FOREIGN KEY ("worker_id", "service_code") REFERENCES "WorkerService"("worker_id", "service_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rated_worker_fkey" FOREIGN KEY ("rated_worker") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingPhoto" ADD CONSTRAINT "RatingPhoto_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingPhoto" ADD CONSTRAINT "RatingPhoto_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
