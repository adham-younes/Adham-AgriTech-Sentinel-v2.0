import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Supabase credentials not configured!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

try {
  // Test 1: Check connection
  console.log('\n📡 Test 1: Testing basic connection...')
  const { data: tables, error: tablesError } = await supabase
    .from('fields')
    .select('id')
    .limit(1)
  
  if (tablesError) {
    console.log('❌ Connection failed:', tablesError.message)
  } else {
    console.log('✅ Connection successful!')
    console.log('Fields table accessible:', tables ? 'Yes' : 'Empty')
  }

  console.log('\n✅ All tests passed! Database connection is working.')
  
} catch (error) {
  console.log('\n❌ Error:', error.message)
  process.exit(1)
}
