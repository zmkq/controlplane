import { PageLoadingShell } from '@/components/ui/page-loading-shell';

export default function Loading() {
  return (
    <PageLoadingShell
      contextLabel="Order ledger"
      accentLabel="Channel filters"
      items={5}
      layout="list"
      toolbarChips={6}
    />
  );
}

