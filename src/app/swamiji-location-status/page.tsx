import { Suspense } from 'react';
import { getSwamijiLocationStatus, LocationStatus } from '@/services/locationService';
import LocationStatusClient from './LocationStatusClient';

export const dynamic = 'force-dynamic';

export default async function SwamijiLocationStatusPage() {
  const status = await getSwamijiLocationStatus();

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Swamiji's location status...</div>}>
      <LocationStatusClient initialStatus={status} />
    </Suspense>
  );
}