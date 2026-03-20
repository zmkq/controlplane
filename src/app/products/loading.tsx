import { PageLoadingShell } from '@/components/ui/page-loading-shell';

export default function Loading() {
  return (
    <PageLoadingShell
      contextLabel="Inventory command"
      accentLabel="Catalog hydration"
      items={8}
      layout="cards"
    />
  );
}

