-- CreateEnum
CREATE TYPE "OrderExpenseCategory" AS ENUM ('SHAKER', 'PACKAGING', 'HANDLING', 'GIFT_WRAP', 'RUSH_FEE', 'MISC');

-- AlterTable
ALTER TABLE "SaleOrder" ADD COLUMN     "customCostOverride" DOUBLE PRECISION,
ADD COLUMN     "customProfitOverride" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "OrderExpense" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "category" "OrderExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderExpense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderExpense" ADD CONSTRAINT "OrderExpense_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
