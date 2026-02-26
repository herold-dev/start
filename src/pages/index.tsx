import { useState, useEffect } from 'react'
import { CalendarDays, Clock, Video, Camera, FileText, CheckSquare, Sparkles } from 'lucide-react'
import {
  fetchContentStats,
  fetchUpcomingManualTasks,
  fetchUpcomingMeetings,
  fetchUpcomingCaptures,
} from '../lib/dashboard'
import type { ContentStats, UpcomingActivity } from '../lib/dashboard'

export default function DashboardPage() {
  const [contentStats, setContentStats] = useState<ContentStats>({ emAprovacao: 0, emAjuste: 0, aprovado: 0, total: 0 })
  const [tasks, setTasks] = useState<UpcomingActivity[]>([])
  const [meetings, setMeetings] = useState<UpcomingActivity[]>([])
  const [captures, setCaptures] = useState<UpcomingActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [stats, t, m, c] = await Promise.all([
        fetchContentStats(),
        fetchUpcomingManualTasks(),
        fetchUpcomingMeetings(),
        fetchUpcomingCaptures()
      ])
      setContentStats(stats)
      setTasks(t)
      setMeetings(m)
      setCaptures(c)
      setLoading(false)
    }
    load()
  }, [])

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    
    if (isToday) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Calculate percentages for the CSS stacked bar chart
  const hasContents = contentStats.total > 0
  const pctAjuste = hasContents ? Math.round((contentStats.emAjuste / contentStats.total) * 100) : 0
  const pctAprovacao = hasContents ? Math.round((contentStats.emAprovacao / contentStats.total) * 100) : 0
  const pctAprovado = hasContents ? Math.round((contentStats.aprovado / contentStats.total) * 100) : 0

  return (
    <div className="flex flex-col h-full space-y-6">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          Dashboard <Sparkles className="w-6 h-6 text-purple-400" />
        </h2>
        <p className="text-gray-500 mt-1">
          Resumo do dia e atividades mais próximas do vencimento
        </p>
      </header>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Content Status Chart Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2 text-gray-800">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4"/></span> 
              Status dos Conteúdos
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Distribuição de posts de clientes ativos neste mês
            </p>
          </div>

          {!loading && hasContents ? (
             <div>
                {/* Custom CSS Bar Chart */}
                <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-100 mb-4 shadow-inner">
                  <div style={{ width: `${pctAjuste}%` }} className="bg-rose-500 transition-all duration-1000" title={`Em Ajuste: ${pctAjuste}%`} />
                  <div style={{ width: `${pctAprovacao}%` }} className="bg-amber-400 transition-all duration-1000" title={`Em Aprovação: ${pctAprovacao}%`} />
                  <div style={{ width: `${pctAprovado}%` }} className="bg-emerald-500 transition-all duration-1000" title={`Aprovados: ${pctAprovado}%`} />
                </div>
                {/* Legend */}
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                   <div className="flex items-center gap-1.5 text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Ajuste ({contentStats.emAjuste})
                   </div>
                   <div className="flex items-center gap-1.5 text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Aprovação ({contentStats.emAprovacao})
                   </div>
                   <div className="flex items-center gap-1.5 text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Aprovado ({contentStats.aprovado})
                   </div>
                </div>
             </div>
          ) : (
             <div className="h-20 bg-gray-50 flex items-center justify-center rounded-xl text-sm text-gray-400 font-medium">
               {loading ? 'Carregando gráfico...' : 'Nenhum conteúdo postado.'}
             </div>
          )}
        </div>

        {/* Action Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
             <h3 className="font-bold flex items-center gap-2 text-gray-800">
               <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><CheckSquare className="w-4 h-4"/></span> 
               Resumo de Produtividade
             </h3>
             <p className="text-xs text-gray-500 mt-1">Status de tarefas mapeadas para os próximos dias.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 h-20">
             <div className="bg-orange-50 rounded-xl p-3 flex flex-col justify-center">
                 <span className="text-2xl font-black text-orange-600 leading-none">{tasks.length}</span>
                 <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider mt-1">Tarefas Iminentes</span>
             </div>
             <div className="bg-indigo-50 rounded-xl p-3 flex flex-col justify-center">
                 <span className="text-2xl font-black text-indigo-600 leading-none">{meetings.length}</span>
                 <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mt-1">Reuniões Agendadas</span>
             </div>
          </div>
        </div>

      </div>

      {/* Lists Row */}
      <h3 className="text-xl font-bold text-gray-900 pt-2 border-t border-gray-100">Próximos Compromissos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

         {/* 1. Atividades Manuais */}
         <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-orange-50 border-b border-orange-100 px-4 py-3">
               <h4 className="font-bold text-orange-800 flex items-center gap-2">
                 <CheckSquare className="w-4 h-4 text-orange-500" /> Tarefas Manuais
               </h4>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              {loading ? (
                <div className="text-xs text-center text-gray-400 py-6">Carregando...</div>
              ) : tasks.length === 0 ? (
                <div className="text-xs text-center text-gray-400 py-8 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhuma tarefa próxima.</div>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="p-3 border border-gray-100 bg-white rounded-xl shadow-sm hover:border-orange-200 transition-colors">
                     <p className="font-bold text-gray-900 text-sm mb-1">{t.title}</p>
                     <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded"><Clock className="w-3 h-3"/> {formatDate(t.date)}</span>
                        {t.assignee && <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Resp: {t.assignee}</span>}
                     </div>
                  </div>
                ))
              )}
            </div>
         </div>

         {/* 2. Reuniões */}
         <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3">
               <h4 className="font-bold text-indigo-800 flex items-center gap-2">
                 <Video className="w-4 h-4 text-indigo-500" /> Reuniões
               </h4>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              {loading ? (
                <div className="text-xs text-center text-gray-400 py-6">Carregando...</div>
              ) : meetings.length === 0 ? (
                <div className="text-xs text-center text-gray-400 py-8 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhuma reunião próxima.</div>
              ) : (
                meetings.map(m => (
                  <div key={m.id} className="p-3 border border-gray-100 bg-white rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                     <p className="font-bold text-gray-900 text-sm mb-1">{m.title}</p>
                     <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mt-2">
                        <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded"><Clock className="w-3 h-3"/> {formatDate(m.date)}</span>
                     </div>
                     {m.clientName && (
                        <div className="mt-1.5 text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md inline-block">
                           Cli: {m.clientName}
                        </div>
                     )}
                  </div>
                ))
              )}
            </div>
         </div>

         {/* 3. Captações */}
         <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3">
               <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                 <Camera className="w-4 h-4 text-emerald-500" /> Captações
               </h4>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
               {loading ? (
                <div className="text-xs text-center text-gray-400 py-6">Carregando...</div>
              ) : captures.length === 0 ? (
                <div className="text-xs text-center text-gray-400 py-8 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhuma captação próxima.</div>
              ) : (
                captures.map(c => (
                  <div key={c.id} className="p-3 border border-gray-100 bg-white rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                     <p className="font-bold text-gray-900 text-sm mb-1">{c.title}</p>
                     <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mt-2">
                        <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded"><CalendarDays className="w-3 h-3"/> {formatDate(c.date)}</span>
                     </div>
                     {c.clientName && (
                        <div className="mt-1.5 text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md inline-block">
                           Cli: {c.clientName}
                        </div>
                     )}
                  </div>
                ))
              )}
            </div>
         </div>

      </div>
    </div>
  )
}
