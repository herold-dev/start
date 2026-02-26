import { useState, useEffect } from 'react'
import { fetchProcessos, updateProcesso } from '../lib/processos'
import type { Processo } from '../lib/processos'
import { RichTextEditor } from '../components/ui/RichTextEditor'
import DOMPurify from 'dompurify'
import { BookOpen, AlertCircle, Save, Loader2 } from 'lucide-react'

// Tab configuration
type RoleTab = 'mateus' | 'thamara' | 'admin'

const TABS: { id: RoleTab; label: string; icon: string }[] = [
  { id: 'mateus', label: 'Mateus (Captação & Edição)', icon: '🎥' },
  { id: 'thamara', label: 'Thamara (Comercial & Planejamento)', icon: '📅' },
  { id: 'admin', label: 'Administração Geral', icon: '⚙️' },
]

export default function ProcessosPage() {
  const [activeTab, setActiveTab] = useState<RoleTab>('mateus')
  const [processos, setProcessos] = useState<Processo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Local state for the editor content of the currently active tab
  const [editorContent, setEditorContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadProcessos()
  }, [])

  // When tab changes or processos load, update the local editor content
  useEffect(() => {
    const activeProcesso = processos.find(p => p.role === activeTab)
    if (activeProcesso) {
      setEditorContent(activeProcesso.content || '')
    } else {
      setEditorContent('')
    }
    setIsEditing(false)
    setSaveMessage(null)
  }, [activeTab, processos])

  async function loadProcessos() {
    setLoading(true)
    const data = await fetchProcessos()
    setProcessos(data)
    setLoading(false)
  }

  async function handleSave() {
    const activeProcesso = processos.find(p => p.role === activeTab)
    if (!activeProcesso) return

    setSaving(true)
    setSaveMessage(null)
    const success = await updateProcesso(activeProcesso.id, editorContent)
    
    if (success) {
      // Update local state to reflect the change
      setProcessos(prev => 
        prev.map(p => p.id === activeProcesso.id ? { ...p, content: editorContent } : p)
      )
      setSaveMessage({ type: 'success', text: 'Processo salvo com sucesso!' })
      setIsEditing(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium animate-pulse">Carregando processos...</span>
        </div>
      </div>
    )
  }

  const activeData = processos.find(p => p.role === activeTab)

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto w-full pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            Processos da Agência <BookOpen className="w-6 h-6 text-purple-600" />
          </h2>
          <p className="text-gray-500 mt-1">
            Manual de funções operacionais detalhadas para cada membro da equipe.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeData ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col min-h-[500px]">
          
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-900">{activeData.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Editável. As mudanças são refletidas para todos.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  saveMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage.text}
                </span>
              )}

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  Editar Processos
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditorContent(activeData.content || '') // revert
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Mudanças
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <div className="pb-4">
                  <RichTextEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    placeholder={`Descreva aqui as rotinas e processos detalhados para o cargo...`}
                    minHeight="400px"
                  />
              </div>
            ) : (
              <div 
                className="prose prose-purple max-w-none 
                           prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-4 prose-h2:mb-4
                           prose-p:text-gray-700 prose-p:leading-relaxed
                           prose-li:text-gray-700 prose-ul:my-2
                           prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeData.content || '<p class="text-gray-400 italic">Nenhum processo documentado ainda.</p>') }}
              />
            )}
          </div>
          
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-800">Seção não encontrada</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Os dados de processos para essa aba não foram encontrados no banco de dados. 
              Verifique se as migrations foram rodadas corretamente.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
