import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  const { data, error } = await supabase
    .from('captures')
    .select('*, client_contents(id, title, precisa_captacao)')
  
  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}
run()
