import { useState, useEffect } from 'react'
import { RichTextEditor } from '../ui/RichTextEditor'
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
  const [tempNotes, setTempNotes] = useState(existingNote?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const cfg = TAB_TITLES[tab]

  useEffect(() => {
    const note = notes.find(n => n.tab === tab)
    setTempNotes(note?.content || '')
    setLastSaved(null)
  }, [tab, notes])

  useEffect(() => {
    const handler = setTimeout(() => {
      // Only save if the content has actually changed from the initial/last saved state
      // and if it's not empty (or if it was empty and now it's not)
      if (tempNotes !== existingNote?.content) {
        saveNote(tempNotes)
      }
    }, 1500) // Debounce time

    return () => {
      clearTimeout(handler)
    }
  }, [tempNotes, existingNote?.content]) // Trigger when tempNotes changes

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
    // Clear any pending auto-save debounce and save immediately
    // (The useEffect will be triggered again after setTempNotes, but this ensures immediate save)
    await saveNote(tempNotes)
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

      <div className="flex-1 min-h-[400px]">
        <RichTextEditor
          content={tempNotes}
          onChange={setTempNotes}
          placeholder={`Adicione notas, links de pastas do drive, preferências do cliente...\n\n- Horários preferidos\n- Paleta de cores\n- Restrições`}
          minHeight="400px"
        />
      </div>
    </div>
  )
}
