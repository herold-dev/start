import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Save, CheckCircle, ChevronLeft, ChevronRight, Loader2, Plus, Star, Trash2, Edit3, Award } from 'lucide-react'
import { fetchMetrics, upsertMetric, METRIC_FIELDS } from '../../lib/instagramMetrics'
import { fetchHighlightedPosts, addHighlightedPost, updateHighlightedPost, removeHighlightedPost } from '../../lib/highlightedPosts'
import { fetchContents } from '../../lib/clientContents'
import type { InstagramMetric, HighlightedPost, ClientContent } from './types'

interface Props {
  clientId: string
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatNumber(n?: number) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR')
}

function getPeriodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function getDelta(curr?: number, prev?: number): { pct: number | null; positive: boolean } {
  if (curr == null || prev == null || prev === 0) return { pct: null, positive: true }
  const pct = ((curr - prev) / prev) * 100
  return { pct: Math.round(pct), positive: pct >= 0 }
}

export function InstagramMetricsTab({ clientId }: Props) {
  const now = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [metrics, setMetrics] = useState<InstagramMetric[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Highlighted posts state
  const [highlights, setHighlights] = useState<HighlightedPost[]>([])
  const [monthContents, setMonthContents] = useState<ClientContent[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContentId, setNewContentId] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newMetrics, setNewMetrics] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [isSavingHighlight, setIsSavingHighlight] = useState(false)

  // Load all metrics for this client
  useEffect(() => {
    setIsLoading(true)
    fetchMetrics(clientId).then(data => {
      setMetrics(data)
      setIsLoading(false)
    })
  }, [clientId])

  // Load highlighted posts
  const loadHighlights = useCallback(() => {
    fetchHighlightedPosts(clientId, selectedPeriod).then(setHighlights)
  }, [clientId, selectedPeriod])

  useEffect(() => { loadHighlights() }, [loadHighlights])

  // Load month contents for the dropdown
  useEffect(() => {
    const [y, m] = selectedPeriod.split('-').map(Number)
    const start = new Date(y, m - 1, 1).toISOString().split('T')[0]
    const end = new Date(y, m, 0).toISOString().split('T')[0]
    fetchContents(clientId, start, end).then(setMonthContents)
  }, [clientId, selectedPeriod])

  // Populate form when period changes
  useEffect(() => {
    const found = metrics.find(m => m.period === selectedPeriod)
    const initial: Record<string, string> = {}
    METRIC_FIELDS.forEach(f => {
      initial[f.key] = found?.[f.key] != null ? String(found[f.key]) : ''
    })
    setFormValues(initial)
    setSavedOk(false)
  }, [selectedPeriod, metrics])

  function navigateMonth(dir: 1 | -1) {
    const [y, m] = selectedPeriod.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setSelectedPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  async function handleSave() {
    setIsSaving(true)
    const payload: Record<string, number | null> = {}
    METRIC_FIELDS.forEach(f => {
      const v = formValues[f.key]
      payload[f.key] = v !== '' ? Number(v) : null
    })
    const saved = await upsertMetric(clientId, selectedPeriod, payload)
    if (saved) {
      setMetrics(prev => {
        const idx = prev.findIndex(m => m.period === selectedPeriod)
        if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
        return [saved, ...prev].sort((a, b) => b.period.localeCompare(a.period))
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    }
    setIsSaving(false)
  }

  // Highlighted posts handlers
  async function handleAddHighlight() {
    if (!newContentId) return
    setIsSavingHighlight(true)
    const saved = await addHighlightedPost(clientId, newContentId, selectedPeriod, newReason, newMetrics, newUrl)
    if (saved) {
      loadHighlights()
      setShowAddForm(false)
      setNewContentId('')
      setNewReason('')
      setNewMetrics('')
      setNewUrl('')
    }
    setIsSavingHighlight(false)
  }

  async function handleUpdateHighlight(id: string) {
    setIsSavingHighlight(true)
    await updateHighlightedPost(id, newReason, newMetrics, newUrl)
    loadHighlights()
    setEditingId(null)
    setNewReason('')
    setNewMetrics('')
    setNewUrl('')
    setIsSavingHighlight(false)
  }

  async function handleRemoveHighlight(id: string) {
    if (!confirm('Remover este post em destaque?')) return
    await removeHighlightedPost(id)
    loadHighlights()
  }

  function startEditing(h: HighlightedPost) {
    setEditingId(h.id)
    setNewReason(h.highlight_reason || '')
    setNewMetrics(h.highlight_metrics || '')
    setNewUrl(h.post_url || '')
  }

  // Posts available for highlighting (not already highlighted)
  const highlightedContentIds = new Set(highlights.map(h => h.content_id))
  const availableContents = monthContents.filter(c => !highlightedContentIds.has(c.id))

  // Find previous month metric for comparison in the history list
  const [selYear, selMonth] = selectedPeriod.split('-').map(Number)
  const prevPeriodDate = new Date(selYear, selMonth - 2, 1)
  const prevPeriod = `${prevPeriodDate.getFullYear()}-${String(prevPeriodDate.getMonth() + 1).padStart(2, '0')}`
  const prevMetric = metrics.find(m => m.period === prevPeriod)

  const recentMetrics = metrics.slice(0, 6)

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    carrossel: '📸 Carrossel',
    estatico: '🖼️ Estático',
    reels: '🎬 Reels',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector + Save */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-sm">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm leading-none">Métricas do Instagram</h2>
              <p className="text-xs text-gray-400 mt-0.5">Edite os dados do período selecionado</p>
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-gray-800 min-w-[130px] text-center">
              {getPeriodLabel(selectedPeriod)}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric inputs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {METRIC_FIELDS.map(field => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                {field.emoji} {field.label}
              </label>
              <input
                type="number"
                min="0"
                value={formValues[field.key] ?? ''}
                onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder="—"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all placeholder:text-gray-300"
              />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              savedOk
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedOk ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savedOk ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Comparison with previous month */}
      {prevMetric && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            Comparação com {getPeriodLabel(prevPeriod)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {METRIC_FIELDS.map(field => {
              const curr = formValues[field.key] !== '' ? Number(formValues[field.key]) : undefined
              const prev = prevMetric[field.key]
              const { pct, positive } = getDelta(curr, prev)
              return (
                <div key={field.key} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">{field.emoji} {field.label}</div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(curr)}</div>
                  {pct !== null && (
                    <div className={`text-xs font-semibold mt-0.5 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {positive ? '↑' : '↓'} {Math.abs(pct)}% vs mês ant.
                    </div>
                  )}
                  {pct === null && prev != null && (
                    <div className="text-xs text-gray-400 mt-0.5">Ant: {formatNumber(prev)}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent history */}
      {recentMetrics.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Histórico Recente</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 whitespace-nowrap">Período</th>
                  {METRIC_FIELDS.map(f => (
                    <th key={f.key} className="text-right py-2 px-2 text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMetrics.map((m, i) => (
                  <tr
                    key={m.period}
                    onClick={() => setSelectedPeriod(m.period)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-purple-50 ${
                      m.period === selectedPeriod ? 'bg-purple-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-semibold text-gray-700 whitespace-nowrap">
                      {getPeriodLabel(m.period)}
                    </td>
                    {METRIC_FIELDS.map(f => (
                      <td key={f.key} className="text-right py-2.5 px-2 text-gray-600 whitespace-nowrap">
                        {formatNumber(m[f.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Posts em Destaque ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 leading-none">Posts em Destaque</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Selecione os posts que mais engajaram neste mês</p>
            </div>
          </div>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          )}
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4 mb-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Post do mês</label>
                <select
                  value={newContentId}
                  onChange={e => setNewContentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all"
                >
                  <option value="">Selecione um post...</option>
                  {availableContents.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {CONTENT_TYPE_LABELS[c.content_type] || c.content_type}
                      {c.scheduled_date ? ` (${new Date(c.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')})` : ''}
                    </option>
                  ))}
                </select>
                {availableContents.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">Nenhum post disponível neste mês (todos já estão em destaque ou não há conteúdos).</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Por que se destacou?</label>
                <textarea
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="Ex: Esse post gerou muito engajamento orgânico e atraiu novos seguidores..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all placeholder:text-gray-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Em quais métricas se destacou?</label>
                <textarea
                  value={newMetrics}
                  onChange={e => setNewMetrics(e.target.value)}
                  placeholder="Ex: Alcance +45%, 120 salvamentos, 89 compartilhamentos..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all placeholder:text-gray-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Link do Post (Insta)</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="Ex: https://instagram.com/p/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all placeholder:text-gray-300"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowAddForm(false); setNewContentId(''); setNewReason(''); setNewMetrics(''); setNewUrl('') }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddHighlight}
                  disabled={!newContentId || isSavingHighlight}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isSavingHighlight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                  Destacar Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of highlighted posts */}
        {highlights.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🌟</div>
            <p className="text-sm text-gray-400">Nenhum post em destaque neste mês.</p>
            <p className="text-xs text-gray-300 mt-0.5">Clique em "Adicionar" para destacar um post.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {highlights.map(h => (
              <div key={h.id} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4 transition-all hover:shadow-sm">
                {editingId === h.id ? (
                  /* Editing mode */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-gray-800">{h.content_title || 'Post sem título'}</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Por que se destacou?</label>
                      <textarea
                        value={newReason}
                        onChange={e => setNewReason(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Em quais métricas?</label>
                      <textarea
                        value={newMetrics}
                        onChange={e => setNewMetrics(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Link do Post</label>
                      <input
                        type="url"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        placeholder="Ex: https://instagram.com/p/..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all placeholder:text-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-white transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleUpdateHighlight(h.id)}
                        disabled={isSavingHighlight}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-50"
                      >
                        {isSavingHighlight ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Star className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-800 block truncate">{h.content_title || 'Post sem título'}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {h.content_type && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold">
                                {CONTENT_TYPE_LABELS[h.content_type] || h.content_type}
                              </span>
                            )}
                            {h.content_scheduled_date && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(h.content_scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {h.post_url ? (
                              <a
                                href={h.post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors flex items-center gap-0.5"
                              >
                                Ver no Instagram ↗
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium italic">
                                Sem link
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditing(h)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveHighlight(h.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {h.highlight_reason && (
                      <div className="mt-2.5 bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[11px] font-semibold text-amber-600 mb-0.5">Por que se destacou</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{h.highlight_reason}</p>
                      </div>
                    )}
                    {h.highlight_metrics && (
                      <div className="mt-2 bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[11px] font-semibold text-orange-600 mb-0.5">Métricas de destaque</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{h.highlight_metrics}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
