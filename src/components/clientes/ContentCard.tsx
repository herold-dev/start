import { Image, Film, LayoutGrid, CheckCircle2, AlertCircle, Clock, Edit3 } from 'lucide-react'
import { deriveStatus } from '../../lib/clientContents'
import type { ClientContent } from './types'

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  carrossel: { label: 'Carrossel', bg: 'bg-purple-100', text: 'text-purple-700', icon: <LayoutGrid className="w-3 h-3" /> },
  estatico:  { label: 'Estático', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <Image className="w-3 h-3" /> },
  reels:     { label: 'Reels', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Film className="w-3 h-3" /> },
}

const STATUS_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  rascunho:     { icon: <Edit3 className="w-3 h-3" />, color: 'text-gray-400' },
  em_aprovacao: { icon: <Clock className="w-3 h-3" />, color: 'text-amber-500' },
  ajuste:       { icon: <AlertCircle className="w-3 h-3" />, color: 'text-orange-500' },
  aprovado:     { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500' },
}

interface ContentCardProps {
  content: ClientContent
  onClick: (c: ClientContent) => void
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const type = TYPE_CONFIG[content.content_type] || TYPE_CONFIG.carrossel

  // Status derivado dos tabs individuais (não do campo geral)
  const derived = deriveStatus(content)
  const statusCfg = STATUS_ICON[derived]

  return (
    <button
      onClick={() => onClick(content)}
      className={`w-full text-left ${type.bg} rounded-lg px-2 py-1.5 hover:opacity-80 transition-opacity group`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className={type.text}>{type.icon}</span>
          <span className={`text-[10px] font-semibold ${type.text}`}>{type.label}</span>
        </div>
        <span className={statusCfg.color} title={derived.replace('_', ' ')}>
          {statusCfg.icon}
        </span>
      </div>
      <p className={`text-[11px] font-medium ${type.text} mt-0.5 truncate leading-tight opacity-80`}>
        {content.title}
      </p>
    </button>
  )
}
