import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { ClientCard } from '../components/ClientCard'
import { ClientModal } from '../components/clientes/ClientModal'
import { fetchClients } from '../lib/clientes'
import { fetchAllClientsContentStats, type ContentStats } from '../lib/clientContents'
import type { Client } from '../components/clientes/types'

type SortKey = 'nome' | 'recentes' | 'ativos'

export default function ClientesPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [statsMap, setStatsMap] = useState<Record<string, ContentStats>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nome')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setIsLoading(true)
    const [data, stats] = await Promise.all([
      fetchClients(),
      fetchAllClientsContentStats(),
    ])
    setClients(data)
    setStatsMap(stats)
    setIsLoading(false)
  }

  function openNew() {
    setIsModalOpen(true)
  }

  function goToDetail(client: Client) {
    navigate(`/clientes/${client.id}`)
  }

  function handleSave(saved: Client) {
    setClients(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
  }

  function handleDelete(id: string) {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const filtered = useMemo(() => {
    let result = [...clients]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.social_handle || '').toLowerCase().includes(q) ||
        (c.segment || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    }

    if (sortKey === 'nome') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortKey === 'recentes') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortKey === 'ativos') result.sort((a, b) => (a.status === 'Ativo' ? -1 : 1) - (b.status === 'Ativo' ? -1 : 1))

    return result
  }, [clients, search, sortKey])

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900 leading-none">Todos os clientes</h2>
          <p className="text-gray-500 mt-2 text-[15px]">
            Gerencie todos os clientes e seus conteúdos
            {!isLoading && (
              <span className="ml-2 text-sm font-medium text-gray-400">
                ({clients.length} {clients.length === 1 ? 'cliente' : 'clientes'})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-5 py-2.5 rounded-[12px] font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm tracking-wide"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </header>

      <div className="bg-gray-50/70 p-1.5 rounded-[14px] border border-gray-100 flex flex-col sm:flex-row items-center gap-2 mt-2">
        <div className="flex bg-white rounded-[10px] border border-gray-200 flex-1 px-3 py-2.5 items-center focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all w-full shadow-sm">
          <Search className="w-[18px] h-[18px] text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, @handle, segmento ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-2 w-full outline-none text-[14px] text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="bg-white rounded-[10px] border border-gray-200 px-4 py-2.5 text-[14px] text-gray-700 font-medium min-w-[200px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-8"
          >
            <option value="nome">Nome (A-Z)</option>
            <option value="recentes">Mais Recentes</option>
            <option value="ativos">Ativos Primeiro</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[20px] border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-[110px] bg-gray-200" />
              <div className="px-6 pt-12 pb-6">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {search
              ? `Sem resultados para "${search}". Tente outro termo.`
              : 'Clique em "Novo Cliente" para começar.'}
          </p>
          {!search && (
            <button
              onClick={openNew}
              className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={goToDetail}
              stats={statsMap[client.id]}
            />
          ))}
        </div>
      )}

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={null}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
