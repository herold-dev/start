import { useState, useEffect, useRef } from 'react'
import { Save, Loader2 } from 'lucide-react'
import type { NoteTab, ClientNote } from './types'
import { upsertNote } from '../../lib/clientContents'

interface ClientNotesTabProps {
  clientId: string
  tab: NoteTab
  notes: ClientNote[]
  onNoteUpdate: (note: ClientNote) => void
}

const TAB_TITLES: Record<NoteTab, { title: string; placeholder: string }> = {
  diagnostico:     { title: 'Diagnóstico', placeholder: 'Análise inicial do cliente, pontos fortes, pontos fracos, oportunidades...' },
  persona:         { title: 'Persona', placeholder: 'Descrição da persona ideal, dores, desejos, comportamentos...' },
  concorrencia:    { title: 'Concorrência', placeholder: 'Análise dos principais concorrentes, diferenciais, referências...' },
  posicionamento:  { title: 'Posicionamento', placeholder: 'Proposta de valor, tom de voz, pilares de conteúdo...' },
  produtos:        { title: 'Produtos', placeholder: 'Catálogo de produtos/serviços, preços, diferenciais...' },
  ia:              { title: 'IA', placeholder: 'Instruções para IA, prompts customizados, contexto...' },
}

export function ClientNotesTab({ clientId, tab, notes, onNoteUpdate }: ClientNotesTabProps) {
  const existingNote = notes.find(n => n.tab === tab)
  const [content, setContent] = useState(existingNote?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const cfg = TAB_TITLES[tab]

  useEffect(() => {
    const note = notes.find(n => n.tab === tab)
    setContent(note?.content || '')
    setLastSaved(null)
  }, [tab, notes])

  function handleChange(value: string) {
    setContent(value)

    // Auto-save com debounce de 1.5s
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveNote(value)
    }, 1500)
  }

  async function saveNote(text: string) {
    setIsSaving(true)
    try {
      const saved = await upsertNote(clientId, tab, text)
      if (saved) {
        onNoteUpdate(saved)
        setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleManualSave() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await saveNote(content)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">{cfg.title}</h3>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-400">Salvo às {lastSaved}</span>
          )}
          {isSaving && (
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder={cfg.placeholder}
        rows={18}
        className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-700 leading-relaxed outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none shadow-sm placeholder:text-gray-300"
      />
    </div>
  )
}
