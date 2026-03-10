import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClientDetailHeader, type ClientTab } from '../components/clientes/ClientDetailHeader'
import { ContentCalendar } from '../components/clientes/ContentCalendar'
import { ClientNotesTab } from '../components/clientes/ClientNotesTab'
import { InstagramMetricsTab } from '../components/clientes/InstagramMetricsTab'
import { ClientPasswords } from '../components/clientes/ClientPasswords'
import { ClientModal } from '../components/clientes/ClientModal'
import { fetchClients, deleteClient } from '../lib/clientes'
import { fetchContents, fetchNotes } from '../lib/clientContents'
import type { Client, ClientContent, ClientNote, NoteTab } from '../components/clientes/types'

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [client, setClient] = useState<Client | null>(null)
  const [contents, setContents] = useState<ClientContent[]>([])
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ClientTab>('conteudo')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Load client data
  useEffect(() => {
    if (!id) return
    async function load() {
      setIsLoading(true)
      try {
        const clients = await fetchClients()
        const found = clients.find(c => c.id === id)
        if (!found) {
          navigate('/clientes')
          return
        }
        setClient(found)

        const n = await fetchNotes(id!)
        setNotes(n)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, navigate])

  // Load contents when month changes
  useEffect(() => {
    if (!id) return
    async function loadContents() {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString().split('T')[0]
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0]
      const data = await fetchContents(id!, start, end)
      setContents(data)
    }
    loadContents()
  }, [id, currentDate])

  const handleContentSave = useCallback((saved: ClientContent) => {
    setContents(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }, [])

  const handleContentDelete = useCallback((contentId: string) => {
    setContents(prev => prev.filter(c => c.id !== contentId))
  }, [])

  const handleNoteUpdate = useCallback((note: ClientNote) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.tab === note.tab)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = note
        return next
      }
      return [...prev, note]
    })
  }, [])

  async function handleDeleteClient() {
    if (!client) return
    if (!confirm(`Excluir o cliente "${client.name}" e todo o seu conteúdo? Esta ação não pode ser desfeita.`)) return
    const ok = await deleteClient(client.id)
    if (ok) navigate('/clientes')
    else alert('Erro ao excluir cliente.')
  }

  function handleClientSave(saved: Client) {
    setClient(saved)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-2 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
          </div>
        </div>
        <div className="h-10 bg-gray-100 rounded-xl w-full" />
        <div className="h-96 bg-gray-100 rounded-2xl w-full" />
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="flex flex-col gap-6 py-2">
      <ClientDetailHeader
        client={client}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDeleteClient}
      />

      {/* Tab content */}
      {activeTab === 'conteudo' ? (
        <ContentCalendar
          clientId={client.id}
          client={client}
          contents={contents}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onContentSave={handleContentSave}
          onContentDelete={handleContentDelete}
        />
      ) : activeTab === 'metricas' ? (
        <InstagramMetricsTab clientId={client.id} />
      ) : activeTab === 'senhas' ? (
        <ClientPasswords clientId={client.id} />
      ) : (
        <ClientNotesTab
          clientId={client.id}
          tab={activeTab as NoteTab}
          notes={notes}
          onNoteUpdate={handleNoteUpdate}
        />
      )}

      {/* Edit client modal */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        onSave={handleClientSave}
      />
    </div>
  )
}
