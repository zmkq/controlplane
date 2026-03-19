import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AuditLogsClient } from '@/components/audit-logs/audit-logs-client';

type SearchParams = Record<string, string | string[] | undefined>;
type AuditLogsPageProps = {
  searchParams?: Promise<SearchParams>;
};

const TIME_WINDOWS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
} as const;

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = (await searchParams) ?? {};
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const queryValue = Array.isArray(params.q) ? params.q[0] : params.q;
  const actionValue = Array.isArray(params.action) ? params.action[0] : params.action;
  const actorValue = Array.isArray(params.actor) ? params.actor[0] : params.actor;
  const windowValue = Array.isArray(params.window) ? params.window[0] : params.window;

  const currentPage = Math.max(1, Number(pageValue ?? '1') || 1);
  const searchQuery = queryValue ?? '';
  const currentAction = actionValue ?? '';
  const currentActor = actorValue ?? '';
  const currentWindow =
    windowValue && windowValue in TIME_WINDOWS ? windowValue : '';
  const pageSize = 20;

  const where: Prisma.AuditLogWhereInput = {};
  if (searchQuery) {
    where.OR = [
      { action: { contains: searchQuery, mode: 'insensitive' } },
      { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { id: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (currentAction) {
    where.action = currentAction;
  }

  if (currentActor) {
    where.userId = currentActor;
  }

  if (currentWindow) {
    where.timestamp = {
      // eslint-disable-next-line react-hooks/purity
      gte: new Date(Date.now() - TIME_WINDOWS[currentWindow as keyof typeof TIME_WINDOWS]),
    };
  }

  const [auditLogs, totalCount, actionOptions, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
      },
      orderBy: [{ name: 'asc' }, { username: 'asc' }],
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuditLogsClient
      auditLogs={auditLogs}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      actionOptions={actionOptions.map((item) => item.action)}
      actorOptions={users.map((user) => ({
        id: user.id,
        label: user.name?.trim() || user.username,
      }))}
      currentAction={currentAction}
      currentActor={currentActor}
      currentWindow={currentWindow}
    />
  );
}
