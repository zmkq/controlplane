'use client';

import type { Prisma } from '@prisma/client';
import { useTranslations } from '@/lib/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchInput } from '@/components/ui/search-input';

type AuditLog = {
  id: string;
  timestamp: Date;
  action: string;
  details: Prisma.JsonValue;
  user: { name: string | null } | null;
};

type AuditLogsClientProps = {
  auditLogs: AuditLog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export function AuditLogsClient({
  auditLogs,
  totalCount,
  currentPage,
  totalPages,
}: AuditLogsClientProps) {
  const { t } = useTranslations();

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('auditLogs.title', 'Audit Logs')}
          </h1>
          <div className="text-sm text-muted-foreground">
            {t('auditLogs.totalRecords', 'Total Records')}: {totalCount}
          </div>
        </div>
        <div className="w-full md:w-72">
          <SearchInput placeholder={t('auditLogs.searchPlaceholder', 'Search logs...')} />
        </div>
      </div>
      
      <div className="rounded-md border border-white/10 bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-white/5 border-white/10">
              <TableHead className="text-muted-foreground">
                {t('auditLogs.table.timestamp', 'Timestamp')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('auditLogs.table.user', 'User')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('auditLogs.table.action', 'Action')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('auditLogs.table.details', 'Details')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {t('auditLogs.noLogs', 'No logs found.')}
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-white/5 border-white/10">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.timestamp.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.user?.name ?? t('auditLogs.systemUser', 'System')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground">
                    {JSON.stringify(log.details)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        hasNextPage={currentPage < totalPages}
        hasPrevPage={currentPage > 1}
        totalPages={totalPages}
      />
    </div>
  );
}
