import { PageLoadingShell } from '@/components/ui/page-loading-shell';

export default function Loading() {
  return (
    <PageLoadingShell
      contextLabel="Partner network"
      accentLabel="Node sync"
      items={6}
      layout="cards"
      toolbarChips={4}
    />
  );
}

