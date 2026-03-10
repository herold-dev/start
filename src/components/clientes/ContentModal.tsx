import { useState, useEffect } from 'react'
import {
  X, Trash2, Link as LinkIcon,
  Play, Image as ImageIcon, Save,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import type {
  ClientContent, ClientContentInput,
  ContentType, ContentStatus, ContentChannel, Client
} from './types'
import { createContent, updateContent, deleteContent, deriveStatus } from '../../lib/clientContents'
import { RichTextEditor } from '../ui/RichTextEditor'
import DOMPurify from 'dompurify'

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  client?: Client | null
  content?: ClientContent | null
  defaultDate?: string
  onSave: (c: ClientContent) => void
  onDelete?: (id: string) => void
}

// ─── Utils ────────────────────────────────────────────────────────────────────
export function parseMediaUrls(urlsString?: string): string[] {
  if (!urlsString) return []
  try {
    const parsed = JSON.parse(urlsString)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // legacy string
    if (typeof urlsString === 'string' && urlsString.startsWith('http')) {
      return [urlsString]
    }
  }
  return []
}

export function getMediaInfo(url: string | undefined): { type: 'iframe' | 'image' | 'video', url: string } | null {
  if (!url) return null
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (driveMatch && driveMatch[1]) {
      // Official embed format for Google Drive:
      return { type: 'iframe', url: `https://drive.google.com/file/d/${driveMatch[1]}/preview?rm=minimal` }
    }
    return { type: 'iframe', url } // Fallback
  }
  
  // Check for common video formats
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return { type: 'video', url }
  }
  
  // Default to image
  return { type: 'image', url }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<ContentStatus, { label: string; bg: string; text: string; border: string }> = {
  rascunho:     { label: 'Rascunho',     bg: 'bg-gray-100',    text: 'text-gray-500',    border: 'border-gray-200' },
  em_aprovacao: { label: 'Em Aprovação', bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200' },
  ajuste:       { label: 'Ajuste',       bg: 'bg-orange-50',   text: 'text-orange-600',  border: 'border-orange-200' },
  aprovado:     { label: 'Aprovado',     bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
}

function StatusBadge({ status, onChange }: { status: ContentStatus; onChange: (s: ContentStatus) => void }) {
  const [open, setOpen] = useState(false)
  const s = STATUS_STYLE[status]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 border ${s.bg} ${s.text} ${s.border}`}
      >
        {s.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
            {(Object.keys(STATUS_STYLE) as ContentStatus[]).map(k => {
              const cfg = STATUS_STYLE[k]
              return (
                <button
                  key={k}
                  onClick={() => { onChange(k); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.bg.replace('50', '400').replace('100', '400').replace('bg-', 'bg-')}`} />
                  <span className={cfg.text}>{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}


// ─── Instagram Preview ─────────────────────────────────────────────────────────
export function InstagramPreview({ client, content }: { client?: Client | null; content: ClientContent | null | undefined }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Reset slide to 0 if content changes
  useEffect(() => {
    setCurrentSlide(0)
  }, [content?.midia_url])

  function getInitials(name: string) {
    return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??'
  }

  const isReels = content?.content_type === 'story' || content?.content_type === 'feed_e_story'
  const urls = parseMediaUrls(content?.midia_url)
  const isCarousel = urls.length > 1

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {client?.avatar_url ? (
            <img src={client.avatar_url} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${client?.gradient_from || '#8b5cf6'}, ${client?.gradient_to || '#6d28d9'})` }}
            >
              {client ? getInitials(client.name) : '??'}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-800 leading-none">{client?.social_handle?.replace('@', '') || client?.name || 'cliente'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{content?.status === 'aprovado' ? 'Pode Postar' : 'Rascunho'}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">···</button>
      </div>

      {/* Media area — proporção 4:5 (Instagram feed) ou 9:16 (Reels) */}
      <div
        className="relative w-full overflow-hidden flex flex-col items-center justify-center"
        style={{
          aspectRatio: isReels ? '9/16' : '4/5',
          background: `linear-gradient(135deg, ${client?.gradient_from || '#8b5cf6'}33, ${client?.gradient_to || '#6d28d9'}33)`,
        }}
      >
        {(() => {
          const targetUrl = urls.length > 0 ? urls[currentSlide] : undefined
          const media = getMediaInfo(targetUrl)

          return media ? (
            media.type === 'iframe' ? (
              <div className="w-full h-full relative group">
                <iframe src={media.url} className="w-full h-full border-0 absolute inset-0" allow="autoplay; encrypted-media" />
              </div>
            ) : media.type === 'video' || isReels ? (
              <video src={media.url} className="w-full h-full object-cover" />
            ) : (
              <img src={media.url} alt="preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              {content?.channel === 'video' ? (
                <Play className="w-10 h-10 opacity-40" />
              ) : (
                <ImageIcon className="w-10 h-10 opacity-40" />
              )}
              <p className="text-xs font-medium opacity-60">
                {content?.content_type === 'feed' ? 'Feed' :
                 content?.content_type === 'story' ? 'Story' :
                 content?.content_type === 'feed_e_story' ? 'Feed e Story' : 'Conteúdo'}
              </p>
            </div>
          )
        })()}

        {/* Carousel controls */}
        {isCarousel && urls.length > 1 && (
          <>
            {currentSlide > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => prev - 1) }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition-colors z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {currentSlide < urls.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => prev + 1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition-colors z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {/* Carousel dots indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
              {urls.map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-1.5 h-1.5 bg-blue-500' : 'w-1 h-1 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* content type badge */}
        <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5 z-20">
          <span className="text-white text-[9px] font-semibold uppercase tracking-wide">
            {content?.content_type || 'post'}
          </span>
        </div>

        {/* date badge */}
        {content?.scheduled_date && (
          <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-0.5 z-20">
            <span className="text-white text-[9px] font-medium">
              {new Date(content.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-gray-50">
        <div className="flex items-center gap-3 mb-1.5">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          <svg className="w-5 h-5 text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">0 curtidas</p>

        {/* Caption & Tema preview */}
        {(content?.legenda_content || content?.tema_content) && (
          <div className="mt-2 flex flex-col gap-3 pb-1">
            {content?.legenda_content && (
              <div className="text-[10px] text-gray-700 leading-relaxed inline">
                <span className="font-bold text-gray-900 mr-1">{client?.social_handle?.replace('@', '') || client?.name}</span>
                <span 
                  className="prose prose-sm max-w-none prose-p:inline prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.legenda_content) }} 
                />
              </div>
            )}
            
            {content?.tema_content && (
              <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-100/50">
                <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                  Tema / Direcionamento
                </p>
                <div 
                  className="text-[10px] text-gray-700 leading-relaxed prose prose-sm max-w-none prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-p:m-0 prose-ul:m-0 prose-ul:pl-4 prose-ol:m-0 prose-ol:pl-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.tema_content) }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab Bar ───────────────────────────────────────────────────────────────────
type EditorTab = 'tema' | 'conteudo' | 'midia' | 'legenda'

const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: 'tema', label: 'Tema' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'midia', label: 'Mídia' },
  { id: 'legenda', label: 'Legenda' },
]

// ─── Tab Card Button ───────────────────────────────────────────────────────────
function TabCard({
  tab, active, status, onClick,
}: {
  tab: { id: EditorTab; label: string }
  active: boolean
  status: ContentStatus
  onClick: () => void
}) {
  const st = STATUS_STYLE[status]
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 flex-1 px-3 py-3 rounded-2xl border-2 transition-all ${
        active
          ? 'border-purple-400 bg-purple-50/60 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <span className={`text-sm font-semibold ${active ? 'text-purple-700' : 'text-gray-600'}`}>
        {tab.label}
      </span>
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.text} ${st.border}`}>
        {st.label}
      </span>
    </button>
  )
}

// ─── Tema Tab ──────────────────────────────────────────────────────────────────
function TemaTab({
  temaContent, setTemaContent,
  channel, setChannel,
  contentType, setContentType,
  scheduledDate, setScheduledDate,
  ref1, setRef1, ref2, setRef2, ref3, setRef3,
}: {
  temaContent: string; setTemaContent: (v: string) => void
  channel: ContentChannel; setChannel: (v: ContentChannel) => void
  contentType: ContentType; setContentType: (v: ContentType) => void
  scheduledDate: string; setScheduledDate: (v: string) => void
  ref1: string; setRef1: (v: string) => void
  ref2: string; setRef2: (v: string) => void
  ref3: string; setRef3: (v: string) => void
}) {

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto flex-1">
      {/* Tema da Publicação */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Tema da Publicação</label>
        <RichTextEditor
          content={temaContent}
          onChange={setTemaContent}
          placeholder="Descreva o tema do conteúdo..."
          minHeight="120px"
        />
      </div>

      {/* Referências */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Referências</label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <input
              type="url"
              value={ref1}
              onChange={e => setRef1(e.target.value)}
              placeholder="Cole o link de referência..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition placeholder:text-gray-300"
            />
            {ref1 && (
              <a href={ref1} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-500 flex items-center gap-1 px-1 hover:underline truncate">
                <LinkIcon className="w-3 h-3 shrink-0" />
                {ref1.length > 50 ? ref1.slice(0, 50) + '...' : ref1}
              </a>
            )}
          </div>
          <input
            type="url"
            value={ref2}
            onChange={e => setRef2(e.target.value)}
            placeholder="Cole o segundo link de referência..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 transition placeholder:text-gray-300"
          />
          <input
            type="url"
            value={ref3}
            onChange={e => setRef3(e.target.value)}
            placeholder="Cole o terceiro link de referência..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 transition placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Mídia + Formato */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          <span className="font-medium text-gray-500 mr-1">Mídia:</span>
          <select
            value={channel}
            onChange={e => setChannel(e.target.value as ContentChannel)}
            className="font-semibold text-gray-800 bg-transparent outline-none cursor-pointer border-b border-dashed border-gray-300 hover:border-purple-400 transition"
          >
            <option value="video">Vídeo</option>
            <option value="imagem">Imagens</option>
          </select>
        </span>
        <span>
          <span className="font-medium text-gray-500 mr-1">Formato:</span>
          <select
            value={contentType}
            onChange={e => setContentType(e.target.value as ContentType)}
            className="px-2 py-0.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 bg-white outline-none cursor-pointer hover:border-purple-400 transition"
          >
            <option value="feed">Feed</option>
            <option value="story">Story</option>
            <option value="feed_e_story">Feed e Story</option>
          </select>
        </span>
        <span>
          <span className="font-medium text-gray-500 mr-1">Data*:</span>
          <input
            type="date"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            className="text-xs border-b border-dashed border-gray-300 bg-transparent outline-none cursor-pointer hover:border-purple-400 transition text-gray-700"
          />
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ContentModal({
  isOpen, onClose, clientId, client, content, defaultDate, onSave, onDelete
}: ContentModalProps) {
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState<ContentType>('feed')
  const [channel, setChannel] = useState<ContentChannel>('imagem')
  const [scheduledDate, setScheduledDate] = useState('')
  const [description, setDescription] = useState('')

  const [temaContent,     setTemaContent]    = useState('')
  const [temaStatus,      setTemaStatus]     = useState<ContentStatus>('rascunho')
  const [conteudoContent, setConteudoContent] = useState('')
  const [conteudoStatus,  setConteudoStatus]  = useState<ContentStatus>('rascunho')
  const [midiaUrls,       setMidiaUrls]      = useState<string[]>([])
  const [newMidiaUrl,     setNewMidiaUrl]    = useState('')
  const [midiaStatus,     setMidiaStatus]    = useState<ContentStatus>('rascunho')
  const [legendaContent,  setLegendaContent]  = useState('')
  const [legendaStatus,   setLegendaStatus]   = useState<ContentStatus>('rascunho')

  const [precisaCaptacao, setPrecisaCaptacao] = useState(false)

  const [ref1, setRef1] = useState('')
  const [ref2, setRef2] = useState('')
  const [ref3, setRef3] = useState('')

  const [activeTab, setActiveTab] = useState<EditorTab>('tema')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!content

  useEffect(() => {
    if (!isOpen) return
    if (content) {
      setTitle(content.title)
      setDescription(content.description || '')
      setContentType(content.content_type)
      setChannel(content.channel)
      setScheduledDate(content.scheduled_date || '')
      setTemaContent(content.tema_content || '')
      setTemaStatus(content.tema_status || 'rascunho')
      setConteudoContent(content.conteudo_content || '')
      setConteudoStatus(content.conteudo_status || 'rascunho')
      setMidiaUrls(parseMediaUrls(content.midia_url))
      setMidiaStatus(content.midia_status || 'rascunho')
      setLegendaContent(content.legenda_content || '')
      setLegendaStatus(content.legenda_status || 'rascunho')
      setPrecisaCaptacao(content.precisa_captacao || false)
    } else {
      setTitle('')
      setDescription('')
      setContentType('feed')
      setChannel('imagem')
      setScheduledDate(defaultDate || '')
      setTemaContent('')
      setTemaStatus('rascunho')
      setConteudoContent('')
      setConteudoStatus('rascunho')
      setMidiaUrls([])
      setNewMidiaUrl('')
      setMidiaStatus('rascunho')
      setLegendaContent('')
      setLegendaStatus('rascunho')
      setPrecisaCaptacao(false)
      setRef1('')
      setRef2('')
      setRef3('')
    }
    setActiveTab('tema')
  }, [isOpen, content, defaultDate])

  function getTabStatus(tab: EditorTab): ContentStatus {
    if (tab === 'tema') return temaStatus
    if (tab === 'conteudo') return conteudoStatus
    if (tab === 'midia') return midiaStatus
    return legendaStatus
  }

  function setTabStatus(tab: EditorTab, val: ContentStatus) {
    if (tab === 'tema') setTemaStatus(val)
    else if (tab === 'conteudo') setConteudoStatus(val)
    else if (tab === 'midia') setMidiaStatus(val)
    else setLegendaStatus(val)
  }

  function buildPreviewContent(): ClientContent {
    const base = content || ({} as ClientContent)
    const derived = deriveStatus({
      tema_status: temaStatus,
      conteudo_status: conteudoStatus,
      midia_status: midiaStatus,
      legenda_status: legendaStatus,
    })
    return {
      ...base,
      title,
      content_type: contentType,
      status: derived,
      channel,
      scheduled_date: scheduledDate || undefined,
      tema_content: temaContent,
      tema_status: temaStatus,
      conteudo_content: conteudoContent,
      conteudo_status: conteudoStatus,
      midia_url: midiaUrls.length > 0 ? JSON.stringify(midiaUrls) : undefined,
      midia_status: midiaStatus,
      legenda_content: legendaContent,
      legenda_status: legendaStatus,
      precisa_captacao: precisaCaptacao,
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      alert('O título é obrigatório.')
      return
    }
    if (!scheduledDate) {
      alert('A data de publicação é obrigatória.')
      return
    }
    setIsSaving(true)
    try {
      const payload: ClientContentInput = {
        client_id: clientId,
        title: title.trim(),
        description: description.trim() || undefined,
        content_type: contentType,
        // status derivado automaticamente dos tabs individuais
        status: deriveStatus({
          tema_status: temaStatus,
          conteudo_status: conteudoStatus,
          midia_status: midiaStatus,
          legenda_status: legendaStatus,
        }),
        channel,
        scheduled_date: scheduledDate || undefined,
        tema_content: temaContent,
        tema_status: temaStatus,
        conteudo_content: conteudoContent,
        conteudo_status: conteudoStatus,
        midia_url: midiaUrls.length > 0 ? JSON.stringify(midiaUrls) : undefined,
        midia_status: midiaStatus,
        legenda_content: legendaContent,
        legenda_status: legendaStatus,
        precisa_captacao: precisaCaptacao,
      }

      let saved: ClientContent | null
      if (isEditing && content) {
        saved = await updateContent(content.id, payload)
      } else {
        saved = await createContent(payload)
      }

      if (saved) {
        onSave(saved)
        onClose()
      } else {
        alert('Erro ao salvar conteúdo.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!content) return
    if (!confirm('Excluir este conteúdo?')) return
    const ok = await deleteContent(content.id)
    if (ok) {
      onDelete?.(content.id)
      onClose()
    }
  }

  if (!isOpen) return null

  const previewContent = buildPreviewContent()
  const isReels = contentType === 'story' || contentType === 'feed_e_story'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container — fullscreen mobile, large on desktop */}
      <div className="relative bg-[#f5f5f7] w-full sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-[95vh] sm:max-w-[1100px] overflow-hidden" style={{ maxHeight: '100dvh' }}>

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-200/60 bg-white shrink-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do conteúdo..."
            className="flex-1 text-base font-semibold text-gray-800 outline-none placeholder:text-gray-300"
          />
          <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden gap-0">

          {/* ── Top/Left: Instagram Preview ─────────────────────────────── */}
          {/* Em mobile fica colapsado acima do editor; em md+ vira sidebar */}
          <div
            className="flex flex-col items-center justify-start shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200/60 py-6 px-5 w-full md:w-auto h-auto md:h-full md:overflow-y-auto"
          >
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Preview</p>
            <div className="w-full max-w-[320px] md:max-w-none" style={{ width: isReels ? '320px' : '300px' }}>
              <InstagramPreview client={client} content={previewContent} />
            </div>
          </div>

          {/* ── Right: Editor ──────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-visible md:overflow-hidden min-h-[500px] md:min-h-0 bg-[#f5f5f7]">

            {/* Tab cards row — horizontal scroll no mobile */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#f5f5f7] sticky top-0 z-10 shrink-0 overflow-x-auto">
              {EDITOR_TABS.map(t => (
                <TabCard
                  key={t.id}
                  tab={t}
                  active={activeTab === t.id}
                  status={getTabStatus(t.id)}
                  onClick={() => setActiveTab(t.id)}
                />
              ))}
            </div>

            {/* Editor area — white card */}
            <div className="flex-1 mx-4 mb-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col overflow-hidden min-h-[500px] md:min-h-0 md:bg-white md:mb-0">

              {/* Toolbar (for text tabs) */}
              {/* Toolbar removida pois o RichTextEditor já possui a sua própria */}

              {/* TEMA */}
              {activeTab === 'tema' && (
                <TemaTab
                  temaContent={temaContent} setTemaContent={setTemaContent}
                  channel={channel} setChannel={setChannel}
                  contentType={contentType} setContentType={setContentType}
                  scheduledDate={scheduledDate} setScheduledDate={setScheduledDate}
                  ref1={ref1} setRef1={setRef1}
                  ref2={ref2} setRef2={setRef2}
                  ref3={ref3} setRef3={setRef3}
                />
              )}

              {/* CONTEÚDO */}
              {activeTab === 'conteudo' && (
                <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conteúdo</p>
                  </div>
                  <div className="flex-1 px-4 pb-4">
                    <RichTextEditor
                      content={conteudoContent}
                      onChange={setConteudoContent}
                      placeholder={`Roteiro do conteúdo (gravar com tripé, falando para a câmera):\n\nEscreva aqui o roteiro, texto do carrossel, script do reels...`}
                      minHeight="250px"
                    />
                  </div>
                </div>
              )}

              {/* MÍDIA */}
              {activeTab === 'midia' && (
                <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar Mídia (Google Drive ou Link Direto)</p>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newMidiaUrl}
                      onChange={e => setNewMidiaUrl(e.target.value)}
                      placeholder="Cole um link do Google Drive (preferencialmente pasta ou arquivo aberto) ou link direto..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      onClick={() => {
                        if (newMidiaUrl.trim()) {
                          setMidiaUrls(prev => [...prev, newMidiaUrl.trim()])
                          setNewMidiaUrl('')
                        }
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    {midiaUrls.map((url, idx) => {
                      const media = getMediaInfo(url)
                      return (
                        <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          {/* Mini Preview */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center relative">
                            {media ? (
                              media.type === 'iframe' ? (
                                <>
                                  <iframe src={media.url} className="w-full h-full border-0 pointer-events-none" tabIndex={-1} />
                                  <div className="absolute inset-0 bg-transparent z-10" />
                                </>
                              ) : media.type === 'video' ? (
                                <video src={media.url} className="w-full h-full object-cover" />
                              ) : (
                                <img
                                  src={media.url}
                                  alt={`Mídia ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )
                            ) : (
                              <span className="text-xs text-gray-400">Sem Preview</span>
                            )}
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0 h-20 justify-center">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 hover:text-purple-600 truncate flex items-center gap-1.5 mb-2 transition">
                              <LinkIcon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{url}</span>
                            </a>
                            <button
                              onClick={() => setMidiaUrls(prev => prev.filter((_, i) => i !== idx))}
                              className="text-xs text-red-500 hover:text-red-700 font-medium self-start px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              Remover mídia
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {midiaUrls.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl">
                        <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                        <p className="text-sm font-medium">Nenhuma mídia adicionada ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LEGENDA */}
              {activeTab === 'legenda' && (
                <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legenda</p>
                  </div>
                  <div className="flex-1 px-4 pb-4">
                    <RichTextEditor
                      content={legendaContent}
                      onChange={setLegendaContent}
                      placeholder={`Escreva aqui a legenda que será publicada na rede social.\n\nInclua emojis, hashtags, chamada para ação...`}
                      minHeight="400px"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="px-4 py-3 flex items-center gap-2 shrink-0">
              {isEditing && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              )}
              <div className="flex-1" />

              {/* Checkbox Precisa de Captação & Status */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${precisaCaptacao ? 'bg-pink-500 border-pink-500' : 'border-gray-300 group-hover:border-pink-400 bg-white'}`}>
                    {precisaCaptacao && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input
                    type="checkbox"
                    checked={precisaCaptacao}
                    onChange={e => setPrecisaCaptacao(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-700 select-none">📸 Precisa de Captação</span>
                </label>
                
                <span className="text-xs text-gray-400 hidden sm:inline ml-2">Status:</span>
                <StatusBadge
                  status={getTabStatus(activeTab)}
                  onChange={val => setTabStatus(activeTab, val)}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
