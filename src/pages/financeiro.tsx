import { useState, useEffect } from 'react'
import {
  BarChart2, TrendingUp, TrendingDown,
  DollarSign, Filter, Plus, ChevronDown,
  Repeat, Settings, Trash2, Edit2,
  ToggleRight, ToggleLeft, Users
} from 'lucide-react'
import { fetchCategories, fetchTransactions, deleteTransaction, updateTransaction, fetchRecurrences, createRecurrence, updateRecurrence, deleteRecurrence } from '../lib/financeiro'
import type { FinCategory, FinTransactionWithCategory, FinTransaction, FinRecurrence, FinRecurrenceWithCategory } from '../components/financeiro/types'
import { CategorySettingsModal } from '../components/financeiro/CategorySettingsModal'
import { TransactionModal } from '../components/financeiro/TransactionModal'
import { MonthPicker } from '../components/ui/MonthPicker'

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* ─── Sub-components ────────────────────────────────────────────────────── */

function StatusBadge({ status, type, onChange }: { status: string, type: 'entrada' | 'saida', onChange: (val: string) => void }) {
  const isAtraso = status === 'Em Atraso'
  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'appearance-none pl-2.5 pr-6 py-0.5 rounded-full text-xs font-semibold cursor-pointer border-none focus:ring-0 outline-none hover:opacity-80 transition-opacity',
          isAtraso
            ? 'bg-red-100 text-red-700'
            : (status === 'Pago' || status === 'Recebido')
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700',
        ].join(' ')}
      >
        {type === 'entrada' ? (
          <>
            <option value="Recebido">Recebido</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Atraso">Em Atraso</option>
          </>
        ) : (
          <>
            <option value="Pago">Pago</option>
            <option value="A Pagar">A Pagar</option>
            <option value="Em Atraso">Em Atraso</option>
          </>
        )}
      </select>
      <ChevronDown className="w-3 h-3 opacity-60 absolute right-2 pointer-events-none" />
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  sub: string
  color: 'green' | 'red' | 'purple'
  icon: React.ReactNode
}

function SummaryCard({ label, value, sub, color, icon }: SummaryCardProps) {
  const colors = {
    green: 'text-emerald-500',
    red: 'text-red-500',
    purple: 'text-violet-500',
  }
  const valueColors = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    purple: 'text-emerald-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <span className={colors[color]}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${valueColors[color]}`}>{fmt(value)}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

/* ─── Recurrence Add/Edit Inline ─────────────────────────────────────── */

function RecurrenceModal({
  isOpen, onClose, recurrence, categories, onSave,
}: {
  isOpen: boolean
  onClose: () => void
  recurrence?: FinRecurrenceWithCategory | null
  categories: FinCategory[]
  onSave: (r: FinRecurrence) => void
}) {
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [value, setValue] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [dueDay, setDueDay] = useState<number | ''>(10)
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!recurrence

  useEffect(() => {
    if (isOpen) {
      if (recurrence) {
        setDescription(recurrence.description)
        setType(recurrence.type)
        setValue(recurrence.value)
        setCategoryId(recurrence.category_id || '')
        setDueDay(recurrence.due_day || 10)
        setIsActive(recurrence.is_active)
      } else {
        setDescription('')
        setType('saida')
        setValue('')
        setCategoryId('')
        setDueDay(10)
        setIsActive(true)
      }
    }
  }, [isOpen, recurrence])

  async function handleSubmit() {
    if (!description.trim()) { alert('Descrição é obrigatória.'); return }
    if (!value || value <= 0) { alert('Valor deve ser maior que zero.'); return }
    setIsSaving(true)
    try {
      const input: Omit<FinRecurrence, 'id' | 'created_at'> = {
        description: description.trim(),
        type,
        value: typeof value === 'number' ? value : 0,
        category_id: categoryId || undefined,
        due_day: typeof dueDay === 'number' ? dueDay : undefined,
        is_active: isActive,
        source: 'manual',
      }
      let saved: FinRecurrence | null
      if (isEditing && recurrence) {
        saved = await updateRecurrence(recurrence.id, input)
      } else {
        saved = await createRecurrence(input)
      }
      if (saved) { onSave(saved); onClose() }
      else alert('Erro ao salvar recorrência.')
    } finally { setIsSaving(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Editar Recorrência' : 'Nova Recorrência'}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Descrição *</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Adobe Creative Cloud"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as 'entrada' | 'saida')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                <option value="entrada">Receita</option>
                <option value="saida">Despesa</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Valor (R$) *</label>
              <input type="number" min="0" step="0.01" value={value}
                onChange={e => setValue(e.target.value ? parseFloat(e.target.value) : '')} placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Categoria</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                <option value="">Sem categoria</option>
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Dia de Vencimento</label>
              <input type="number" min="1" max="31" value={dueDay}
                onChange={e => setDueDay(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <button onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {isActive ? 'Ativa' : 'Pausada'}
          </button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm">
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<'entrada' | 'saida' | 'recorrencias'>('entrada')
  const [transactions, setTransactions] = useState<FinTransactionWithCategory[]>([])
  const [categories, setCategories] = useState<FinCategory[]>([])
  const [recurrences, setRecurrences] = useState<FinRecurrenceWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<FinTransactionWithCategory | null>(null)
  const [isRecModalOpen, setIsRecModalOpen] = useState(false)
  const [editingRec, setEditingRec] = useState<FinRecurrenceWithCategory | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

        const [txs, cats, recs] = await Promise.all([
          fetchTransactions(startOfMonth.toISOString(), endOfMonth.toISOString()),
          fetchCategories(),
          fetchRecurrences(),
        ])
        setTransactions(txs)
        setCategories(cats)
        setRecurrences(recs)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  function handleTxSave(saved: FinTransaction) {
    const cat = categories.find(c => c.id === saved.category_id)
    const fullSaved: FinTransactionWithCategory = { ...saved, category: cat }

    setTransactions(prev => {
      const idx = prev.findIndex(t => t.id === fullSaved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = fullSaved
        return next.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      return [fullSaved, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
  }

  async function handleDeleteTx(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err)
      alert("Erro ao excluir transação.")
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await updateTransaction(id, { status: newStatus });
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar o status.");
    }
  }

  function openNewTx() {
    setEditingTx(null)
    setIsTxModalOpen(true)
  }

  function handleRecSave(saved: FinRecurrence) {
    const cat = categories.find(c => c.id === saved.category_id)
    const full: FinRecurrenceWithCategory = { ...saved, category: cat }
    setRecurrences(prev => {
      const idx = prev.findIndex(r => r.id === full.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = full
        return next
      }
      return [...prev, full]
    })
  }

  async function handleDeleteRec(id: string) {
    if (!confirm("Excluir esta recorrência?")) return
    const ok = await deleteRecurrence(id)
    if (ok) setRecurrences(prev => prev.filter(r => r.id !== id))
    else alert("Erro ao excluir recorrência.")
  }

  const entradas = transactions.filter(t => t.type === 'entrada')
  const saidas = transactions.filter(t => t.type === 'saida')

  const entradasTotal = entradas.reduce((s, r) => s + Number(r.value), 0)
  const saidasTotal = saidas.reduce((s, r) => s + Number(r.value), 0)

  const recEntrada = recurrences.filter(r => r.type === 'entrada' && r.is_active).reduce((s, r) => s + Number(r.value), 0)
  const recSaida = recurrences.filter(r => r.type === 'saida' && r.is_active).reduce((s, r) => s + Number(r.value), 0)

  const entradasAvulsas = entradasTotal - entradas.filter(t => t.is_recurrent).reduce((s, r) => s + Number(r.value), 0)
  const saidasAvulsas = saidasTotal - saidas.filter(t => t.is_recurrent).reduce((s, r) => s + Number(r.value), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-none">Financeiro</h2>
          <p className="text-sm text-gray-500 mt-1">Controle de receitas e despesas</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MonthPicker currentDate={currentDate} onChange={setCurrentDate} />
          <button className="inline-flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Categorias
          </button>
        </div>
      </header>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Entradas do mês"
          value={entradasAvulsas + recEntrada}
          sub={`Avulsas: ${fmt(entradasAvulsas)} · Recorrentes: ${fmt(recEntrada)}`}
          color="green"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <SummaryCard
          label="Saídas do mês"
          value={saidasAvulsas + recSaida}
          sub={`Avulsas: ${fmt(saidasAvulsas)} · Recorrentes: ${fmt(recSaida)}`}
          color="red"
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <SummaryCard
          label="Resultado (Saldo)"
          value={(entradasAvulsas + recEntrada) - (saidasAvulsas + recSaida)}
          sub={(entradasAvulsas + recEntrada) - (saidasAvulsas + recSaida) >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
          color="purple"
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* ── Tabs + Actions ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tab switcher */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {([
            { id: 'entrada' as const, label: 'Entradas' },
            { id: 'saida' as const, label: 'Saídas' },
            { id: 'recorrencias' as const, label: 'Recorrências' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.id === 'recorrencias' && <Repeat className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'recorrencias' && (
          <>
            <button className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            <button
              onClick={openNewTx}
              className={[
                'inline-flex items-center gap-1.5 text-sm font-semibold text-white rounded-xl px-4 py-2 shadow-sm transition-colors',
                activeTab === 'entrada'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-red-500 hover:bg-red-600',
              ].join(' ')}
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'entrada' ? 'Nova entrada' : 'Nova saída'}
            </button>
          </>
        )}

        {activeTab === 'recorrencias' && (
          <button
            onClick={() => { setEditingRec(null); setIsRecModalOpen(true) }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#8b5cf6] hover:bg-purple-700 rounded-xl px-4 py-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova recorrência
          </button>
        )}
      </div>

      {/* ── Table or Recurrences ── */}
      {activeTab === 'recorrencias' ? (
        /* ── Recurrences View ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-500">Descrição</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Tipo</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Categoria</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-right">Valor</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-center">Dia</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-center">Origem</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-center">Status</th>
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Carregando...</td></tr>
                ) : recurrences.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    Nenhuma recorrência cadastrada. Adicione assinaturas, mensalidades ou gastos fixos.
                  </td></tr>
                ) : recurrences.map(rec => (
                  <tr key={rec.id} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <Repeat className={`w-3.5 h-3.5 shrink-0 ${rec.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`} />
                        {rec.description}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        rec.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {rec.type === 'entrada' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {rec.category ? (
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 flex items-center justify-center gap-1.5 w-max px-2.5 py-0.5 rounded-full border border-gray-200/60">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rec.category.color }} />
                          {rec.category.name}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold ${rec.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(rec.value)}<span className="text-xs font-normal text-gray-400">/mês</span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-500">
                      {rec.due_day ? `Dia ${rec.due_day}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {rec.source === 'client' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          Cliente
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Manual</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        rec.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rec.is_active ? 'Ativa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingRec(rec); setIsRecModalOpen(true) }}
                          className="text-gray-400 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteRec(rec.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer totals */}
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-gray-400">Receitas recorrentes</span>
                <p className="text-sm font-bold text-emerald-600">{fmt(recEntrada)}/mês</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Despesas recorrentes</span>
                <p className="text-sm font-bold text-red-500">{fmt(recSaida)}/mês</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Saldo recorrente</span>
              <p className={`text-sm font-bold ${recEntrada - recSaida >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmt(recEntrada - recSaida)}/mês
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Transactions Table ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                  </th>
                  {/* icon col */}
                  <th className="w-8 px-2 py-3" />
                  <th className="px-3 py-3 font-semibold text-gray-500 whitespace-nowrap">Data</th>
                  {activeTab === 'entrada' && (
                    <th className="px-3 py-3 font-semibold text-gray-500">Cliente</th>
                  )}
                  <th className="px-3 py-3 font-semibold text-gray-500">Descrição</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Categoria</th>
                  <th className="px-3 py-3 font-semibold text-gray-500 text-right">Valor</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Status</th>
                  {activeTab === 'saida' && (
                    <th className="px-3 py-3 font-semibold text-gray-500">Pgto</th>
                  )}
                  <th className="px-3 py-3 font-semibold text-gray-500">Origem</th>
                  <th className="w-8 px-2 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                      Carregando transações...
                    </td>
                  </tr>
                ) : (activeTab === 'entrada' ? entradas : saidas).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                      Nenhuma {activeTab === 'entrada' ? 'entrada' : 'saída'} encontrada neste mês.
                    </td>
                  </tr>
                ) : (activeTab === 'entrada' ? entradas : saidas).map((row) => {
                  const isEntrada = row.type === 'entrada';
                  const dateRaw = new Date(row.date);
                  const localDateObj = new Date(dateRaw.getTime() + dateRaw.getTimezoneOffset() * 60 * 1000);
                  const formattedDate = localDateObj.toLocaleDateString('pt-BR');

                  return (
                    <tr key={row.id} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                      </td>
                      <td className="px-2 py-3">
                        {row.is_recurrent && (
                          <Repeat className="w-3.5 h-3.5 text-violet-400" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formattedDate}</td>
                      {isEntrada && <td className="px-3 py-3 text-gray-700 font-medium max-w-[160px] truncate">{row.client_name || '—'}</td>}
                      <td className="px-3 py-3 text-gray-700">{row.description}</td>
                      <td className="px-3 py-3">
                        {row.category ? (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 flex items-center justify-center gap-1.5 w-max px-2.5 py-0.5 rounded-full border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.category.color }} />
                            {row.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${isEntrada ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmt(row.value)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge 
                          status={row.status} 
                          type={row.type} 
                          onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                        />
                      </td>
                      {!isEntrada && <td className="px-3 py-3 text-gray-500">{row.pgto_method || '—'}</td>}
                      <td className="px-3 py-3">
                        {row.source === 'client' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            <Users className="w-3 h-3" />
                            Cliente
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Manual</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingTx(row); setIsTxModalOpen(true); }}
                            className="text-gray-400 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTx(row.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer total */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-600">Total</span>
            <span
              className={`text-sm font-bold ${
                activeTab === 'entrada' ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {activeTab === 'entrada' ? fmt(entradasTotal) : fmt(saidasTotal)}
            </span>
          </div>
        </div>
      )}
      
      <CategorySettingsModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      <TransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        categories={categories}
        transaction={editingTx}
        defaultType={activeTab === 'recorrencias' ? 'entrada' : activeTab}
        onSave={handleTxSave}
      />

      <RecurrenceModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        recurrence={editingRec}
        categories={categories}
        onSave={handleRecSave}
      />
    </div>
  )
}
