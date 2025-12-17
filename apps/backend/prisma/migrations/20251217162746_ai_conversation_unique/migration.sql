/*
  Warnings:

  - A unique constraint covering the columns `[worker_id]` on the table `AIConversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AIConversation_worker_id_key" ON "AIConversation"("worker_id");
