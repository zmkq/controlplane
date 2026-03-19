import { Suspense } from 'react';
import { ScanPageClient } from './scan-client';

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ScanPageClient />
    </Suspense>
  );
}
