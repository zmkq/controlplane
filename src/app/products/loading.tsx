import { CardSkeleton } from '@/components/skeletons/card-skeleton';

export default function Loading() {
  return <CardSkeleton count={9} columns={3} />;
}

