import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AuditLogsClient } from '@/components/audit-logs/audit-logs-client';

type SearchParams = Record<string, string | string[] | undefined>;
type AuditLogsPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = (await searchParams) ?? {};
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const queryValue = Array.isArray(params.q) ? params.q[0] : params.q;
  const currentPage = Number(pageValue ?? '1');
  const searchQuery = queryValue ?? '';
  const pageSize = 20;

  const where: Prisma.AuditLogWhereInput = {};
  if (searchQuery) {
    where.OR = [
      { action: { contains: searchQuery, mode: 'insensitive' } },
      { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { id: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  const [auditLogs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuditLogsClient
      auditLogs={auditLogs}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
