import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRegistroHoje, 
  registrarEntrada, 
  registrarSaida, 
  getHistoricoPonto,
  type RegistroPonto 
} from '../lib/ponto';
import toast from 'react-hot-toast';
import { Clock, Plus, Search, ChevronDown, LogOut, CheckCircle2 } from 'lucide-react';

export default function PontoPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'renata@startdigital.com' || user?.user_metadata?.role === 'admin';
  
  const [registroHoje, setRegistroHoje] = useState<RegistroPonto | null>(null);
  const [historico, setHistorico] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Search and Sort
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'recentes' | 'nome'>('recentes');

  // Relógio
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hoje, hist] = await Promise.all([
        getRegistroHoje(),
        getHistoricoPonto(isAdmin)
      ]);
      setRegistroHoje(hoje);
      setHistorico(hist);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do ponto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  const handleEntrada = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const novoRegistro = await registrarEntrada();
      setRegistroHoje(novoRegistro);
      setHistorico(prev => [novoRegistro, ...prev]);
      toast.success('Entrada registrada com sucesso! Bom trabalho!');
    } catch (error: any) {
      toast.error('Erro ao registrar entrada: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaida = async () => {
    if (!registroHoje) return;
    if (!descricao.trim()) {
      toast.error('Por favor, informe a descrição das atividades.');
      return;
    }

    try {
      setSaving(true);
      const registroAtualizado = await registrarSaida(registroHoje.id, descricao);
      setRegistroHoje(registroAtualizado);
      setHistorico(prev => prev.map(r => r.id === registroAtualizado.id ? registroAtualizado : r));
      toast.success('Saída registrada com sucesso! Bom descanso!');
      setIsModalOpen(false);
      setDescricao('');
    } catch (error: any) {
      toast.error('Erro ao registrar saída: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBaterPontoClick = () => {
    if (!registroHoje) {
      // Registrar entrada
      if (confirm('Deseja registrar sua ENTRADA agora?')) {
        handleEntrada();
      }
    } else if (!registroHoje.hora_saida) {
      // Registrar saída - abre modal para colocar a descrição
      setIsModalOpen(true);
    } else {
      toast('Você já concluiu sua jornada hoje!', { icon: '👏' });
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5); 
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredData = useMemo(() => {
    let result = [...historico];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        (r.user_name || '').toLowerCase().includes(q) ||
        (r.descricao_atividades || '').toLowerCase().includes(q)
      );
    }

    if (sortKey === 'nome') {
      result.sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''));
    } else if (sortKey === 'recentes') {
      result.sort((a, b) => {
        const dateA = new Date(`${a.data_registro}T${a.hora_entrada}`).getTime();
        const dateB = new Date(`${b.data_registro}T${b.hora_entrada}`).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [historico, search, sortKey]);

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900 leading-none flex items-center gap-3">
            <Clock className="w-7 h-7 text-purple-500" />
            Controle de Ponto
          </h2>
          <p className="text-gray-500 mt-2 text-[15px]">
            Acompanhe o registro de horas da equipe
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-white/80 border border-purple-200 px-4 py-2 rounded-xl text-purple-700 font-mono text-xl font-bold tracking-wider shadow-sm mr-2 flex items-center justify-center min-w-[120px]">
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>
          
          <button
            onClick={handleBaterPontoClick}
            disabled={saving || (!!registroHoje?.hora_saida)}
            className={`px-5 py-2.5 rounded-[12px] font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm tracking-wide text-white ${
              registroHoje?.hora_saida 
                ? 'bg-emerald-500 cursor-default shadow-none hover:bg-emerald-500' // Já bateu saída
                : registroHoje 
                  ? 'bg-gray-800 hover:bg-gray-700' // Já tem entrada, vai bater saída
                  : 'bg-[#8b5cf6] hover:bg-purple-600' // Bater entrada (Novo)
            } disabled:opacity-50`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : registroHoje?.hora_saida ? (
              <><CheckCircle2 className="w-4 h-4" /> Jornada Concluída</>
            ) : registroHoje ? (
              <><LogOut className="w-4 h-4" /> Registrar Saída</>
            ) : (
              <><Plus className="w-4 h-4" /> Registrar Entrada</>
            )}
          </button>
        </div>
      </header>

      {/* ── Filtros ── */}
      <div className="bg-gray-50/70 p-1.5 rounded-[14px] border border-gray-100 flex flex-col sm:flex-row items-center gap-2 mt-2">
        <div className="flex bg-white rounded-[10px] border border-gray-200 flex-1 px-3 py-2.5 items-center focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all w-full shadow-sm">
          <Search className="w-[18px] h-[18px] text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por usuário ou atividade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-2 w-full outline-none text-[14px] text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as 'recentes' | 'nome')}
            className="bg-white rounded-[10px] border border-gray-200 px-4 py-2.5 text-[14px] text-gray-700 font-medium min-w-[200px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-8"
          >
            <option value="recentes">Mais Recentes</option>
            <option value="nome">Nome (A-Z)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-500 whitespace-nowrap">Data</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Usuário</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-center">Entrada</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-center">Saída</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Atividades Realizadas</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Carregando registros...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-gray-500 font-medium htv-text-sm">Nenhum registro encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isHoje = row.id === registroHoje?.id;
                  return (
                    <tr key={row.id} className={`group hover:bg-gray-50/60 transition-colors ${isHoje ? 'bg-purple-50/20' : ''}`}>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-800">
                        {formatDate(row.data_registro)}
                        {isHoje && (
                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            Hoje
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-purple-700 font-bold text-[10px] shrink-0">
                            {(row.user_name || 'US').slice(0, 2).toUpperCase()}
                          </div>
                          {row.user_name || 'Desconhecido'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-mono text-gray-600">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 block w-max mx-auto shadow-sm">
                          {formatTime(row.hora_entrada)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono">
                         <span className={`px-2.5 py-1 rounded-md border block w-max mx-auto shadow-sm ${row.hora_saida ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-transparent text-gray-400 border-dashed border-gray-300'}`}>
                           {formatTime(row.hora_saida)}
                         </span>
                      </td>
                      <td className="px-5 py-4">
                        {row.descricao_atividades ? (
                          <p className="text-gray-600 line-clamp-2 title={row.descricao_atividades}">
                            {row.descricao_atividades}
                          </p>
                        ) : (
                          <span className="text-gray-400 text-sm italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {row.hora_saida ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Concluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            Em andamento
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Saída ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-gray-600" />
                Registrar Saída
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resumo das atividades do dia <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Mencione projetos, tarefas ou clientes que você atendeu hoje..."
                  className="w-full h-32 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-gray-50/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaida} 
                disabled={saving || !descricao.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors disabled:opacity-60 shadow-sm flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
