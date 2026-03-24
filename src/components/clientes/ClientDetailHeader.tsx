import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Link as LinkIcon, Edit2, Trash2,
  FileText, BarChart2, Lock, Send, CheckCircle2, Clock, FileStack
} from 'lucide-react'
import type { Client } from './types'
import type { NoteTab } from './types'
import type { ContentStats } from '../../lib/clientContents'

export type ClientTab = 'conteudo' | 'metricas' | 'senhas' | NoteTab

interface ClientDetailHeaderProps {
  client: Client
  activeTab: ClientTab
  onTabChange: (tab: ClientTab) => void
  onEdit: () => void
  onDelete: () => void
  stats?: ContentStats
}

const TABS: { id: ClientTab; label: string; icon: React.ReactNode }[] = [
  { id: 'conteudo', label: 'Conteúdo', icon: <FileText className="w-4 h-4" /> },
  { id: 'metricas', label: 'Métricas Instagram', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'senhas', label: 'Senhas & Acessos', icon: <Lock className="w-4 h-4" /> },
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function ClientDetailHeader({
  client,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  stats,
}: ClientDetailHeaderProps) {
  const navigate = useNavigate()
  const isAtivo = client.status === 'Ativo'

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clientes')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          {client.social_link && (
            <a
              href={client.social_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="flex items-center gap-4">
        {client.avatar_url ? (
          <img
            src={client.avatar_url}
            alt={client.name}
            className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${client.gradient_from}, ${client.gradient_to})` }}
          >
            {getInitials(client.name)}
          </div>
        )}

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 leading-none">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {client.social_handle && (
              <span className="text-sm text-gray-400 font-medium">@{client.social_handle.replace('@', '')}</span>
            )}
            {client.segment && (
              <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-md font-semibold border border-gray-200/60">
                {client.segment}
              </span>
            )}
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              isAtivo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {client.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats indicadores */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileStack className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-gray-800 leading-none">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Aprovados</p>
              <p className="text-xl font-bold text-emerald-700 leading-none">{stats.aprovados}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Postados</p>
              <p className="text-xl font-bold text-blue-700 leading-none">{stats.postados}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stats.faltam > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <Clock className={`w-4 h-4 ${stats.faltam > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">A Postar</p>
              <p className={`text-xl font-bold leading-none ${stats.faltam > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{stats.faltam}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
