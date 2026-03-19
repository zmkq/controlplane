import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export type QRScanStatus = 'PENDING' | 'SCANNING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface QRScanSession {
  id: string;
  deviceId: string;
  status: QRScanStatus;
  scannedValue: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Create a new QR scan session
 */
/**
 * Create a new QR scan session
 */
export async function createScanSession(deviceId: string): Promise<QRScanSession> {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
  const id = randomUUID();
  
  // Use raw query to bypass Prisma Client validation issues
  await prisma.$executeRaw`
    INSERT INTO "QRScanSession" (
      "id", "deviceId", "status", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${deviceId}, 'PENDING', ${expiresAt}, NOW(), NOW()
    )
  `;

  return {
    id,
    deviceId,
    status: 'PENDING',
    scannedValue: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt,
  };
}

/**
 * Get session by ID
 */
export async function getScanSession(sessionId: string): Promise<QRScanSession | null> {
  const sessions = await prisma.$queryRaw<any[]>`
    SELECT "id", "deviceId", "status", "scannedValue", "createdAt", "updatedAt", "expiresAt"
    FROM "QRScanSession"
    WHERE "id" = ${sessionId}
    LIMIT 1
  `;

  const session = sessions[0];
  if (!session) return null;

  // Check if expired
  if (new Date(session.expiresAt) < new Date() && session.status === 'PENDING') {
    await prisma.$executeRaw`
      UPDATE "QRScanSession"
      SET "status" = 'EXPIRED', "updatedAt" = NOW()
      WHERE "id" = ${sessionId}
    `;
    return { ...session, status: 'EXPIRED' } as QRScanSession;
  }

  return session as QRScanSession;
}

/**
 * Update session status
 */
export async function updateScanSession(
  sessionId: string,
  status: QRScanStatus,
  scannedValue?: string
): Promise<QRScanSession> {
  if (scannedValue !== undefined) {
    await prisma.$executeRaw`
      UPDATE "QRScanSession"
      SET "status" = ${status}::"QRScanStatus", "scannedValue" = ${scannedValue}, "updatedAt" = NOW()
      WHERE "id" = ${sessionId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "QRScanSession"
      SET "status" = ${status}::"QRScanStatus", "updatedAt" = NOW()
      WHERE "id" = ${sessionId}
    `;
  }

  // Fetch updated session to return
  const session = await getScanSession(sessionId);
  if (!session) throw new Error('Session not found after update');
  
  return session;
}

/**
 * Cancel a scan session
 */
export async function cancelScanSession(sessionId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "QRScanSession"
    SET "status" = 'CANCELLED', "updatedAt" = NOW()
    WHERE "id" = ${sessionId}
  `;
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(userAgent?: string): boolean {
  if (!userAgent) {
    // Server-side check
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
    return 'tablet';
  }
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}
