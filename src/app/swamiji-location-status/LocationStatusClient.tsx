'use client';

import { LocationStatus } from '@/services/locationService';

interface LocationStatusClientProps {
  initialStatus: LocationStatus;
}

export default function LocationStatusClient({ initialStatus }: LocationStatusClientProps) {
  // This is a placeholder. You'll need to construct the actual link/mechanism
  // for your bot. This link might include pre-filled information or just be
  // a general link to your bot with instructions.
  const botUpdateTriggerLink = `https://t.me/YOUR_BOT_USERNAME?start=updateSwamijiLocation`;

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="prose prose-lg dark:prose-invert">
        <h1 className="text-3xl font-bold mb-6">Swamiji's Location Status</h1>
        <p className="mb-4"><strong>Status:</strong> {initialStatus.message}</p>
        
        {initialStatus.location && (
          <div className="bg-card p-6 rounded-lg shadow-sm space-y-2">
            <p><strong>Last Known Latitude:</strong> {initialStatus.location.latitude}</p>
            <p><strong>Last Known Longitude:</strong> {initialStatus.location.longitude}</p>
            <p><strong>Last Updated At:</strong> {new Date(initialStatus.location.last_updated_at).toLocaleString()}</p>
          </div>
        )}

        {initialStatus.isStale && (
          <div className="mt-8 border border-warning p-6 rounded-lg bg-warning/10">
            <p className="font-semibold text-warning mb-2">Action Required: Swamiji's location needs to be updated.</p>
            <p className="mb-4">Please send the update link to the designated person or bot:</p>
            <a 
              href={botUpdateTriggerLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Trigger Bot Update
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 