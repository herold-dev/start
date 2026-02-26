import dotenv from 'dotenv'
import { readFileSync } from 'fs'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

async function testFetch() {
  const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/manage-team`
  console.log('Fetching', url)

  // Use the anon key to simulate a lack of a user session initially, 
  // or a fake JWT to see the rejection reason.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ action: 'update', id: '123' })
  })

  console.log('Status:', res.status)
  const text = await res.text()
  console.log('Response:', text)
}

testFetch()
