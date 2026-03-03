import { useState, useEffect } from 'react'
import { BarChart2, Save, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { fetchMetrics, upsertMetric, METRIC_FIELDS } from '../../lib/instagramMetrics'
import type { InstagramMetric } from './types'

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

  // Load all metrics for this client
  useEffect(() => {
    setIsLoading(true)
    fetchMetrics(clientId).then(data => {
      setMetrics(data)
      setIsLoading(false)
    })
  }, [clientId])

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

  // Find previous month metric for comparison in the history list
  const [selYear, selMonth] = selectedPeriod.split('-').map(Number)
  const prevPeriodDate = new Date(selYear, selMonth - 2, 1)
  const prevPeriod = `${prevPeriodDate.getFullYear()}-${String(prevPeriodDate.getMonth() + 1).padStart(2, '0')}`
  const prevMetric = metrics.find(m => m.period === prevPeriod)

  const recentMetrics = metrics.slice(0, 6)

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
    </div>
  )
}
