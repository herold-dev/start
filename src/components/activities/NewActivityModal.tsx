import { useState, useEffect } from 'react'
import { X, Save, Clock, User, ClipboardList } from 'lucide-react'
import { createManualActivity, updateManualActivity } from '../../lib/activities'
import type { ManualActivity, ManualActivityInput } from '../../lib/activities'

interface ModalProps {
  open: boolean
  onClose: () => void
  activity?: ManualActivity | null
  onSave: (a: ManualActivity) => void
  users: { id: string, nome: string }[]
}

export function NewActivityModal({ open, onClose, activity, onSave, users }: ModalProps) {
  const isEdit = !!activity
  const empty: ManualActivityInput = { title: '', description: '', status: 'pendente' }
  const [form, setForm] = useState<ManualActivityInput>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(activity ? {
      title: activity.title,
      description: activity.description ?? '',
      assigned_to: activity.assigned_to ?? '',
      due_date: activity.due_date ?? '',
      status: activity.status
    } : empty)
  }, [activity, open])

  if (!open) return null

  function set(k: keyof ManualActivityInput, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)

    const payload: ManualActivityInput = {
      ...form,
      assigned_to: form.assigned_to || undefined,
      due_date: form.due_date || undefined
    }

    try {
      let saved: ManualActivity | null
      if (isEdit && activity) {
        saved = await updateManualActivity(activity.id, payload)
      } else {
        saved = await createManualActivity(payload)
      }
      
      if (saved) {
        onSave(saved)
        onClose()
      } else {
        alert('Erro ao salvar atividade. Verifique se o banco de dados já foi atualizado.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            {isEdit ? 'Editar Atividade' : 'Nova Atividade Manual'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Título da Atividade *</label>
            <input 
              value={form.title} 
              onChange={e => set('title', e.target.value)} 
              placeholder="Ex: Revisar roteiro X..." 
              required 
              className={inputCls} 
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descrição Adicional</label>
            <textarea 
              value={form.description || ''} 
              onChange={e => set('description', e.target.value)} 
              placeholder="Detalhes sobre a tarefa (opcional)" 
              rows={3}
              className={`${inputCls} resize-none`} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Responsável */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Responsável
              </label>
              <select 
                value={form.assigned_to || ''} 
                onChange={e => set('assigned_to', e.target.value)} 
                className={inputCls}
              >
                <option value="">— Sem Atribuição —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Prazo (Opcional)
              </label>
              <input 
                type="date" 
                value={form.due_date || ''} 
                onChange={e => set('due_date', e.target.value)} 
                className={inputCls} 
              />
            </div>
          </div>

          {/* Status (Only on Edit) */}
          {isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <select 
                value={form.status} 
                onChange={e => set('status', e.target.value as 'pendente' | 'concluida')} 
                className={inputCls}
              >
                <option value="pendente">Pendente</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          )}

          {/* Botões */}
          <div className="pt-2 flex justify-end gap-3 mt-2 border-t border-gray-100 pb-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
