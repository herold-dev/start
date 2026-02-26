import { useState, useMemo } from 'react'
import { Search, ChevronDown, LayoutGrid, Calendar } from 'lucide-react'
import { ContentCard } from './ContentCard'
import { WeeklyContentCard } from './WeeklyContentCard'
import { SharedContentModal } from './SharedContentModal'
import type { ClientContent, Client } from './types'

interface SharedContentCalendarProps {
  client: Client | null
  contents: ClientContent[]
  currentDate: Date
}

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os canais' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_aprovacao', label: 'Em Aprovação' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'aprovado', label: 'Aprovado' },
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function SharedContentCalendar({
  client,
  contents,
  currentDate,
}: SharedContentCalendarProps) {
  const [search, setSearch] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ClientContent | null>(null)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('weekly')
  // Filtered
  const filtered = useMemo(() => {
    return contents.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterChannel && c.channel !== filterChannel) return false
      if (filterStatus && c.status !== filterStatus) return false
      return true
    })
  }, [contents, search, filterChannel, filterStatus])

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Monthly View (sempre calcula para popular as semanas corretamente depois)
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay() 

    const days: { date: Date; inMonth: boolean; dateStr: string }[] = []

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, inMonth: false, dateStr: d.toISOString().split('T')[0] })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push({ date, inMonth: true, dateStr: date.toISOString().split('T')[0] })
    }
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, inMonth: false, dateStr: d.toISOString().split('T')[0] })
    }

    return days
  }, [currentDate])

  const weeklyColumns = useMemo(() => {
    const weeks: { weekName: string; dateRange: string; days: typeof calendarDays }[] = []
    let currentWeekNum = 1
    
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7)
      const validDays = weekDays.filter(d => d.inMonth)
      if (validDays.length === 0) continue

      const firstValid = validDays[0]
      const lastValid = validDays[validDays.length - 1]
      
      const formatLabel = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', '')
      const rangeStr = `${formatLabel(firstValid.date)} - ${formatLabel(lastValid.date)}`
      
      weeks.push({
        weekName: `Semana ${currentWeekNum}`,
        dateRange: rangeStr,
        days: weekDays
      })
      currentWeekNum++
    }
    return weeks
  }, [calendarDays])

  const contentsByDate = useMemo(() => {
    const map: Record<string, ClientContent[]> = {}
    filtered.forEach(c => {
      if (c.scheduled_date) {
        const key = c.scheduled_date
        if (!map[key]) map[key] = []
        map[key].push(c)
      }
    })
    return map
  }, [filtered])

  const today = new Date().toISOString().split('T')[0]

  function handleContentClick(c: ClientContent) {
    setSelectedContent(c)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Filter bar */}
      <div className="bg-gray-50/70 p-1.5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-2">
        <div className="flex bg-white rounded-xl border border-gray-200 flex-1 px-3 py-2 items-center focus-within:ring-2 focus-within:ring-purple-500/20 transition-all w-full shadow-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-2 w-full outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Channel filter */}
        <div className="relative">
          <select
            value={filterChannel}
            onChange={e => setFilterChannel(e.target.value)}
            className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 font-medium cursor-pointer shadow-sm outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-7 min-w-[150px]"
          >
            {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* View mode toggle */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'weekly' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Semana
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'monthly' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Mês
          </button>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 font-medium cursor-pointer shadow-sm outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-7 min-w-[150px]"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {viewMode === 'monthly' ? (
        /* Calendar Grid */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayContents = contentsByDate[day.dateStr] || []
              const isToday = day.dateStr === today

              return (
                <div
                  key={i}
                  className={`min-h-[120px] border-b border-r border-gray-50 p-1.5 flex flex-col gap-1 transition-colors ${
                    day.inMonth ? 'bg-white' : 'bg-gray-50/50'
                  } ${isToday ? 'ring-2 ring-inset ring-purple-400/50' : ''}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between px-1 pt-0.5 mb-0.5">
                    <span className={`text-xs font-semibold ${
                      !day.inMonth ? 'text-gray-300' :
                      isToday ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Content cards */}
                  {dayContents.slice(0, 3).map(c => (
                    <ContentCard key={c.id} content={c} onClick={handleContentClick} />
                  ))}
                  {dayContents.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-medium px-1">
                      +{dayContents.length - 3} mais
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Weekly Board View (Kanban) */
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 md:snap-x custom-scrollbar">
          {weeklyColumns.map((week, idx) => {
            const weekContents = week.days.flatMap(d => contentsByDate[d.dateStr] || [])
            
            return (
              <div key={idx} className="w-full md:flex-none md:w-[320px] bg-gray-50/50 rounded-2xl border border-gray-100 p-4 md:snap-start flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar shadow-sm">
                
                {/* Cabeçalho da Coluna (Semanas) */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{week.weekName}</h3>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{week.dateRange}</p>
                  </div>
                </div>

                {/* Lista de Cards da Semana */}
                <div className="flex flex-col gap-3">
                  {weekContents.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-white/50 border border-gray-200 border-dashed rounded-xl">
                      <p className="text-sm text-gray-400 font-medium">Nenhum post agendado para esta semana.</p>
                    </div>
                  ) : (
                    weekContents.map(c => (
                      <WeeklyContentCard key={c.id} content={c} onClick={handleContentClick} />
                    ))
                  )}
                </div>
                
              </div>
            )
          })}
        </div>
      )}

      {/* Read-Only Modal */}
      <SharedContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={client}
        content={selectedContent}
      />
    </div>
  )
}
