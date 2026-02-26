import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function getCaptureTitleName(dateStr) {
  let d = new Date()
  if (dateStr) {
    const [y, m, day] = dateStr.split('-').map(Number)
    if (y && m) d = new Date(y, m - 1, day || 1)
  }
  const month = d.toLocaleDateString('pt-BR', { month: 'long' })
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1)
  return `Captação - ${monthCap} ${d.getFullYear()}`
}

async function createContent(input) {
  const finalInput = { ...input }

  if (finalInput.precisa_captacao) {
    const targetTitle = getCaptureTitleName(finalInput.scheduled_date)
    const { data: existingCapture, error: exErr } = await supabase
      .from('captures')
      .select('id')
      .eq('client_id', finalInput.client_id)
      .eq('status', 'nao_agendada')
      .eq('title', targetTitle)
      .limit(1)
      .maybeSingle()
      
    if (existingCapture) {
      finalInput.capture_id = existingCapture.id
    } else {
      const { data: newCapture, error: creatE } = await supabase
        .from('captures')
        .insert({
          client_id: finalInput.client_id,
          title: targetTitle,
          capture_date: '',
          status: 'nao_agendada',
          type: 'foto_video'
        })
        .select('id')
        .single()
      console.log('new cap?', newCapture, creatE)
      if (newCapture) finalInput.capture_id = newCapture.id
    }
  }

  const { data, error } = await supabase
    .from('client_contents')
    .insert(finalInput)
    .select()
    .single()

  return {data, error}
}

async function run() {
  const { data: clientData } = await supabase.from('clients').select('id').limit(1).single()
  
  const { data: newContent, error: cErr } = await createContent({
    client_id: clientData.id,
    title: 'Test Capture Generation 3',
    content_type: 'reels',
    precisa_captacao: true,
    scheduled_date: '2026-03-15'
  })

  console.log('Inserted Content Error:', cErr)
  console.log('Inserted Content Data:', !!newContent)

  const { data: capData, error: capErr } = await supabase.from('captures').select('*')
  console.log('Captures Data Length:', capData?.length)
}
run()
