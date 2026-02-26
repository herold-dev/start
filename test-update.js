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
  const { data: clientData } = await supabase.from('clients').select('id').limit(1).single()
  
  if (!clientData) return console.log('no client')

  const { data: newContent, error: cErr } = await supabase.from('client_contents').insert({
    client_id: clientData.id,
    title: 'Test Capture Generation',
    content_type: 'reels',
    precisa_captacao: true
  }).select().single()

  console.log('Inserted Content Error:', cErr)
  console.log('Inserted Content Data:', newContent)

  const { data: capData, error: capErr } = await supabase.from('captures').select('*')
  console.log('Captures Data:', capData)
  console.log('Captures Err:', capErr)
}
run()
