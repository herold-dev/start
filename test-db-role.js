import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function testRoleCheck() {
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return console.error(listError)
  
  const user = users.users.find(u => u.email === 'renata@startdigital.com' || u.user_metadata?.role === 'admin') || users.users[0]
  console.log('Testing for Auth User ID:', user.id, user.email, user.user_metadata)

  const { data: profile, error } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

  console.log('Profile DB Role:', profile, error)
}

testRoleCheck()
