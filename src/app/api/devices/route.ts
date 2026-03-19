import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type DeviceRow = {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  lastSeen: Date;
  createdAt: Date;
};

/**
 * GET /api/devices
 * Get all registered devices for the current user
 */
export async function GET() {
  try {
    const devices = await prisma.$queryRaw<DeviceRow[]>`
      SELECT "id", "deviceName", "deviceType", "lastSeen", "createdAt"
      FROM "PushSubscription"
      ORDER BY "lastSeen" DESC
    `;

    return NextResponse.json(
      devices.map((device: DeviceRow) => ({
        id: device.id,
        deviceName: device.deviceName || 'Unknown Device',
        deviceType: device.deviceType || 'desktop',
        lastSeen: device.lastSeen,
        createdAt: device.createdAt,
      }))
    );
  } catch (error) {
    console.error('[Devices] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/devices/:id
 * Update device name
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, deviceName } = body;

    if (!id || !deviceName) {
      return NextResponse.json(
        { error: 'id and deviceName are required' },
        { status: 400 }
      );
    }

    // Use raw query to bypass Prisma Client validation issues
    await prisma.$executeRaw`
      UPDATE "PushSubscription"
      SET "deviceName" = ${deviceName}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Devices] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices/:id
 * Remove a device
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Devices] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    );
  }
}
