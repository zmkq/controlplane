'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from '@/lib/i18n';

type AuditLog = {
  id: string;
  timestamp: Date;
  action: string;
  details: Prisma.JsonValue;
  user: { id: string; name: string | null; username: string } | null;
};

type AuditLogsClientProps = {
  auditLogs: AuditLog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  actionOptions: string[];
  actorOptions: { id: string; label: string }[];
  currentAction: string;
  currentActor: string;
  currentWindow: string;
};

const WINDOW_OPTIONS = [
  { value: '', label: 'All time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

function truncateJson(value: Prisma.JsonValue) {
  const serialized = JSON.stringify(value);
  if (serialized.length <= 96) {
    return serialized;
  }

  return `${serialized.slice(0, 93)}...`;
}

export function AuditLogsClient({
  auditLogs,
  totalCount,
  currentPage,
  totalPages,
  actionOptions,
  actorOptions,
  currentAction,
  currentActor,
  currentWindow,
}: AuditLogsClientProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const hasActiveFilters = Boolean(
    searchParams.get('q') || currentAction || currentActor || currentWindow,
  );

  const selectedDetails = useMemo(
    () => (selectedLog ? JSON.stringify(selectedLog.details, null, 2) : ''),
    [selectedLog],
  );

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set('page', '1');
    const query = params.toString();
    router.push(query ? `?${query}` : '/audit-logs');
  };

  const clearFilters = () => {
    router.push('/audit-logs');
  };

  return (
    <>
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t('auditLogs.title', 'Audit Logs')}
            </h1>
            <div className="text-sm text-muted-foreground">
              {t('auditLogs.totalRecords', 'Total Records')}: {totalCount}
            </div>
          </div>
          <div className="w-full xl:max-w-sm">
            <SearchInput
              placeholder={t('auditLogs.searchPlaceholder', 'Search logs...')}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <select
              value={currentAction}
              onChange={(event) => updateFilter('action', event.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-foreground">
              <option value="">
                {t('auditLogs.filters.allActions', 'All actions')}
              </option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              value={currentActor}
              onChange={(event) => updateFilter('actor', event.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-foreground">
              <option value="">
                {t('auditLogs.filters.allActors', 'All users')}
              </option>
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>

            <select
              value={currentWindow}
              onChange={(event) => updateFilter('window', event.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-foreground">
              {WINDOW_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {t(`auditLogs.filters.window.${option.value || 'all'}`, option.label)}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-white/10 bg-white/5 hover:bg-white/10">
                {t('auditLogs.clearFilters', 'Clear filters')}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
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
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground">
                    {hasActiveFilters
                      ? t(
                          'auditLogs.noLogsFiltered',
                          'No logs match the current filters.',
                        )
                      : t('auditLogs.noLogs', 'No logs found.')}
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user?.name || log.user?.username || t('auditLogs.systemUser', 'System')}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left font-mono text-xs text-muted-foreground transition hover:border-white/20 hover:bg-white/5 hover:text-foreground">
                        {truncateJson(log.details)}
                      </button>
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

      <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-black/90">
          <DialogHeader>
            <DialogTitle>
              {selectedLog?.action ?? t('auditLogs.dialog.title', 'Audit details')}
            </DialogTitle>
            {selectedLog && (
              <p className="text-sm text-muted-foreground">
                {selectedLog.timestamp.toLocaleString()} ·{' '}
                {selectedLog.user?.name || selectedLog.user?.username || t('auditLogs.systemUser', 'System')}
              </p>
            )}
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-muted-foreground">
            {selectedDetails}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
