import type { InstagramMetric } from './types'
import { METRIC_FIELDS } from '../../lib/instagramMetrics'

interface Props {
  metrics: InstagramMetric[]
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

export function SharedInstagramMetrics({ metrics }: Props) {
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
      <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Período Atual</p>
            <h2 className="text-2xl font-bold mt-0.5">{getPeriodLabel(latest.period)}</h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
            📊
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {METRIC_FIELDS.map(field => {
            const curr = latest[field.key]
            const prevVal = prev?.[field.key]
            const delta = getDelta(curr, prevVal)
            return (
              <div key={field.key} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
                <div className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  {field.emoji} {field.label}
                </div>
                <div className="text-white text-xl font-bold leading-none">
                  {formatNumber(curr)}
                </div>
                {delta !== null && (
                  <div className={`text-xs font-semibold mt-1 ${delta.positive ? 'text-emerald-300' : 'text-red-300'}`}>
                    {delta.positive ? '↑' : '↓'} {Math.abs(delta.pct)}% vs mês ant.
                  </div>
                )}
                {delta === null && prevVal != null && (
                  <div className="text-white/50 text-xs mt-1">Ant: {formatNumber(prevVal)}</div>
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
    </div>
  )
}
