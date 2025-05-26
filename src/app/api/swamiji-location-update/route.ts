import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure your environment variables are correctly named and loaded.
// These should match what's used in telegram-webhook/route.ts and your Vercel project settings.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Or SUPABASE_URL if that's your standard
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.error("Supabase URL or Service Role Key is not configured for admin operations. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  // Depending on your error handling strategy, you might throw an error here
  // or handle it gracefully in the POST request.
}

export async function POST(request: NextRequest) {
  // **IMPORTANT: Implement proper authentication/authorization here!**
  // For example, check for a secret token from your bot or an admin session.
  // const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  // if (authToken !== process.env.YOUR_BOT_SECRET_TOKEN) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database client not initialized. Check server configuration.' }, { status: 500 });
  }

  try {
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid latitude or longitude provided.' }, { status: 400 });
    }

    // Assuming you have one row for Swamiji's location or a known ID.
    // If you have multiple historical records, you might insert a new one.
    // This example upserts based on a known ID (e.g., 1) or creates if not exists.
    // Adjust the `id` or primary key logic as per your table structure.
    // Using 'id' as an example PK. If your table has a different PK or composite key, adjust onConflict.
    // If you want to always insert a new record, use .insert() instead of .upsert().
    const { data, error } = await supabaseAdmin
      .from('swamiji_location') // YOUR ACTUAL TABLE NAME
      .upsert({ 
        // id: 1, // If you have a fixed ID for Swamiji's current location record. Or remove if PK is auto-generated and you insert.
        latitude: latitude,
        longitude: longitude,
        last_updated_at: new Date().toISOString(),
       }, { 
         onConflict: 'id', // Specify the column(s) that cause a conflict for upsert.
         // ignoreDuplicates: false, // Set to true if you want to ignore insert on conflict. Default is false (update).
       })
      .select();

    if (error) {
      console.error("Supabase error updating location:", error);
      return NextResponse.json({ error: 'Failed to update location in database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Swamiji's location updated successfully.", data }, { status: 200 });
  } catch (e: any) {
    console.error("API error updating location:", e);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Simplified Swamiji Location Update OK (GET)' });
}