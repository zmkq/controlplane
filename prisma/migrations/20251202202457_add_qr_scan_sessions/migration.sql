-- CreateEnum
CREATE TYPE "QRScanStatus" AS ENUM ('PENDING', 'SCANNING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- CreateTable
CREATE TABLE "QRScanSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" "QRScanStatus" NOT NULL DEFAULT 'PENDING',
    "scannedValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRScanSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QRScanSession" ADD CONSTRAINT "QRScanSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
