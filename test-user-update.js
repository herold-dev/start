import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

async function testUpdate() {
  const { data: users } = await supabase.from('usuarios').select('*').limit(1)
  if (!users || users.length === 0) {
    console.log('No users to test.')
    return
  }

  const userToTest = users[0]
  console.log('Testing on user:', userToTest)

  const { data, error } = await supabase
    .from('usuarios')
    .update({ nome: userToTest.nome + ' Teste' })
    .eq('id', userToTest.id)
    .select()
    
  console.log('Error:', error)
  console.log('Updated:', data)
}

testUpdate()
