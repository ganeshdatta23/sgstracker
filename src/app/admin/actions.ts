"use server";

import { z } from 'zod';
import type { SwamijiLocation } from '@/lib/types';
import { getServiceSupabase } from '@/lib/supabase';

// Create a Supabase client with the service role key for admin operations
const supabase = getServiceSupabase();

const locationSchema = z.object({
  urlOrCoords: z.string().min(3, "URL or Coordinates are required."),
  addressName: z.string().optional(),
  secretToken: z.string().min(1, "Secret token is required."),
});

const ADMIN_TOKEN = "Appaji@1942";

interface UpdateLocationResult {
  success: boolean;
  message: string;
}
const LOG_PREFIX = "[AdminActions]";

// Basic function to parse coordinates from string "lat,lng"
function parseDirectCoordinates(coordsStr: string): { latitude: number; longitude: number } | null {
  const parts = coordsStr.split(',').map(s => s.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

// Enhanced function to parse coordinates from Google Maps URL
function parseGoogleMapsUrl(url: string): { latitude: number; longitude: number } | null {
  // Pattern 1: @lat,lng in path (common in share links or when viewing a point)
  // e.g., https://www.google.com/maps/@34.0522,-118.2437,15z
  // e.g., https://www.google.com/maps/place/Disneyland+Park/@33.8121,-117.9190,17z
  let match = url.match(/@([-?\d\.]+),([-?\d\.]+)/);
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 4 (from original code, reordered): !3d<lat>!4d<lng> in path data segments (common in complex URLs/directions)
  // e.g. .../data=!4m8!1m0!1m5!1m1!1s0x0:0x0!2m2!1d-118.2437!2d34.0522...
  // This regex looks for !3d followed by numbers (latitude) and !4d followed by numbers (longitude)
  match = url.match(/!3d([-?\d\.]+)[^!]*!4d([-?\d\.]+)/); // Made the middle part more flexible
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }
  
  // Try parsing as a full URL for query parameters only if it's a valid URL structure
  try {
    const urlObj = new URL(url); // Attempt to parse the URL string
    const queryParams = urlObj.searchParams;

    // Pattern 2: q=lat,lng or query=lat,lng in query params
    // e.g., https://www.google.com/maps?q=34.0522,-118.2437
    const qParam = queryParams.get('q') || queryParams.get('query');
    if (qParam) {
      const coords = parseDirectCoordinates(qParam); // Reuse direct coordinate parsing logic
      if (coords) return coords;
    }
    
    // Pattern 3: ll=lat,lng in query params
    // e.g. https://www.google.com/maps?ll=34.0522,-118.2437
    const llParam = queryParams.get('ll');
    if (llParam) {
        const coords = parseDirectCoordinates(llParam); // Reuse
        if (coords) return coords;
    }
  } catch (e) {
    // This catch block is for errors from `new URL(url)` if the URL string is malformed.
    // It doesn't mean coordinates weren't found, just that the string wasn't a valid URL for `new URL()`.
    // Patterns 1 and (the reordered) 4 (regex on raw string) would have already been attempted.
    // console.warn("Input string could not be parsed as a standard URL. Query parameter parsing skipped. Error:", e instanceof Error ? e.message : String(e));
  }
  
  return null;
}


export async function updateLocation(formData: FormData): Promise<UpdateLocationResult> {
  console.log(`${LOG_PREFIX} updateLocation action invoked.`);
  
  const rawData = Object.fromEntries(formData.entries());
  console.log(`${LOG_PREFIX} Raw form data:`, rawData);

  // First validate the admin token
  if (rawData.secretToken !== ADMIN_TOKEN) {
    console.error(`${LOG_PREFIX} Invalid admin token`);
    return { success: false, message: "Invalid admin token" };
  }

  const validationResult = locationSchema.safeParse(rawData);
  if (!validationResult.success) {
    console.error(`${LOG_PREFIX} Form data validation failed:`, validationResult.error.flatten());
    return { success: false, message: validationResult.error.errors[0].message };
  }

  const { urlOrCoords, addressName } = validationResult.data;

  // Parse location
  let location: { latitude: number; longitude: number } | null;
  let googleMapsUrl: string | null = null;

  if (urlOrCoords.startsWith('http')) {
    location = parseGoogleMapsUrl(urlOrCoords);
    googleMapsUrl = urlOrCoords;
  } else {
    location = parseDirectCoordinates(urlOrCoords);
    if (location) {
      googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }
  }

  if (!location) {
    return { 
      success: false, 
      message: "Could not parse coordinates from the provided URL or coordinate string" 
    };
  }
  try {
    console.log(`${LOG_PREFIX} Attempting to update location with:`, {
      id: 'swamiji_location',
      latitude: location.latitude,
      longitude: location.longitude,
      address: addressName || null,
      googleMapsUrl
    });

    const { error, data } = await supabase
      .from('locations')
      .upsert({
        id: 'swamiji_location',
        latitude: location.latitude,
        longitude: location.longitude,
        address: addressName || null,
        googleMapsUrl,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`${LOG_PREFIX} Supabase error:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`${LOG_PREFIX} Location updated successfully:`, data);
    return { 
      success: true, 
      message: "Location updated successfully!" 
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Database error:`, error);
    const errorMessage = error instanceof Error 
      ? `Update failed: ${error.message}` 
      : "Failed to update location";
    return { 
      success: false, 
      message: errorMessage
    };
  }
}
