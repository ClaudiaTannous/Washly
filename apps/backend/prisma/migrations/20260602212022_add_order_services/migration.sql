-- CreateTable
CREATE TABLE "OrderService" (
    "order_id" BIGINT NOT NULL,
    "service_code" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderService_pkey" PRIMARY KEY ("order_id","service_code")
);

-- AddForeignKey
ALTER TABLE "OrderService" ADD CONSTRAINT "OrderService_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderService" ADD CONSTRAINT "OrderService_service_code_fkey" FOREIGN KEY ("service_code") REFERENCES "ServiceCatalog"("service_code") ON DELETE RESTRICT ON UPDATE CASCADE;
