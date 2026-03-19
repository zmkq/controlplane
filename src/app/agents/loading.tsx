import { CardSkeleton } from '@/components/skeletons/card-skeleton';

export default function Loading() {
  return <CardSkeleton count={6} columns={3} />;
}

