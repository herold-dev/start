import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SharedContentCalendar } from '../components/clientes/SharedContentCalendar'
import type { Client, ClientContent } from '../components/clientes/types'
import { Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SharedCalendarPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM
  
  const [client, setClient] = useState<Client | null>(null)
  const [contents, setContents] = useState<ClientContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // O Date que controla a renderização do calendário
  const [currentDate, setCurrentDate] = useState(() => {
    const [year, month] = monthParam.split('-').map(Number)
    if (year && month) return new Date(year, month - 1, 1)
    return new Date()
  })

  // Sincroniza currentDate com a URL se a URL mudar (voltar/avançar no navegador)
  useEffect(() => {
    const [y, m] = (searchParams.get('month') || '').split('-').map(Number)
    if (y && m) {
      setCurrentDate(new Date(y, m - 1, 1))
    }
  }, [searchParams])

  useEffect(() => {
    if (!id) return

    async function loadData() {
      setIsLoading(true)
      setError(null)
      try {
        const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

        const { data, error } = await supabase.functions.invoke('shared-calendar', {
          body: { clientId: id, month: yearMonth }
        })

        if (error) throw error

        setClient(data.client)
        setContents(data.contents)
      } catch (err: any) {
        console.error('Failed to load shared calendar:', err)
        setError('Não foi possível carregar o calendário. O link pode estar incorreto ou o cliente indisponível.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, currentDate])

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }

  // Permite ao cliente navegar entre meses via Picker 
  // (faz nova chamada a Edge Function a cada navegação)
  function handleDateChange(newDate: Date) {
    setCurrentDate(newDate)
    // idealmente atualizariamos a URL tbm p/ refletir, mas como é read-only, 
    // deixar local no state já funciona bem pro cliente explorar
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Calendário Indisponível</h2>
        <p className="text-gray-500 max-w-sm">{error || 'Cliente não encontrado.'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Header (Simplified versions of ClientDetailHeader) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          {client.avatar_url ? (
            <img
              src={client.avatar_url}
              alt={client.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${client.gradient_from}, ${client.gradient_to})` }}
            >
              {getInitials(client.name)}
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 leading-none">{client.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-sm text-gray-500 font-medium">Calendário de Conteúdo</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              {client.social_handle && (
                <span className="text-sm text-gray-400">@{client.social_handle.replace('@', '')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Read-only Calendar */}
        <SharedContentCalendar
          client={client}
          contents={contents}
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />

        {/* Start Digital Footer brand */}
        <div className="text-center py-8">
           <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
              Powered by 
              <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">Start Digital</span>
           </p>
        </div>

      </div>
    </div>
  )
}
