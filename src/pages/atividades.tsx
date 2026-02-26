import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Clock, AlertCircle, CheckCircle2,
  Image, Film, LayoutGrid, RefreshCw,
  ChevronRight, InboxIcon, Plus, CheckSquare, User, Calendar as CalendarIcon
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { deriveStatus } from '../lib/clientContents'
import type { ContentStatus } from '../components/clientes/types'
import { fetchManualActivities, updateManualActivity, fetchUsersForAssignment } from '../lib/activities'
import type { ManualActivity } from '../lib/activities'
import { NewActivityModal } from '../components/activities/NewActivityModal'

/* ─── Types ────────────────────────────────────────────────────────────── */

interface ActivityItem {
  id: string
  client_id: string
  client_name: string
  client_avatar?: string
  client_gradient_from: string
  client_gradient_to: string
  title: string
  content_type: string
  channel: string
  scheduled_date?: string
  derived_status: ContentStatus | 'manual_pendente' | 'manual_concluida'
  // tab statuses
  tema_status?: ContentStatus
  conteudo_status?: ContentStatus
  midia_status?: ContentStatus
  legenda_status?: ContentStatus
  created_at: string
  // Manual specific
  is_manual?: boolean
  manual_data?: ManualActivity
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  carrossel: { label: 'Carrossel', icon: <LayoutGrid className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
  estatico:  { label: 'Estático',  icon: <Image className="w-4 h-4" />,      color: 'text-emerald-600 bg-emerald-50' },
  reels:     { label: 'Reels',     icon: <Film className="w-4 h-4" />,        color: 'text-blue-600 bg-blue-50' },
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  em_aprovacao: {
    label: 'Aguardando Aprovação',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    badge: 'bg-amber-100 text-amber-700',
  },
  ajuste: {
    label: 'Ajuste Solicitado',
    icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
    badge: 'bg-orange-100 text-orange-700',
  },
  manual_pendente: {
    label: 'Tarefa Manual',
    icon: <CheckSquare className="w-4 h-4 text-purple-500" />,
    badge: 'bg-purple-100 text-purple-700',
  },
  aprovado: {
    label: 'Aprovado',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    badge: 'bg-emerald-100 text-emerald-700',
  },
  manual_concluida: {
    label: 'Concluída',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    badge: 'bg-emerald-100 text-emerald-700',
  }
}

const TAB_LABELS: Record<string, string> = {
  tema: 'Tema',
  conteudo: 'Conteúdo',
  midia: 'Mídia',
  legenda: 'Legenda',
}

const CHANNEL_FLAGS: Record<string, string> = {
  instagram: '📸 Instagram',
  tiktok: '🎵 TikTok',
  youtube: '▶️ YouTube',
  linkedin: '💼 LinkedIn',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function AtividadesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'em_aprovacao' | 'ajuste' | 'manual' | 'concluidas'>('all')
  const [editingManual, setEditingManual] = useState<ManualActivity | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [users, setUsers] = useState<{ id: string, nome: string }[]>([])

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    setIsLoading(true)
    try {
      // Busca todos os conteúdos e atividades manuais
      const [contentsRes, manualRes, usersRes] = await Promise.all([
        supabase
          .from('client_contents')
          .select(`
            id,
            client_id,
            title,
            content_type,
            channel,
            scheduled_date,
            tema_status,
            conteudo_status,
            midia_status,
            legenda_status,
            created_at,
            clients!inner (
              name,
              avatar_url,
              gradient_from,
              gradient_to,
              status
            )
          `)
          .eq('clients.status', 'Ativo')
          .order('scheduled_date', { ascending: true }),
        fetchManualActivities(),
        fetchUsersForAssignment()
      ])

      if (contentsRes.error) throw contentsRes.error
      setUsers(usersRes)

      const mappedContents: ActivityItem[] = (contentsRes.data || [])
        .map((row: any) => ({
          id: row.id,
          client_id: row.client_id,
          client_name: row.clients?.name || 'Cliente',
          client_avatar: row.clients?.avatar_url,
          client_gradient_from: row.clients?.gradient_from || '#8b5cf6',
          client_gradient_to: row.clients?.gradient_to || '#6d28d9',
          title: row.title,
          content_type: row.content_type,
          channel: row.channel,
          scheduled_date: row.scheduled_date,
          derived_status: deriveStatus({
            tema_status: row.tema_status,
            conteudo_status: row.conteudo_status,
            midia_status: row.midia_status,
            legenda_status: row.legenda_status,
          }),
          tema_status: row.tema_status,
          conteudo_status: row.conteudo_status,
          midia_status: row.midia_status,
          legenda_status: row.legenda_status,
          created_at: row.created_at,
          is_manual: false
        }))
        .filter((a: ActivityItem) => a.derived_status === 'em_aprovacao' || a.derived_status === 'ajuste' || a.derived_status === 'aprovado')

      const mappedManual: ActivityItem[] = manualRes
        .map(m => ({
          id: m.id,
          client_id: '',
          client_name: 'Interno',
          client_gradient_from: '#9ca3af',
          client_gradient_to: '#4b5563',
          title: m.title,
          content_type: 'manual',
          channel: '',
          scheduled_date: m.due_date,
          derived_status: m.status === 'concluida' ? 'manual_concluida' : 'manual_pendente',
          created_at: m.created_at,
          is_manual: true,
          manual_data: m
        }))

      const allItems = [...mappedContents, ...mappedManual]
        // Ajuste → mais urgente → primeiro
        .sort((a: ActivityItem, b: ActivityItem) => {
          if (a.derived_status === 'ajuste' && b.derived_status !== 'ajuste') return -1
          if (a.derived_status !== 'ajuste' && b.derived_status === 'ajuste') return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

      setItems(allItems)
    } catch (err) {
      console.error('Error loading activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCompleteManual(activityId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = await updateManualActivity(activityId, { status: 'concluida' })
    if (updated) {
      loadActivities() // Recarrega para mover para concluidas com dados atualizados
    }
  }

  const pendingItems = items.filter(i => i.derived_status !== 'aprovado' && i.derived_status !== 'manual_concluida')

  const filtered = filter === 'all' 
    ? pendingItems 
    : filter === 'manual' 
      ? pendingItems.filter(i => i.is_manual)
      : filter === 'concluidas'
        ? items.filter(i => i.derived_status === 'aprovado' || i.derived_status === 'manual_concluida')
        : pendingItems.filter(i => i.derived_status === filter)
      
  const countAprovacao = pendingItems.filter(i => i.derived_status === 'em_aprovacao').length
  const countAjuste = pendingItems.filter(i => i.derived_status === 'ajuste').length
  const countManual = pendingItems.filter(i => i.is_manual).length
  const countConcluidas = items.filter(i => i.derived_status === 'aprovado' || i.derived_status === 'manual_concluida').length

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-none flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" />
            Atividades
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conteúdos que precisam da sua atenção
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingManual(null); setModalOpen(true) }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Atividade
          </button>
          <button
            onClick={loadActivities}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Summary Pills ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todas
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('em_aprovacao')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'em_aprovacao'
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Aguardando Aprovação
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'em_aprovacao' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
            {countAprovacao}
          </span>
        </button>

        <button
          onClick={() => setFilter('ajuste')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'ajuste'
              ? 'bg-orange-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Ajustes
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'ajuste' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'}`}>
            {countAjuste}
          </span>
        </button>

        <button
          onClick={() => setFilter('manual')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'manual'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Manuais
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'manual' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
            {countManual}
          </span>
        </button>

        <button
          onClick={() => setFilter('concluidas')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'concluidas'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Concluídas
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'concluidas' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
            {countConcluidas}
          </span>
        </button>
      </div>

      {/* ── Activity List ── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center text-gray-400">
          Carregando atividades...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-sm flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Tudo em dia!</p>
          <p className="text-sm text-gray-400">Nenhuma atividade pendente no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => {
            const typeConf = CONTENT_TYPE_CONFIG[item.content_type] || CONTENT_TYPE_CONFIG.carrossel
            const statusConf = STATUS_CONFIG[item.derived_status]

            // Quais abas estão com o status crítico
            const criticalTabs = (Object.entries({
              tema: item.tema_status,
              conteudo: item.conteudo_status,
              midia: item.midia_status,
              legenda: item.legenda_status,
            }) as [string, ContentStatus | undefined][])
              .filter(([, s]) => s === item.derived_status || s === 'ajuste' || s === 'em_aprovacao')
              .filter(([, s]) => s !== 'rascunho' && s !== 'aprovado' && s !== undefined)

            if (item.is_manual) {
              const u = item.manual_data?.assignee
              return (
                <div
                  key={item.id}
                  onClick={() => { setEditingManual(item.manual_data || null); setModalOpen(true) }}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-4 p-4 sm:p-5">
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {statusConf?.icon || <CheckSquare className="w-4 h-4 text-purple-500" />}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Assignee Avatar / Placeholder */}
                        {u ? (
                          <div
                            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center bg-purple-100 overflow-hidden"
                            title={u.nome}
                          >
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-purple-700 text-[10px] font-bold">
                                {u.nome.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center" title="Sem atribuição">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-700">{u ? u.nome : 'Sem responsável'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-purple-700 bg-purple-100">
                          Tarefa Manual
                        </span>
                      </div>

                      <p className="text-base font-bold text-gray-800 break-words">{item.title}</p>
                      {item.manual_data?.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.manual_data.description}</p>
                      )}

                      {/* Date */}
                      {item.scheduled_date && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" /> Prazo: {formatDate(item.scheduled_date)}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {item.derived_status !== 'manual_concluida' && (
                        <button
                          onClick={(e) => handleCompleteManual(item.id, e)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Concluir
                        </button>
                      )}
                      {item.derived_status === 'manual_concluida' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Concluída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => navigate(`/clientes/${item.client_id}`)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start gap-4 p-4 sm:p-5">
                  {/* Status icon */}
                  <div className="shrink-0 mt-0.5">
                    {statusConf.icon}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Client + type row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Client avatar */}
                      <div
                        className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${item.client_gradient_from}, ${item.client_gradient_to})` }}
                      >
                        {item.client_avatar ? (
                          <img src={item.client_avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-white text-[10px] font-bold">
                            {item.client_name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{item.client_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeConf.color}`}>
                        {typeConf.icon}
                        {typeConf.label}
                      </span>
                      {item.channel && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{CHANNEL_FLAGS[item.channel] || item.channel}</span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <p className="text-base font-bold text-gray-800 truncate">{item.title}</p>

                    {/* Tab statuses */}
                    {criticalTabs.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400">Abas:</span>
                        {criticalTabs.map(([tab, s]) => (
                          <span
                            key={tab}
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              s === 'ajuste'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {TAB_LABELS[tab]}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    {item.scheduled_date && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        📅 Agendado para {formatDate(item.scheduled_date)}
                      </p>
                    )}
                  </div>

                  {/* Status badge + arrow */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConf.badge}`}>
                      {statusConf.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Empty section for no items at all ── */}
      {!isLoading && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <InboxIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhuma atividade pendente no momento. Bom trabalho!</p>
        </div>
      )}

      <NewActivityModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingManual(null) }}
        activity={editingManual}
        users={users}
        onSave={() => {
          loadActivities()
        }}
      />
    </div>
  )
}
