import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { fetchServices, createService, updateService, deleteService, type Service, type ServiceInput } from '../lib/services'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* ── Modal de Serviço ────────────────────────────────────────────────── */

function ServiceModal({
  isOpen, onClose, service, onSave,
}: {
  isOpen: boolean
  onClose: () => void
  service?: Service | null
  onSave: (s: Service) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState<number | ''>('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!service

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setName(service.name)
        setDescription(service.description || '')
        setBasePrice(service.base_price)
        setIsActive(service.is_active)
      } else {
        setName('')
        setDescription('')
        setBasePrice('')
        setIsActive(true)
      }
    }
  }, [isOpen, service])

  async function handleSubmit() {
    if (!name.trim()) {
      alert('O nome do serviço é obrigatório.')
      return
    }
    setIsSaving(true)
    try {
      const input: ServiceInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        base_price: typeof basePrice === 'number' ? basePrice : 0,
        is_active: isActive,
      }

      let saved: Service | null
      if (isEditing && service) {
        saved = await updateService(service.id, input)
      } else {
        saved = await createService(input)
      }

      if (saved) {
        onSave(saved)
        onClose()
      } else {
        alert('Erro ao salvar serviço.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Defina os detalhes do serviço oferecido pela sua empresa.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Nome do Serviço *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Gestão de Conteúdo"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que está incluso no serviço..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Preço Base (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={e => setBasePrice(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {isActive ? 'Ativo' : 'Inativo'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Serviço'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Página Principal ────────────────────────────────────────────────── */

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    setIsLoading(true)
    const data = await fetchServices()
    setServices(data)
    setIsLoading(false)
  }

  function handleSave(saved: Service) {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este serviço? Ele será removido do catálogo.')) return
    const ok = await deleteService(id)
    if (ok) {
      setServices(prev => prev.filter(s => s.id !== id))
    } else {
      alert('Erro ao excluir serviço.')
    }
  }

  async function handleToggleActive(service: Service) {
    const updated = await updateService(service.id, { is_active: !service.is_active })
    if (updated) {
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
    }
  }

  const activeServices = services.filter(s => s.is_active)
  const inactiveServices = services.filter(s => !s.is_active)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-none flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-500" />
            Serviços
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Catálogo de serviços oferecidos pela sua empresa
          </p>
        </div>
        <button
          onClick={() => { setEditingService(null); setModalOpen(true) }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl px-4 py-2.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Serviços</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{services.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ativos</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeServices.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {activeServices.length > 0
              ? fmt(activeServices.reduce((s, svc) => s + svc.base_price, 0) / activeServices.length)
              : 'R$ 0,00'}
          </p>
        </div>
      </div>

      {/* Service List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center text-gray-400">
          Carregando serviços...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum serviço cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Crie seus serviços para vincular aos clientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-500">Serviço</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Descrição</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-right">Preço Base</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-center">Status</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...activeServices, ...inactiveServices].map(svc => (
                <tr key={svc.id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-800">{svc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[250px] truncate">
                    {svc.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                    {svc.base_price > 0 ? fmt(svc.base_price) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(svc)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        svc.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {svc.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {svc.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingService(svc); setModalOpen(true) }}
                        className="text-gray-400 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        service={editingService}
        onSave={handleSave}
      />
    </div>
  )
}
