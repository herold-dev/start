import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, ChevronDown, Share2, CheckCheck, Globe, Link as LinkIcon, Lock, X, LayoutGrid, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { MonthPicker } from '../ui/MonthPicker'
import { ContentCard } from './ContentCard'
import { WeeklyContentCard } from './WeeklyContentCard'
import { ContentModal } from './ContentModal'
import { deriveStatus } from '../../lib/clientContents'
import type { ClientContent, ContentStatus, Client } from './types'

interface ContentCalendarProps {
  clientId: string
  client?: Client | null
  contents: ClientContent[]
  currentDate: Date
  onDateChange: (d: Date) => void
  onContentSave: (c: ClientContent) => void
  onContentDelete: (id: string) => void
}

const STATUS_LABELS: { key: ContentStatus; label: string; color: string }[] = [
  { key: 'rascunho', label: 'Rascunho', color: 'text-gray-500' },
  { key: 'em_aprovacao', label: 'Em Aprovação', color: 'text-amber-500' },
  { key: 'ajuste', label: 'Ajuste', color: 'text-orange-500' },
  { key: 'aprovado', label: 'Aprovado', color: 'text-emerald-600' },
]

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas as mídias' },
  { value: 'video', label: 'Vídeo' },
  { value: 'imagem', label: 'Imagem' },
]

const FORMAT_LABELS = [
  { key: 'feed', label: 'Feed' },
  { key: 'story', label: 'Story' },
  { key: 'feed_e_story', label: 'Feed/Story' },
]

const MEDIA_LABELS = [
  { key: 'video', label: 'Vídeo' },
  { key: 'imagem', label: 'Imagem' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_aprovacao', label: 'Em Aprovação' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'aprovado', label: 'Aprovado' },
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ContentCalendar({
  clientId,
  client,
  contents,
  currentDate,
  onDateChange,
  onContentSave,
  onContentDelete,
}: ContentCalendarProps) {
  const [search, setSearch] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isContentModalOpen, setIsContentModalOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<ClientContent | null>(null)
  const [newContentDate, setNewContentDate] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isSharedLoading, setIsSharedLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('weekly')
  // Local state for immediate reflect without requiring a full fetch
  const [sharedActive, setSharedActive] = useState(client?.shared_calendar_active || false)

  useEffect(() => {
    if (client) {
      setSharedActive(client.shared_calendar_active || false)
    }
  }, [client])

  const shareUrl = `${window.location.origin}/c/${clientId}?month=${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  function handleCopyShareURL() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  async function toggleShareStatus() {
    setIsSharedLoading(true)
    const newStatus = !sharedActive
    const { error } = await supabase
      .from('clients')
      .update({ shared_calendar_active: newStatus })
      .eq('id', clientId)
    
    if (!error) {
      setSharedActive(newStatus)
    }
    setIsSharedLoading(false)
  }

  // Stats — derivados dos status individuais das abas
  const stats = useMemo(() => {
    const s: Record<string, number> = { 
      rascunho: 0, em_aprovacao: 0, ajuste: 0, aprovado: 0,
      total: 0, feed: 0, story: 0, feed_e_story: 0, video: 0, imagem: 0
    }
    contents.forEach(c => {
      const derived = deriveStatus(c)
      s[derived] = (s[derived] || 0) + 1
      
      s.total++
      // Contabilizando formatos e mídias
      const type = c.content_type as string
      
      if (type === 'reels' || type === 'story') {
        s.story = (s.story || 0) + 1
      }
      if (type === 'feed' || type === 'carrossel' || type === 'estatico') {
        s.feed = (s.feed || 0) + 1
      }
      if (type === 'feed_e_story') {
        s.feed_e_story = (s.feed_e_story || 0) + 1
      }
      
      const ch = c.channel as string
      if (ch === 'video' || ch === 'tiktok' || ch === 'youtube') {
        s.video = (s.video || 0) + 1 
      }
      if (ch === 'imagem' || ch === 'instagram' || ch === 'linkedin') {
        s.imagem = (s.imagem || 0) + 1
      }
    })
    return s
  }, [contents])

  // Filtered
  const filtered = useMemo(() => {
    return contents.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterChannel && c.channel !== filterChannel) return false
      if (filterStatus && c.status !== filterStatus) return false
      return true
    })
  }, [contents, search, filterChannel, filterStatus])

  // Calendar grid calculation (always calculates the full month to group into weeks later)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Semper calcula o mês inteiro para podermos dividir em semanas no modo board
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay() // 0=Dom

    const days: { date: Date; inMonth: boolean; dateStr: string }[] = []

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, inMonth: false, dateStr: d.toISOString().split('T')[0] })
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push({ date, inMonth: true, dateStr: date.toISOString().split('T')[0] })
    }
    // Next month fill to complete 6 rows max (42 cells) or at least 5 rows (35)
    // Para Kanban, preencher até fechar a última semana completa.
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, inMonth: false, dateStr: d.toISOString().split('T')[0] })
    }

    return days
  }, [currentDate])

  // Agrupar dias em Semanas para a visualização Kanban
  const weeklyColumns = useMemo(() => {
    const weeks: { weekName: string; dateRange: string; days: typeof calendarDays }[] = []
    
    // Obter o número base da semana do ano ou do mês. Vamos usar um contador simples para o mês.
    let currentWeekNum = 1
    
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7)
      // Encontrar o primeiro e último dia que caem dentro do mês para o label
      const validDays = weekDays.filter(d => d.inMonth)
      if (validDays.length === 0) continue // Pula semanas totalmente fora do mês

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

  // Group contents by date
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

  function openNewContent(dateStr?: string) {
    setEditingContent(null)
    setNewContentDate(dateStr || '')
    setIsContentModalOpen(true)
  }

  function openEditContent(c: ClientContent) {
    setEditingContent(c)
    setNewContentDate('')
    setIsContentModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats + MonthPicker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthPicker currentDate={currentDate} onChange={onDateChange} />

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            {STATUS_LABELS.map(s => (
              <div key={s.key} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
          
          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800">{stats.total || 0}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total</p>
            </div>
            {FORMAT_LABELS.map(f => (
              <div key={f.key} className="text-center">
                <p className="text-xl font-bold text-gray-700">{stats[f.key] || 0}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-4">
            {MEDIA_LABELS.map(m => (
              <div key={m.key} className="text-center">
                <p className="text-xl font-bold text-gray-700">{stats[m.key] || 0}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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

        <button
          onClick={() => setIsShareModalOpen(true)}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-sm text-sm whitespace-nowrap border ${
             sharedActive 
               ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
               : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {sharedActive ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4 text-gray-400" />}
          Compartilhamento
        </button>

        {/* New content Button */}
        <button
          onClick={() => openNewContent()}
          className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-sm text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Conteúdo
        </button>
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
                    {day.inMonth && (
                      <button
                        onClick={() => openNewContent(day.dateStr)}
                        className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        style={{ opacity: undefined }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '')}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Content cards */}
                  {dayContents.slice(0, 3).map(c => (
                    <ContentCard key={c.id} content={c} onClick={openEditContent} />
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
            // Reúne todos os conteúdos dessa semana ordenados pelo dia
            const weekContents = week.days.flatMap(d => contentsByDate[d.dateStr] || [])
            
            return (
              <div key={idx} className="w-full md:flex-none md:w-[320px] bg-gray-50/50 rounded-2xl border border-gray-100 p-4 md:snap-start flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar shadow-sm">
                
                {/* Cabeçalho da Coluna (Semanas) */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{week.weekName}</h3>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{week.dateRange}</p>
                  </div>
                  <button
                    onClick={() => openNewContent(week.days.find(d => d.inMonth)?.dateStr || '')}
                    className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de Cards da Semana */}
                <div className="flex flex-col gap-3">
                  {weekContents.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-white/50 border border-gray-200 border-dashed rounded-xl">
                      <p className="text-sm text-gray-400 font-medium">Nenhum post agendado para esta semana.</p>
                    </div>
                  ) : (
                    weekContents.map(c => (
                      <WeeklyContentCard key={c.id} content={c} onClick={openEditContent} />
                    ))
                  )}
                </div>
                
              </div>
            )
          })}
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Compartilhar Calendário</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Apenas posts "Em Aprovação" ou "Aprovado" aparecerão no link.
                </p>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">Acesso Público</span>
                <span className="text-[11px] text-gray-500">{sharedActive ? 'O link está ativo e visível para o cliente.' : 'O link está bloqueado/privado.'}</span>
              </div>
              <button
                onClick={toggleShareStatus}
                disabled={isSharedLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${sharedActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sharedActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Link Copy */}
            <div className={`flex flex-col gap-2 transition-opacity ${!sharedActive ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-sm font-semibold text-gray-700">Link de Visualização Mensal</span>
              <div className="flex items-center p-1 pl-3 bg-gray-50 border border-gray-200 rounded-xl">
                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="bg-transparent text-sm text-gray-600 flex-1 outline-none truncate" 
                />
                <button
                  onClick={handleCopyShareURL}
                  className="ml-2 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center min-w-[90px] shadow-sm transition-colors text-gray-700 gap-1.5"
                >
                  {isCopied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Content Modal */}
      <ContentModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        clientId={clientId}
        client={client}
        content={editingContent}
        defaultDate={newContentDate}
        onSave={onContentSave}
        onDelete={onContentDelete}
      />
    </div>
  )
}
