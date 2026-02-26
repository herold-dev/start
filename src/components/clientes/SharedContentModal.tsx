import { InstagramPreview, getMediaInfo, parseMediaUrls } from './ContentModal'
import type { Client, ClientContent } from './types'
import { X, Calendar, Link as LinkIcon } from 'lucide-react'

interface SharedContentModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  content: ClientContent | null
}

function ReadOnlyTextSection({ title, contentValue }: { title: string, contentValue?: string | null }) {
  return (
    <div className="flex flex-col gap-2 shrink-0 min-h-[120px] border-b border-gray-100 last:border-0 pb-6">
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 pb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {contentValue ? contentValue : <span className="text-gray-400 italic">Nenhum texto preenchido.</span>}
      </div>
    </div>
  )
}

function ReadOnlyMediaSection({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null

  return (
    <div className="flex flex-col flex-1 border-b border-gray-100 last:border-0 pb-6">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100/50 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mídias do Post</p>
          <p className="text-xs text-gray-400 mt-1">Exibindo mídias anexadas</p>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {urls.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 mt-4 px-5">
        {urls.map((url, idx) => {
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
                    <img src={media.url} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover" />
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SharedContentModal({
  isOpen,
  onClose,
  client,
  content
}: SharedContentModalProps) {
  if (!isOpen || !content) return null

  const isReels = content.content_type === 'reels'
  const midiaUrls = parseMediaUrls(content?.midia_url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container — fullscreen mobile, large on desktop */}
      <div className="relative bg-[#f5f5f7] w-full sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-[95vh] sm:max-w-[1100px] overflow-hidden" style={{ maxHeight: '100dvh' }}>

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-200/60 bg-white shrink-0">
          <div className="flex-1 flex flex-col min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">
              {content.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {content.scheduled_date && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide">
                  <Calendar className="w-3 h-3" />
                  {new Date(content.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
              {content.status && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-widest ${
                  content.status === 'aprovado' ? 'bg-emerald-100 text-emerald-700' :
                  content.status === 'em_aprovacao' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {content.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="ml-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 p-2 shrink-0 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden gap-0">

          {/* ── Left: Instagram Preview ─────────────────────────────── */}
          <div className="flex flex-col items-center justify-start shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200/60 py-6 px-5 w-full md:w-auto h-auto md:h-full md:overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Preview (Aprovação Visual)</p>
            <div className="w-full max-w-[320px] md:max-w-none" style={{ width: isReels ? '320px' : '300px' }}>
              <InstagramPreview client={client} content={content} />
            </div>
          </div>

          {/* ── Right: Details using Original Layout Native Styles ──────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-visible md:overflow-y-auto bg-white">
            <ReadOnlyTextSection title="Tema Oculto / Direcionamento" contentValue={content.tema_content} />
            <ReadOnlyTextSection title="Conteúdo / Roteiro" contentValue={content.conteudo_content} />
            <ReadOnlyMediaSection urls={midiaUrls} />
            <ReadOnlyTextSection title="Legenda Oficial" contentValue={content.legenda_content} />
          </div>
        </div>

      </div>
    </div>
  )
}
