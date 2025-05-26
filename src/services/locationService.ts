import { createClient } from '@supabase/supabase-js';
// For server-side operations, you'd import/create a server client
import { getServiceSupabase } from '@/lib/supabase/server';

const STALE_THRESHOLD_MINUTES = 60; // Location is stale if older than 1 hour

export interface SwamijiLocation {
  id?: number; // Or whatever your primary key is
  latitude: number;
  longitude: number;
  last_updated_at: string; // ISO date string
  // any other relevant fields
}

export interface LocationStatus {
  location: SwamijiLocation | null;
  isStale: boolean;
  message: string;
}

/**
 * Fetches Swamiji's latest location and determines if it's stale.
 */
export async function getSwamijiLocationStatus(): Promise<LocationStatus> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('swamiji_location') // YOUR ACTUAL TABLE NAME FOR SWAMIJI'S LOCATION
      .select('*')
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<SwamijiLocation>();

    if (error) {
      console.error("Error fetching Swamiji's location:", error);
      return { location: null, isStale: true, message: "Error fetching location data." };
    }

    if (!data) {
      return { location: null, isStale: true, message: "Swamiji's location is not currently available." };
    }

    const lastUpdate = new Date(data.last_updated_at);
    const now = new Date();
    const minutesSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    if (minutesSinceLastUpdate > STALE_THRESHOLD_MINUTES) {
      return { 
        location: data, 
        isStale: true, 
        message: `Swamiji's location was last updated ${Math.round(minutesSinceLastUpdate)} minutes ago and may need an update.` 
      };
    }

    return { location: data, isStale: false, message: "Swamiji's location is up to date." };

  } catch (e) {
    console.error("Unexpected error in getSwamijiLocationStatus:", e);
    return { location: null, isStale: true, message: "An unexpected error occurred while checking location." };
  }
}