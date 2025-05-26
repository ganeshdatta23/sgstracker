import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  try {
    const sql = readFileSync(join(__dirname, '..', 'migrations', 'init.sql'), 'utf8')
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

main()
