import { useState, useEffect } from 'react'
import { CalendarDays, Plus, X, Link, MapPin, Clock, Users, Trash2, CheckCircle2, XCircle, Video, ExternalLink, ChevronDown } from 'lucide-react'
import { fetchMeetings, createMeeting, updateMeeting, deleteMeeting } from '../lib/meetings'
import type { Meeting, MeetingInput } from '../lib/meetings'
import { fetchClients } from '../lib/clientes'
import type { Client } from '../components/clientes/types'
import { fetchServices } from '../lib/services'
import type { Service } from '../lib/services'
import { supabase } from '../lib/supabase'
import type { CrmLead } from '../components/crm/types'


export interface TeamMember {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

/* ─── helpers ─────────────────────────────────────────────────────────── */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function toLocalInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

/* ─── Modal ────────────────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean
  onClose: () => void
  meeting?: Meeting | null
  onSave: (m: Meeting) => void
  clients: Client[]
  services: Service[]
  leads: CrmLead[]
  teamMembers: TeamMember[]
}

function MeetingModal({ open, onClose, meeting, onSave, clients, services, leads, teamMembers }: ModalProps) {
  const isEdit = !!meeting
  const empty: MeetingInput = { title: '', meeting_date: '', duration_minutes: 60, status: 'agendada' }
  const [form, setForm] = useState<MeetingInput>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (meeting) {
      setForm({
        title: meeting.title,
        description: meeting.description ?? '',
        lead_id: meeting.lead_id ?? '',
        service_id: meeting.service_id ?? '',
        client_id: meeting.client_id ?? '',
        meeting_date: toLocalInput(meeting.meeting_date),
        duration_minutes: meeting.duration_minutes ?? 60,
        location: meeting.location ?? '',
        meeting_url: meeting.meeting_url ?? '',
        status: meeting.status,
        responsible_name: meeting.responsible_name ?? '',
        notes: meeting.notes ?? '',
      })
    } else {
      setForm(empty)
    }
  }, [meeting, open])

  if (!open) return null

  function set(k: keyof MeetingInput, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.meeting_date) return
    setSaving(true)

    const payload: MeetingInput = {
      ...form,
      lead_id: form.lead_id || undefined,
      service_id: form.service_id || undefined,
      client_id: form.client_id || undefined,
      meeting_date: new Date(form.meeting_date).toISOString(),
    }

    let saved: Meeting | null
    if (isEdit && meeting) {
      saved = await updateMeeting(meeting.id, payload)
    } else {
      saved = await createMeeting(payload)
    }
    setSaving(false)
    if (saved) { onSave(saved); onClose() }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Editar Reunião' : 'Nova Reunião'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Título + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Título *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Apresentação de Proposta" required className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="nao_agendada">Não Agendada</option>
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Data + Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Data e Hora {form.status !== 'nao_agendada' && '*'}</label>
              <input type="datetime-local" value={form.meeting_date} onChange={e => set('meeting_date', e.target.value)} required={form.status !== 'nao_agendada'} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Duração (min)</label>
              <select value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))} className={inputCls}>
                {[30, 45, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {/* Links + Resp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Local</label>
              <input value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="Ex: Escritório / Google Meet" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Link className="w-3 h-3" />Link</label>
              <input value={form.meeting_url ?? ''} onChange={e => set('meeting_url', e.target.value)} placeholder="https://meet.google.com/..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Responsável</label>
              <select value={form.responsible_name ?? ''} onChange={e => set('responsible_name', e.target.value)} className={inputCls}>
                <option value="">— Sem responsável —</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Relacionamentos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Users className="w-3 h-3" />Cliente</label>
              <select value={form.client_id ?? ''} onChange={e => set('client_id', e.target.value)} className={inputCls}>
                <option value="">— Nenhum —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Lead (CRM)</label>
              <select value={form.lead_id ?? ''} onChange={e => set('lead_id', e.target.value)} className={inputCls}>
                <option value="">— Nenhum —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.client_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Serviço</label>
              <select value={form.service_id ?? ''} onChange={e => set('service_id', e.target.value)} className={inputCls}>
                <option value="">— Nenhum —</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição + Notas */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descrição</label>
            <input value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Pauta ou objetivo da reunião..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Observações</label>
            <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Anotações pós-reunião, pontos de ação..." className={`${inputCls} resize-none`} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Reunião'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function ReunioesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'proximas' | 'realizadas' | 'nao_agendadas' | 'canceladas'>('proximas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)

  useEffect(() => {
    Promise.all([
      fetchMeetings().then(setMeetings),
      fetchClients().then(setClients),
      fetchServices().then(setServices),
      supabase.from('crm_leads').select('*').then(({ data }) => setLeads(data || [])),
      supabase.from('usuarios').select('*').order('nome', { ascending: true }).then(({ data, error }) => {
        if (data) {
          const formatted = data.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.nome || u.email || 'Usuário',
            role: u.permissoes?.includes('admin') ? 'admin' : 'membro',
            created_at: u.created_at,
          }))
          setTeamMembers(formatted)
        } else if (error) {
          console.error("Erro ao carregar equipe em reuniões:", error)
        }
      }),
    ]).finally(() => setLoading(false))
  }, [])

  const now = new Date().toISOString()
  const filtered = {
    proximas: meetings.filter(m => m.status === 'agendada' && m.meeting_date >= now),
    realizadas: meetings.filter(m => m.status === 'realizada'),
    nao_agendadas: meetings.filter(m => m.status === 'nao_agendada'),
    canceladas: meetings.filter(m => m.status === 'cancelada' || (m.status === 'agendada' && m.meeting_date < now)),
  }

  function handleSave(m: Meeting) {
    setMeetings(prev => {
      const idx = prev.findIndex(x => x.id === m.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = m; return n }
      return [...prev, m]
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta reunião?')) return
    await deleteMeeting(id)
    setMeetings(prev => prev.filter(m => m.id !== id))
  }

  async function handleStatus(m: Meeting, status: Meeting['status']) {
    const updated = await updateMeeting(m.id, { status })
    if (updated) handleSave(updated)
  }

  const STATUS_CONFIG = {
    nao_agendada: { label: 'Não Agendada', badge: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3 h-3" /> },
    agendada:  { label: 'Agendada',  badge: 'bg-blue-100 text-blue-700',   icon: <Clock className="w-3 h-3" /> },
    realizada: { label: 'Realizada', badge: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelada: { label: 'Cancelada', badge: 'bg-red-100 text-red-600',     icon: <XCircle className="w-3 h-3" /> },
  } as const

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
  const leadMap = Object.fromEntries(leads.map(l => [l.id, l.client_name]))
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s.name]))

  const tabs = [
    { key: 'proximas', label: 'Próximas', count: filtered.proximas.length },
    { key: 'nao_agendadas', label: 'Não Agendadas', count: filtered.nao_agendadas.length },
    { key: 'realizadas', label: 'Realizadas', count: filtered.realizadas.length },
    { key: 'canceladas', label: 'Passadas/Canceladas', count: filtered.canceladas.length },
  ] as const

  const list = filtered[tab]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-purple-500" />
            Reuniões
          </h2>
          <p className="text-sm text-gray-500 mt-1">Acompanhe e gerencie suas reuniões</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2.5 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center bg-gray-100 rounded-xl p-1 gap-1 w-full">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 sm:flex-none min-w-[140px] flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">Carregando...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-3">
          <CalendarDays className="w-12 h-12 text-gray-200" />
          <p className="text-gray-500 font-semibold">Nenhuma reunião aqui</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="text-sm text-purple-600 hover:underline">Criar primeira reunião</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map(m => {
            const sc = STATUS_CONFIG[m.status]
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group">
                {/* Date block */}
                {m.status !== 'nao_agendada' && m.meeting_date ? (
                  <div className="hidden sm:flex shrink-0 w-14 flex-col items-center bg-purple-50 rounded-xl p-2">
                    <span className="text-[10px] font-semibold text-purple-500 uppercase">
                      {new Date(m.meeting_date).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black text-purple-800 leading-none">
                      {new Date(m.meeting_date).getDate()}
                    </span>
                    <span className="text-[10px] text-purple-500 font-semibold mt-0.5 whitespace-nowrap">
                      {fmtTime(m.meeting_date)}
                    </span>
                  </div>
                ) : (
                  <div className="hidden sm:flex shrink-0 w-14 h-14 items-center justify-center bg-orange-50 rounded-xl text-orange-500">
                    <CalendarDays className="w-6 h-6 opacity-50" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold text-gray-800">{m.title}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc?.badge || 'bg-gray-100'}`}>
                      {sc?.icon}{sc?.label || m.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500 flex-wrap mt-2">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md"><Clock className="w-3 h-3 text-gray-400" />{m.duration_minutes} min</span>
                    {m.responsible_name && <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md"><Users className="w-3 h-3 text-purple-400" />Resp: {m.responsible_name}</span>}
                    {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{m.location}</span>}
                    {m.client_id && clientMap[m.client_id] && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" />{clientMap[m.client_id]}</span>}
                    {m.lead_id && leadMap[m.lead_id] && <span className="text-blue-600 font-medium border border-blue-100 bg-blue-50 px-2 py-0.5 rounded-full">Lead: {leadMap[m.lead_id]}</span>}
                    {m.service_id && serviceMap[m.service_id] && <span className="text-violet-600 font-medium border border-violet-100 bg-violet-50 px-2 py-0.5 rounded-full">{serviceMap[m.service_id]}</span>}
                  </div>

                  {m.description && <p className="text-sm text-gray-500 mt-1.5 truncate">{m.description}</p>}
                </div>

                {/* Actions mobile only: hidden on desktop, visible on small devices */}
                <div className="flex sm:hidden w-full items-center gap-2 border-t border-gray-100 pt-3 mt-2 justify-between">
                   {m.status !== 'nao_agendada' && m.meeting_date && (
                     <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(m.meeting_date).toLocaleDateString()} às {fmtTime(m.meeting_date)}
                     </div>
                   )}
                   <div className="flex items-center gap-3">
                    <button onClick={() => { setEditing(m); setModalOpen(true) }} className="text-gray-400 p-1"><ChevronDown className="w-5 h-5 rotate-[-90deg]" /></button>
                   </div>
                </div>

                {/* Actions desktop */}
                <div className="hidden sm:flex shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.meeting_url && (
                    <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {m.status === 'agendada' && (
                    <button onClick={() => handleStatus(m, 'realizada')} className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors">
                      Realizada
                    </button>
                  )}
                  <button onClick={() => { setEditing(m); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MeetingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        meeting={editing}
        onSave={handleSave}
        clients={clients}
        services={services}
        leads={leads}
        teamMembers={teamMembers}
      />
    </div>
  )
}
