import type { InstagramMetric, HighlightedPost } from './types'
import { METRIC_FIELDS } from '../../lib/instagramMetrics'
import { Star, Award } from 'lucide-react'

interface Props {
  metrics: InstagramMetric[]
  highlightedPosts?: HighlightedPost[]
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function getPeriodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function formatNumber(n?: number) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR')
}

function getDelta(curr?: number, prev?: number) {
  if (curr == null || prev == null || prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  return { pct: Math.round(pct), positive: pct >= 0 }
}

const PERIOD_BG = [
  'from-pink-500 to-purple-600',
  'from-purple-500 to-indigo-600',
  'from-indigo-500 to-blue-600',
  'from-blue-500 to-cyan-600',
]

const CONTENT_TYPE_LABELS: Record<string, string> = {
  carrossel: '📸 Carrossel',
  estatico: '🖼️ Estático',
  reels: '🎬 Reels',
}

export function SharedInstagramMetrics({ metrics, highlightedPosts = [] }: Props) {
  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-400 text-sm font-medium">Nenhuma métrica disponível ainda.</p>
      </div>
    )
  }

  const sorted = [...metrics].sort((a, b) => b.period.localeCompare(a.period))
  const latest = sorted[0]
  const prev = sorted[1]

  return (
    <div className="flex flex-col gap-6">
      {/* Latest month headline */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Período Atual</p>
            <h2 className="text-2xl font-bold mt-0.5 text-gray-800">{getPeriodLabel(latest.period)}</h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-purple-100 flex items-center justify-center text-2xl">
            📊
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {METRIC_FIELDS.map(field => {
            const curr = latest[field.key]
            const prevVal = prev?.[field.key]
            const delta = getDelta(curr, prevVal)
            return (
              <div key={field.key} className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100/50">
                <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  {field.emoji} {field.label}
                </div>
                <div className="text-gray-900 text-xl font-bold leading-none">
                  {formatNumber(curr)}
                </div>
                {delta !== null && (
                  <div className={`text-xs font-semibold mt-1 ${delta.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {delta.positive ? '↑' : '↓'} {Math.abs(delta.pct)}% vs mês ant.
                  </div>
                )}
                {delta === null && prevVal != null && (
                  <div className="text-gray-400 text-xs mt-1">Ant: {formatNumber(prevVal)}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly history cards */}
      {sorted.length > 1 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-gray-600 px-1">Histórico por Mês</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.slice(0, 6).map((m, i) => {
              const prevM = sorted[i + 1]
              const gradient = PERIOD_BG[i % PERIOD_BG.length]
              return (
                <div key={m.period} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center justify-between`}>
                    <span className="text-white font-bold text-sm">{getPeriodLabel(m.period)}</span>
                    {i === 0 && (
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                        Mais recente
                      </span>
                    )}
                  </div>
                  {/* Metrics */}
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {METRIC_FIELDS.slice(0, 6).map(field => {
                      const curr = m[field.key]
                      const prevVal = prevM?.[field.key]
                      const delta = getDelta(curr, prevVal)
                      return (
                        <div key={field.key}>
                          <div className="text-[10px] text-gray-400 font-medium">{field.label}</div>
                          <div className="text-sm font-bold text-gray-800">{formatNumber(curr)}</div>
                          {delta !== null && (
                            <div className={`text-[10px] font-semibold ${delta.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                              {delta.positive ? '↑' : '↓'}{Math.abs(delta.pct)}%
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Posts em Destaque */}
      {highlightedPosts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-600">Posts em Destaque</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highlightedPosts.map(h => (
              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* Card header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Star className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-gray-800 font-bold text-sm truncate">{h.content_title || 'Post'}</span>
                  </div>
                  {h.content_type && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                      {CONTENT_TYPE_LABELS[h.content_type] || h.content_type}
                    </span>
                  )}
                </div>
                {/* Card body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between">
                    {h.content_scheduled_date && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(h.content_scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </span>
                    )}
                    {h.post_url && (
                      <a
                        href={h.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm hover:shadow-md px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5"
                      >
                        Ver no Instagram ↗
                      </a>
                    )}
                  </div>
                  {h.highlight_reason && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Por que se destacou</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{h.highlight_reason}</p>
                    </div>
                  )}
                  {h.highlight_metrics && (
                    <div className="bg-orange-50/50 border border-orange-100/50 rounded-xl p-3 mt-auto">
                      <p className="text-[11px] font-semibold text-orange-600 mb-1">Métricas em destaque</p>
                      <p className="text-xs text-orange-900 leading-relaxed">{h.highlight_metrics}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
