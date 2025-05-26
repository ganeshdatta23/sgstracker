"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SwamijiLocationClient } from '@/lib/types';

const LOG_PREFIX = "[useSwamijiLocation]";

export function useSwamijiLocation() {
  const [locationData, setLocationData] = useState<SwamijiLocationClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log(`${LOG_PREFIX} Hook initializing. Attempting to connect to Supabase.`);

    // Initial fetch
    fetchLocation();

    // Set up real-time subscription
    const subscription = supabase
      .channel('location_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations'
        },
        async (payload) => {
          console.log(`${LOG_PREFIX} Real-time update received:`, payload);
          await fetchLocation();
        }
      )
      .subscribe();

    return () => {
      console.log(`${LOG_PREFIX} Cleaning up Supabase subscription`);
      subscription.unsubscribe();
    };
  }, []);

  const fetchLocation = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', 'swamiji_location')
        .single();

      if (supabaseError) throw supabaseError;

      if (data) {
        console.log(`${LOG_PREFIX} Data received from Supabase:`, data);
        setLocationData({
          ...data,
          updatedAt: new Date(data.updated_at),
        });
      } else {
        console.warn(`${LOG_PREFIX} No location data found in Supabase.`);
        setLocationData(null);
      }
      setError(null);
    } catch (err) {
      console.error(`${LOG_PREFIX} Error fetching location from Supabase:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { locationData, loading, error };
}
