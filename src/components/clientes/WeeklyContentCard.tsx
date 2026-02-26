import { Image, Film, LayoutGrid, Instagram, Youtube, Linkedin } from 'lucide-react'
import { deriveStatus } from '../../lib/clientContents'
import type { ClientContent } from './types'

// Mapeamento de formatos de conteúdo
const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  carrossel: { label: 'Carrossel', icon: <LayoutGrid className="w-3 h-3" /> },
  estatico:  { label: 'Estático', icon: <Image className="w-3 h-3" /> },
  reels:     { label: 'Reels', icon: <Film className="w-3 h-3" /> },
}

// Ícones opcionais de redes sociais baseados na string de `channel`
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3 text-gray-700" />,
  tiktok:    <Film className="w-3 h-3 text-gray-700" />, 
  youtube:   <Youtube className="w-3 h-3 text-gray-700" />,
  linkedin:  <Linkedin className="w-3 h-3 text-gray-700" />,
}

// Configuração visual de cada status baseada no mockup
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  rascunho:     { label: 'Rascunho', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-l-gray-300' },
  em_aprovacao: { label: 'Em Aprovação', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-l-yellow-400' },
  ajuste:       { label: 'Ajuste', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-l-orange-400' },
  aprovado:     { label: 'Aprovado', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-l-emerald-500' },
}

interface WeeklyContentCardProps {
  content: ClientContent
  onClick: (c: ClientContent) => void
}

export function WeeklyContentCard({ content, onClick }: WeeklyContentCardProps) {
  const type = TYPE_CONFIG[content.content_type] || TYPE_CONFIG.carrossel
  const derivedStatus = deriveStatus(content)
  const statusCfg = STATUS_CONFIG[derivedStatus]

  // Formatar data (ex: 07 dez - 18:00)
  const dateObj = new Date(content.scheduled_date || '')
  // Ajuste de fuso caso dateObj não inclua e o frontend precise parsear UTC;
  // idealmente `scheduled_date` seria "YYYY-MM-DDTHH:mm:SS".
  // Vamos formatar manualmente usando Intl para PT-BR:
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  
  // Format the date assuming it's valid, otherwise fallback
  let dateText = 'Sem data'
  if (content.scheduled_date) {
     try {
       // split no " de " e reformatamos para " - " conforme mockup.
       dateText = formatter.format(dateObj).replace(' às ', ' - ').replace('.', '')
     } catch (e) {
       dateText = String(content.scheduled_date)
     }
  }

  const channelIcon = CHANNEL_ICONS[content.channel || ''] || <Instagram className="w-3 h-3 text-gray-700" /> // fallback

  return (
    <button
      onClick={() => onClick(content)}
      className={`w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-400 border-l-[4px] ${statusCfg.border}`}
    >
      {/* Top Row: Date & Status */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[11px] font-medium text-gray-500 capitalize">{dateText}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Middle Row: Title */}
      <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 mt-0.5">
        {content.title || 'Sem título'}
      </p>

      {/* Bottom Row: Icons & Format Badges */}
      <div className="flex items-center gap-2 mt-1">
        {/* Ícone da Rede Social num container cinza claro */}
        <div className="flex items-center justify-center p-1.5 rounded-md bg-gray-50 border border-gray-100">
          {channelIcon}
        </div>
        
        {/* Formato do post */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
          <span className="text-gray-600">{type.icon}</span>
          <span className="text-[10px] font-medium text-gray-600">{type.label}</span>
        </div>
      </div>
    </button>
  )
}
