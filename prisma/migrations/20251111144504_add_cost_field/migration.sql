/*
  Warnings:

  - You are about to drop the column `markup` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `msrp` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "markup",
DROP COLUMN "msrp",
ADD COLUMN     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;
