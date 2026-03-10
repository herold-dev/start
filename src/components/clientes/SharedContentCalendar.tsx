import { useState, useMemo } from 'react'
import { Search, ChevronDown, LayoutGrid, Image } from 'lucide-react'

import { SharedContentModal } from './SharedContentModal'
import { deriveStatus } from '../../lib/clientContents'
import type { ClientContent, Client, ContentStatus } from './types'

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

// Renderizador simplificado do Card sem data para o Kanban do Cliente
const STATUS_CONFIG: Record<ContentStatus, { label: string; bg: string; text: string; border: string }> = {
  rascunho:     { label: 'Rascunho', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-l-gray-300' },
  em_aprovacao: { label: 'Em Aprovação', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-l-yellow-400' },
  ajuste:       { label: 'Ajuste', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-l-orange-400' },
  aprovado:     { label: 'Aprovado', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-l-emerald-500' },
}

function PublicThemeCard({ content, onClick }: { content: ClientContent, onClick: (c: ClientContent) => void }) {
  const derivedStatus = deriveStatus(content)
  const statusCfg = STATUS_CONFIG[derivedStatus]

  return (
    <button
      onClick={() => onClick(content)}
      className={`w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-400 border-l-[4px] ${statusCfg.border}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
      </div>

      <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-3">
        {content.title || 'Sem título'}
      </p>

      {/* Detalhe de Formato */}
      <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 self-start">
        {content.channel === 'video' ? (
          <span className="text-gray-600 text-xs font-semibold">Vídeo</span>
        ) : (
          <span className="text-gray-600 text-xs font-semibold">Imagem</span>
        )}
      </div>
    </button>
  )
}

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

  // Filtered
  const filtered = useMemo(() => {
    return contents.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterChannel && c.channel !== filterChannel) return false
      if (filterStatus && c.status !== filterStatus) return false
      return true
    })
  }, [contents, search, filterChannel, filterStatus])

  // Separando o quadro temático via Feed e Story (Mapear "feed", "story", e compatibilidade legada)
  const columns = useMemo(() => {
    const feedPosts = filtered.filter(c => {
      const type = c.content_type as string
      return type === 'feed' || type === 'carrossel' || type === 'estatico' || type === 'feed_e_story'
    })

    const storyPosts = filtered.filter(c => {
      const type = c.content_type as string
      return type === 'story' || type === 'reels' || type === 'feed_e_story'
    })

    const outosPosts = filtered.filter(c => {
      const type = c.content_type as string
      return !type || (type !== 'feed' && type !== 'carrossel' && type !== 'estatico' && type !== 'story' && type !== 'reels' && type !== 'feed_e_story')
    })
    
    return [
      { id: 'feed', title: 'Temas para o Feed', icon: <LayoutGrid className="w-4 h-4 text-purple-600" />, items: feedPosts },
      { id: 'story', title: 'Temas para Story', icon: <Image className="w-4 h-4 text-pink-600" />, items: storyPosts },
      ...(outosPosts.length > 0 ? [{ id: 'outros', title: 'Outros Formatos', icon: <LayoutGrid className="w-4 h-4 text-gray-600" />, items: outosPosts }] : [])
    ]
  }, [filtered])

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

      <div className="flex flex-col sm:flex-row items-baseline justify-between mt-2 mb-4 gap-4">
        <h2 className="text-2xl font-bold border-b-[3px] border-purple-400 pb-1 text-gray-800 capitalize tracking-tight">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        
        <div className="flex gap-4 mb-2 sm:mb-0">
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl text-purple-700 font-bold border border-purple-100">
            <LayoutGrid className="w-5 h-5" />
            <span className="text-lg">{columns.find(c => c.id === 'feed')?.items.length || 0}</span>
            <span className="text-sm font-medium">De Feed</span>
          </div>
          <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-xl text-pink-700 font-bold border border-pink-100">
            <Image className="w-5 h-5" />
            <span className="text-lg">{columns.find(c => c.id === 'story')?.items.length || 0}</span>
            <span className="text-sm font-medium">De Story</span>
          </div>
        </div>
      </div>

      {/* Board View Temático */}
      <div className="flex flex-col md:flex-row gap-6 md:overflow-x-auto pb-4 md:snap-x custom-scrollbar min-h-[500px]">
        {columns.map(col => (
          <div key={col.id} className="w-full md:flex-none md:w-[360px] bg-gray-50/50 rounded-2xl border border-gray-100 p-5 md:snap-start flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar shadow-sm">
            
            {/* Cabeçalho da Coluna (TEMA) */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60 sticky top-0 bg-gray-50/90 backdrop-blur z-10 pt-1">
              <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm shrink-0">
                 {col.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{col.title}</h3>
              </div>
            </div>

            {/* Lista de Cards da Semana */}
            <div className="flex flex-col gap-3">
              {col.items.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white/50 border border-gray-200 border-dashed rounded-xl">
                  <p className="text-sm text-gray-400 font-medium">Nenhum tema planejado.</p>
                </div>
              ) : (
                col.items.map(c => (
                  <PublicThemeCard key={c.id} content={c} onClick={handleContentClick} />
                ))
              )}
            </div>
            
          </div>
        ))}
      </div>



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
