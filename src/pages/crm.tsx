import { useState, useEffect } from 'react';
import { KanbanBoard } from '../components/crm/KanbanBoard';
import { ColumnSettingsModal } from '../components/crm/ColumnSettingsModal';
import { fetchColumns, fetchLeads } from '../lib/crm';
import type { CrmColumn, CrmLead } from '../components/crm/types';
import { Settings } from 'lucide-react';
import { MonthPicker } from '../components/ui/MonthPicker';

export default function CrmPage() {
  const [columns, setColumns] = useState<CrmColumn[]>([]);
  const [tasks, setTasks] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Date Filter State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Calcular início e fim do mês atual
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const cols = await fetchColumns();
        const leads = await fetchLeads(startOfMonth.toISOString(), endOfMonth.toISOString());
        
        setColumns(cols);
        setTasks(leads);
      } catch (err) {
        console.error("Erro ao carregar CRM:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  return (
    <div className="flex flex-col h-full w-full gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900 leading-none">CRM</h2>
          <p className="text-gray-500 mt-2 text-[15px]">Acompanhe as suas oportunidades de venda no funil</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mês - Filtro */}
          <MonthPicker currentDate={currentDate} onChange={setCurrentDate} />

          {/* Settings / Configurar Colunas */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Configurar Funil
          </button>
        </div>
      </header>

      <div className="flex-1 w-full overflow-hidden">
        <KanbanBoard 
          columns={columns}
          setColumns={setColumns}
          tasks={tasks}
          setTasks={setTasks}
          isLoading={isLoading}
        />
      </div>

      <ColumnSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        columns={columns}
        onColumnsChange={setColumns}
      />
    </div>
  )
}
