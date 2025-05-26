import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create the default client with anonymous key (for client-side operations)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Create a client with service role key (for server-side operations)
export const getServiceSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for service client')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}
