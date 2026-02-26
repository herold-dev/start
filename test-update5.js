import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  const query = `
    ALTER TABLE captures DROP CONSTRAINT captures_status_check;
    ALTER TABLE captures ADD CONSTRAINT captures_status_check CHECK (status IN ('agendada', 'realizada', 'cancelada', 'nao_agendada'));
    ALTER TABLE captures ALTER COLUMN capture_date DROP NOT NULL;
  `
  
  // NOTE: supabase.rpc only works if there's a stored function or running directly via PostgreSQL connection string
  // For safety, let's just make the changes directly through Postgres using pg package
}
run()
