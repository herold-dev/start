import { useState, useRef, useEffect } from 'react'
import { X, Camera, User, DollarSign, Link, Trash2, Package } from 'lucide-react'
import type { Client, ClientInput, PaymentType } from './types'
import { createClient, updateClient, deleteClient, uploadAvatar } from '../../lib/clientes'
import { fetchServices, type Service } from '../../lib/services'
import { generateClientTransactions } from '../../lib/financeiro'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  onSave: (client: Client) => void
  onDelete?: (id: string) => void
}

const BLANK: ClientInput = {
  name: '',
  email: '',
  social_handle: '',
  social_link: '',
  segment: '',
  whatsapp: '',
  status: 'Ativo',
  city_state: '',
  origin: '',
  avatar_url: '',
  gradient_from: '#8b5cf6',
  gradient_to: '#6d28d9',
  service_name: '',
  service_id: undefined,
  contract_url: '',
  contract_value: undefined,
  monthly_value: undefined,
  payment_type: 'mensal',
  due_day: 10,
  installments: undefined,
  payment_start_date: undefined,
}

const GRADIENT_PRESETS = [
  { from: '#8b5cf6', to: '#6d28d9', label: 'Roxo' },
  { from: '#ec4899', to: '#db2777', label: 'Rosa' },
  { from: '#06b6d4', to: '#0e7490', label: 'Ciano' },
  { from: '#10b981', to: '#059669', label: 'Verde' },
  { from: '#f59e0b', to: '#d97706', label: 'Âmbar' },
  { from: '#ef4444', to: '#dc2626', label: 'Vermelho' },
  { from: '#f0a8e8', to: '#c6a3e3', label: 'Lilás' },
  { from: '#aedcf4', to: '#9574d6', label: 'Azul Claro' },
  { from: '#fcfae4', to: '#d6c423', label: 'Dourado' },
  { from: '#dca376', to: '#995c33', label: 'Terracota' },
]

export function ClientModal({ isOpen, onClose, client, onSave, onDelete }: ClientModalProps) {
  const [tab, setTab] = useState<'basico' | 'financeiro'>('basico')
  const [form, setForm] = useState<ClientInput>(BLANK)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const isEditing = !!client

  useEffect(() => {
    if (isOpen) {
      fetchServices().then(setServices)
      if (client) {
        const { id, created_at, ...rest } = client
        setForm({ ...BLANK, ...rest })
        setAvatarPreview(client.avatar_url || null)
      } else {
        setForm(BLANK)
        setAvatarPreview(null)
      }
      setAvatarFile(null)
      setTab('basico')
    }
  }, [isOpen, client])

  function set(field: keyof ClientInput, value: string | number | undefined) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleServiceChange(serviceId: string) {
    const svc = services.find(s => s.id === serviceId)
    if (svc) {
      setForm(prev => ({
        ...prev,
        service_id: svc.id,
        service_name: svc.name,
        monthly_value: svc.base_price || prev.monthly_value,
        contract_value: svc.base_price || prev.contract_value,
      }))
    } else {
      setForm(prev => ({ ...prev, service_id: undefined, service_name: '' }))
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('O campo Nome é obrigatório.')
      return
    }
    setIsSaving(true)
    try {
      let finalAvatarUrl = form.avatar_url || ''
      if (avatarFile) {
        const url = await uploadAvatar(avatarFile)
        if (url) finalAvatarUrl = url
      }

      const payload: ClientInput = { ...form, avatar_url: finalAvatarUrl }

      let saved: Client | null
      if (isEditing && client) {
        saved = await updateClient(client.id, payload)
      } else {
        saved = await createClient(payload)
      }

      if (saved) {
        // Gerar transações financeiras se houver dados financeiros (ou para limpar caso inativo/zerado)
        const value = saved.monthly_value || saved.contract_value || 0
        const serviceName = saved.service_name || 'Serviço'
        
        await generateClientTransactions({
          clientId: saved.id,
          clientName: saved.name,
          serviceName,
          paymentType: saved.payment_type || 'mensal',
          value,
          dueDay: saved.due_day || 10,
          installments: saved.installments,
          paymentStartDate: saved.payment_start_date,
          clientStatus: saved.status,
        })
        
        onSave(saved)
        onClose()
      } else {
        alert('Erro ao salvar cliente. Tente novamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!client) return
    if (!confirm(`Deseja excluir o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) return
    const ok = await deleteClient(client.id)
    if (ok) {
      onDelete?.(client.id)
      onClose()
    } else {
      alert('Erro ao excluir cliente.')
    }
  }

  const initials = form.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Gradient Header Preview */}
        <div
          className="h-24 w-full shrink-0 transition-all duration-300"
          style={{ background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})` }}
        />

        {/* Avatar + close button over header */}
        <div className="absolute top-3 right-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/30 hover:bg-white/50 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar */}
        <div className="absolute top-12 left-6">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 hover:opacity-80 transition-opacity group"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-purple-600 select-none">
                  {initials || <User className="w-8 h-8 text-purple-400" />}
                </span>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pt-3 pb-0">
          <div className="ml-24">
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            {isEditing && (
              <p className="text-sm text-gray-500 truncate">{client?.name}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-4 flex gap-1 shrink-0 border-b border-gray-100">
          {([
            { id: 'basico', label: 'Informações Básicas', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'financeiro', label: 'Contrato & Financeiro', icon: <DollarSign className="w-3.5 h-3.5" /> },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-purple-600 border-purple-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'basico' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Nome */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Nome *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Empresa XYZ"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* @ Rede Social */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">@ principal (Instagram)</label>
                <input
                  value={form.social_handle || ''}
                  onChange={e => set('social_handle', e.target.value)}
                  placeholder="@username"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Segmento */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Segmento / Nicho</label>
                <input
                  value={form.segment || ''}
                  onChange={e => set('segment', e.target.value)}
                  placeholder="Ex: Saúde e Bem-estar"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">WhatsApp</label>
                <input
                  value={form.whatsapp || ''}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">E-mail</label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={e => set('email', e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Estado/Cidade */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Estado / Cidade</label>
                <input
                  value={form.city_state || ''}
                  onChange={e => set('city_state', e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Origem */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Origem do Contato</label>
                <input
                  value={form.origin || ''}
                  onChange={e => set('origin', e.target.value)}
                  placeholder="Ex: Instagram, Indicação..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Link da Rede Social */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Link da Rede Social
                </label>
                <input
                  type="url"
                  value={form.social_link || ''}
                  onChange={e => set('social_link', e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Gradient */}
              <div className="col-span-2 mt-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Cor do Cartão</label>
                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {GRADIENT_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => { set('gradient_from', p.from); set('gradient_to', p.to) }}
                      title={p.label}
                      className={`w-8 h-8 rounded-xl shadow-sm border-2 transition-transform hover:scale-110 ${
                        form.gradient_from === p.from && form.gradient_to === p.to
                          ? 'border-gray-900 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                    />
                  ))}
                </div>
                {/* Custom pickers */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">De</label>
                    <input
                      type="color"
                      value={form.gradient_from}
                      onChange={e => set('gradient_from', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Até</label>
                    <input
                      type="color"
                      value={form.gradient_to}
                      onChange={e => set('gradient_to', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                  </div>
                  <div
                    className="flex-1 h-9 rounded-xl border border-gray-100 shadow-sm"
                    style={{ background: `linear-gradient(to right, ${form.gradient_from}, ${form.gradient_to})` }}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'financeiro' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Serviço (dropdown da tabela services) */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Serviço Contratado
                </label>
                <select
                  value={form.service_id || ''}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-white"
                >
                  <option value="">Selecione um serviço...</option>
                  {services.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.base_price > 0 ? `— ${fmt(s.base_price)}` : ''}
                    </option>
                  ))}
                </select>
                {services.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum serviço cadastrado. <a href="/servicos" className="underline">Cadastre seus serviços primeiro.</a>
                  </p>
                )}
              </div>

              {/* Valor Mensal */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Valor (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthly_value ?? form.contract_value ?? ''}
                  onChange={e => {
                    const v = e.target.value ? parseFloat(e.target.value) : undefined
                    setForm(prev => ({ ...prev, monthly_value: v, contract_value: v }))
                  }}
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Tipo de Pagamento */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Forma de Pagamento</label>
                <select
                  value={form.payment_type || 'mensal'}
                  onChange={e => set('payment_type', e.target.value as PaymentType)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-white"
                >
                  <option value="mensal">Mensal (Recorrente)</option>
                  <option value="unico">Pagamento Único</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>

              {/* Dia de Vencimento */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Dia de Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.due_day ?? 10}
                  onChange={e => set('due_day', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Nº de Parcelas (só se parcelado) */}
              {form.payment_type === 'parcelado' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Nº de Parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={form.installments ?? ''}
                    onChange={e => set('installments', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ex: 6"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                  />
                </div>
              )}

              {/* Data de Início do Pagamento (todos os tipos) */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">
                  {form.payment_type === 'unico' ? 'Data do Pagamento' : 'Data de Início'}
                </label>
                <input
                  type="date"
                  value={form.payment_start_date || ''}
                  onChange={e => set('payment_start_date', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Link do Contrato */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Link do Arquivo do Contrato
                </label>
                <input
                  type="url"
                  value={form.contract_url || ''}
                  onChange={e => set('contract_url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>

              {/* Summary card */}
              {(form.service_name || form.monthly_value || form.contract_value) && (
                <div
                  className="col-span-2 rounded-2xl p-4 mt-2"
                  style={{ background: `linear-gradient(135deg, ${form.gradient_from}22, ${form.gradient_to}44)` }}
                >
                  <p className="text-xs font-semibold text-gray-500 mb-1">Resumo do Contrato</p>
                  {form.service_name && <p className="text-sm font-bold text-gray-800">{form.service_name}</p>}
                  {(form.monthly_value || form.contract_value) && (
                    <p className="text-lg font-bold mt-1" style={{ color: form.gradient_from }}>
                      {fmt(form.monthly_value || form.contract_value || 0)}
                      {form.payment_type === 'mensal' && <span className="text-xs font-normal text-gray-500">/mês</span>}
                      {form.payment_type === 'parcelado' && form.installments && (
                        <span className="text-xs font-normal text-gray-500"> em {form.installments}x de {fmt((form.monthly_value || form.contract_value || 0) / form.installments)}</span>
                      )}
                    </p>
                  )}
                  {form.due_day && (
                    <p className="text-xs text-gray-500 mt-1">Vencimento: dia {form.due_day} de cada mês</p>
                  )}
                  {form.contract_url && (
                    <a href={form.contract_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline mt-1 flex items-center gap-1">
                      <Link className="w-3 h-3" /> Ver contrato
                    </a>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                    💡 Ao salvar, as transações financeiras serão geradas automaticamente no módulo Financeiro.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0 bg-gray-50/50">
          {isEditing && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
