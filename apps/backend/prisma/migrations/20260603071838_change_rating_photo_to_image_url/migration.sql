/*
  Warnings:

  - You are about to drop the column `media_id` on the `RatingPhoto` table. All the data in the column will be lost.
  - Added the required column `image_url` to the `RatingPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RatingPhoto" DROP COLUMN "media_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image_url" TEXT NOT NULL;
