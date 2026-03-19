import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
let cachedActorId: string | null = null;

async function resolveAuditActorId() {
  if (cachedActorId) return cachedActorId;
  const actor = await prisma.user.findFirst({
    select: { id: true },
  });
  cachedActorId = actor?.id ?? null;
  return cachedActorId;
}

export async function createAuditLog(action: string, details: unknown) {
  const actorId = await resolveAuditActorId();
  if (!actorId) {
    console.warn('[audit] Skipping audit log because no users exist');
    return;
  }

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      details: JSON.parse(JSON.stringify(details ?? null)) as Prisma.InputJsonValue,
    },
  });
}
