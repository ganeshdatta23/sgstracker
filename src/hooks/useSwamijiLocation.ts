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
    setLoading(true);
    setError(null);
    console.log(`${LOG_PREFIX} Starting fetchLocation...`);
    try {
      const { data, error: supabaseError, status, count } = await supabase
        .from('locations')
        .select('*', { count: 'exact' })
        .eq('id', 'swamiji_location')
        .single();

      console.log(`${LOG_PREFIX} Supabase response:`, { status, supabaseError, data, count });

      if (supabaseError) {
        if (status === 406 || supabaseError.code === 'PGRST116') {
          console.warn(`${LOG_PREFIX} No location data found for id 'swamiji_location'. Supabase error:`, supabaseError.message);
          setLocationData(null);
        } else {
          console.error(`${LOG_PREFIX} Supabase error fetching location:`, supabaseError);
          setError(supabaseError);
        }
        setLocationData(null);
      } else if (data) {
        console.log(`${LOG_PREFIX} Data successfully received from Supabase for id 'swamiji_location':`, data);
        setLocationData({
          ...data,
          latitude: parseFloat(data.latitude as any),
          longitude: parseFloat(data.longitude as any),
          updatedAt: new Date(data.updated_at),
        });
        setError(null);
      } else {
        console.warn(`${LOG_PREFIX} No data returned from Supabase for id 'swamiji_location', but no explicit error. This is unusual.`);
        setLocationData(null);
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} Unexpected error in fetchLocation:`, err);
      setError(err as Error);
      setLocationData(null);
    } finally {
      setLoading(false);
      console.log(`${LOG_PREFIX} fetchLocation finished. Loading:`, false);
    }
  };

  return { locationData, loading, error };
}
