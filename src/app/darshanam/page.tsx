import DarshanamView from '@/components/darshanam/DarshanamView';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DarshanamPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <Suspense fallback={<DarshanamPageSkeleton />}>
        <DarshanamView />
      </Suspense>
    </div>
  );
}

function DarshanamPageSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white bg-black p-4">
      <Skeleton className="h-12 w-12 rounded-full mb-4 bg-gray-700" />
      <Skeleton className="h-6 w-1/2 mb-2 bg-gray-700" />
      <Skeleton className="h-4 w-3/4 bg-gray-700" />
      <p className="mt-4 text-sm text-gray-400">Loading Darshanam Experience...</p>
    </div>
  );
}
