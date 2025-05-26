import { NextRequest, NextResponse } from 'next/server';
// IMPORTANT: Use a Supabase client configured with the SERVICE_ROLE_KEY for admin operations
// This usually involves creating a separate Supabase client instance for server-side admin tasks.
// For example:
// import { createClient } from '@supabase/supabase-js';
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// Placeholder for actual Supabase admin client initialization
const getSupabaseAdminClient = () => {
  // Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase URL or Service Role Key is not configured for admin operations.");
  }
  // This is a simplified example; you might have a dedicated module for this
  const { createClient } = require('@supabase/supabase-js'); 
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
};


export async function POST(request: NextRequest) {
  // **IMPORTANT: Implement proper authentication/authorization here!**
  // For example, check for a secret token from your bot or an admin session.
  // const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  // if (authToken !== process.env.YOUR_BOT_SECRET_TOKEN) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid latitude or longitude provided.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Assuming you have one row for Swamiji's location or a known ID.
    // If you have multiple historical records, you might insert a new one.
    // This example upserts based on a known ID (e.g., 1) or creates if not exists.
    // Adjust the `id` or primary key logic as per your table structure.
    const { data, error } = await supabaseAdmin
      .from('swamiji_location') // YOUR ACTUAL TABLE NAME
      .upsert({ 
        // id: 1, // If you have a fixed ID for Swamiji's current location record
        latitude: latitude,
        longitude: longitude,
        last_updated_at: new Date().toISOString(),
       }, { onConflict: 'id' }) // Specify conflict resolution if 'id' is a unique constraint
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