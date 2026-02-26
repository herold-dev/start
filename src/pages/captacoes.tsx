import { useState, useEffect } from 'react'
import { Camera, Plus, X, MapPin, Clock, User, Trash2, CheckCircle2, XCircle, Filter } from 'lucide-react'
import { fetchCaptures, createCapture, updateCapture, deleteCapture } from '../lib/captures'
import type { Capture, CaptureInput } from '../lib/captures'
import { fetchClients } from '../lib/clientes'
import type { Client } from '../components/clientes/types'

/* ─── helpers ─────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

function groupByDate(captures: Capture[]) {
  const map: Record<string, Capture[]> = {}
  for (const c of captures) {
    if (!map[c.capture_date]) map[c.capture_date] = []
    map[c.capture_date].push(c)
  }
  return map
}

function groupByClient(captures: Capture[], clientMap: Record<string, Client>) {
  const map: Record<string, Capture[]> = {}
  for (const c of captures) {
    const clientName = c.client_id && clientMap[c.client_id] ? clientMap[c.client_id].name : 'Sem Cliente'
    if (!map[clientName]) map[clientName] = []
    map[clientName].push(c)
  }
  return map
}

const TYPE_CONFIG = {
  foto:      { label: 'Foto',       icon: '📸', badge: 'bg-pink-100 text-pink-700' },
  video:     { label: 'Vídeo',      icon: '🎬', badge: 'bg-blue-100 text-blue-700' },
  foto_video: { label: 'Foto + Vídeo', icon: '🎥', badge: 'bg-violet-100 text-violet-700' },
} as const

const STATUS_CONFIG = {
  agendada:     { label: 'Agendada',      badge: 'bg-amber-100 text-amber-700',      icon: <Clock className="w-3 h-3" /> },
  realizada:    { label: 'Realizada',     badge: 'bg-emerald-100 text-emerald-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelada:    { label: 'Cancelada',     badge: 'bg-red-100 text-red-600',          icon: <XCircle className="w-3 h-3" /> },
  nao_agendada: { label: 'Não Agendada',  badge: 'bg-slate-100 text-slate-600',      icon: <Clock className="w-3 h-3" /> },
} as const

/* ─── Modal ────────────────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean
  onClose: () => void
  capture?: Capture | null
  onSave: (c: Capture) => void
  clients: Client[]
}

function CaptureModal({ open, onClose, capture, onSave, clients }: ModalProps) {
  const isEdit = !!capture
  const empty: CaptureInput = { title: '', capture_date: '', type: 'foto', status: 'agendada' }
  const [form, setForm] = useState<CaptureInput>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(capture ? {
      client_id: capture.client_id ?? '',
      title: capture.title,
      capture_date: capture.capture_date,
      start_time: capture.start_time ?? '',
      end_time: capture.end_time ?? '',
      location: capture.location ?? '',
      type: capture.type,
      status: capture.status,
      notes: capture.notes ?? '',
    } : empty)
  }, [capture, open])

  if (!open) return null

  function set(k: keyof CaptureInput, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    if (form.status !== 'nao_agendada' && !form.capture_date) {
      alert('Data é obrigatória para captações agendadas.')
      return
    }
    
    setSaving(true)
    const payload: CaptureInput = {
      ...form,
      client_id: form.client_id || undefined,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
    }
    let saved: Capture | null
    if (isEdit && capture) {
      saved = await updateCapture(capture.id, payload)
    } else {
      saved = await createCapture(payload)
    }
    setSaving(false)
    if (saved) { onSave(saved); onClose() }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-500" />
            {isEdit ? 'Editar Captação' : 'Nova Captação'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Título da Captação *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Ensaio mensal João" required className={inputCls} />
          </div>

          {/* Cliente */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><User className="w-3 h-3" />Cliente</label>
            <select value={form.client_id ?? ''} onChange={e => set('client_id', e.target.value)} className={inputCls}>
              <option value="">— Selecione um cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tipo + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                <option value="foto">📸 Foto</option>
                <option value="video">🎬 Vídeo</option>
                <option value="foto_video">🎥 Foto + Vídeo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as any)} className={inputCls}>
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
                <option value="nao_agendada">Não Agendada</option>
              </select>
            </div>
          </div>

          {/* Data + Horários */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Data {form.status !== 'nao_agendada' && '*'}</label>
              <input type="date" value={form.capture_date || ''} onChange={e => set('capture_date', e.target.value)} required={form.status !== 'nao_agendada'} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Início</label>
              <input type="time" value={form.start_time ?? ''} onChange={e => set('start_time', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Fim</label>
              <input type="time" value={form.end_time ?? ''} onChange={e => set('end_time', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Local / Endereço</label>
            <input value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="Ex: Estúdio, Parque Ibirapuera..." className={inputCls} />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Observações</label>
            <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Detalhes do ensaio, roupa, referências..." className={`${inputCls} resize-none`} />
          </div>

          {/* Linked Contents Read Only */}
          {capture?.client_contents && capture.client_contents.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Posts Vinculados ({capture.client_contents.length})</label>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {capture.client_contents.map(cc => (
                  <div key={cc.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">{cc.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{cc.content_type}</span>
                    </div>
                    {cc.conteudo_content && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 whitespace-pre-wrap">{cc.conteudo_content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Captação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function CaptacoesPage() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'para_captar' | 'agendadas' | 'realizadas'>('para_captar')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Capture | null>(null)

  useEffect(() => {
    Promise.all([
      fetchCaptures().then(setCaptures),
      fetchClients().then(setClients),
    ]).finally(() => setLoading(false))
  }, [])

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const today = new Date().toISOString().slice(0, 10)

  const filtered = tab === 'para_captar'
    ? captures.filter(c => c.status === 'nao_agendada')
    : tab === 'agendadas'
      ? captures.filter(c => c.status === 'agendada' && c.capture_date >= today)
      : captures.filter(c => c.status === 'realizada' || (c.status === 'agendada' && c.capture_date < today) || c.status === 'cancelada')

  const grouped = tab === 'para_captar' 
    ? groupByClient([...filtered].sort((a,b) => (a.title || '').localeCompare(b.title || '')), clientMap)
    : groupByDate([...filtered].sort((a, b) => (a.capture_date || '').localeCompare(b.capture_date || '')))

  function handleSave(c: Capture) {
    setCaptures(prev => {
      const idx = prev.findIndex(x => x.id === c.id)
      if (idx >= 0) { 
        const n = [...prev]
        n[idx] = { ...n[idx], ...c } // Preserve client_contents
        return n 
      }
      return [...prev, c]
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta captação?')) return
    await deleteCapture(id)
    setCaptures(prev => prev.filter(c => c.id !== id))
  }

  async function handleStatusToggle(c: Capture) {
    const newStatus = (c.status === 'agendada' || c.status === 'nao_agendada') ? 'realizada' : 'agendada'
    const updated = await updateCapture(c.id, { status: newStatus })
    if (updated) handleSave(updated)
  }

  const paraCaptarCount = captures.filter(c => c.status === 'nao_agendada').length
  const agendadasCount = captures.filter(c => c.status === 'agendada' && c.capture_date >= today).length
  const realizadasCount = captures.filter(c => c.status === 'realizada').length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-pink-500" />
            Captações
          </h2>
          <p className="text-sm text-gray-500 mt-1">Agenda de gravações e ensaios fotográficos</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl px-4 py-2.5 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova Captação
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Agendadas</p>
          <p className="text-3xl font-black text-amber-500 mt-1">{agendadasCount}</p>
          <p className="text-xs text-gray-400">captações futuras</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Realizadas</p>
          <p className="text-3xl font-black text-emerald-500 mt-1">{realizadasCount}</p>
          <p className="text-xs text-gray-400">concluídas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hidden sm:block">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-black text-gray-700 mt-1">{captures.length}</p>
          <p className="text-xs text-gray-400">este mês</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 w-fit overflow-x-auto max-w-full">
        {([
          ['para_captar', 'Para Captar', paraCaptarCount],
          ['agendadas', 'Agendadas', agendadasCount], 
          ['realizadas', 'Realizadas', realizadasCount]
        ] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === key ? 'bg-pink-100 text-pink-700' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-3">
          <Camera className="w-12 h-12 text-gray-200" />
          <p className="text-gray-500 font-semibold">Nenhuma captação aqui</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="text-sm text-pink-600 hover:underline">Agendar primeira captação</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider capitalize">
                  {tab === 'para_captar' ? date : (date === 'undefined' || !date ? 'Sem Data' : fmtDate(date))}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                {items.map(c => {
                  const tc = TYPE_CONFIG[c.type]
                  const sc = STATUS_CONFIG[c.status]
                  const client = c.client_id ? clientMap[c.client_id] : null

                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 p-4">
                        {/* Type icon */}
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-2xl">
                          {tc.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-gray-800 break-words">{c.title}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>{tc.label}</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.badge}`}>{sc.icon}{sc.label}</span>
                                {c.client_contents && c.client_contents.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                                    {c.client_contents.length} {c.client_contents.length === 1 ? 'post' : 'posts'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions - Desktop Right / Mobile top right */}
                            <div className="shrink-0 flex items-center gap-2">
                              {c.status === 'nao_agendada' && (
                                <button onClick={() => { setEditing({...c, status: 'agendada'}); setModalOpen(true) }} className="hidden sm:inline-flex text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                  Agendar
                                </button>
                              )}
                              <button onClick={() => { setEditing(c); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <Filter className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap mt-2">
                            {(c.start_time || c.end_time) && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {c.start_time && c.start_time.slice(0, 5)}
                                {c.start_time && c.end_time && ' – '}
                                {c.end_time && c.end_time.slice(0, 5)}
                              </span>
                            )}
                            {c.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                            {client && (
                              <span className="flex items-center gap-1 font-medium text-gray-500">
                                <div className="w-4 h-4 rounded-md inline-flex items-center justify-center text-white text-[9px] font-bold"
                                  style={{ background: `linear-gradient(135deg, ${client.gradient_from || '#8b5cf6'}, ${client.gradient_to || '#6d28d9'})` }}>
                                  {client.name.slice(0, 1)}
                                </div>
                                {client.name}
                              </span>
                            )}
                          </div>
                          {c.notes && <p className="text-xs text-gray-400 mt-1 truncate">{c.notes}</p>}
                          
                          {/* Exibir posts que precisam de captação */}
                          {c.client_contents && c.client_contents.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5 pt-3 border-t border-gray-100">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Posts Vinculados ({c.client_contents.length})</p>
                              {c.client_contents.map(cc => (
                                <div key={cc.id} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex flex-col gap-1 w-full max-w-lg">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-700 truncate">{cc.title}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200 uppercase whitespace-nowrap">{cc.content_type}</span>
                                  </div>
                                  {cc.conteudo_content && (
                                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-snug">{cc.conteudo_content}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile Actions Bottom */}
                      <div className="sm:hidden flex items-center gap-2 px-4 pb-4">
                        {c.status === 'nao_agendada' && (
                          <button onClick={() => { setEditing({...c, status: 'agendada'}); setModalOpen(true) }} className="w-full text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-lg transition-colors">
                            Agendar Captação
                          </button>
                        )}
                        {c.status === 'agendada' && (
                          <button onClick={() => handleStatusToggle(c)} className="w-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors">
                            ✓ Concluir
                          </button>
                        )}
                      </div>

                      {/* Desktop Actions Bottom */}
                      {c.status === 'agendada' && (
                        <div className="hidden sm:flex px-4 pb-4 mt-[-8px] items-center justify-end gap-2">
                           <button onClick={() => handleStatusToggle(c)} className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                             ✓ Concluir
                           </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <CaptureModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        capture={editing}
        onSave={handleSave}
        clients={clients}
      />
    </div>
  )
}
