import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthPicker({ 
  currentDate, 
  onChange 
}: { 
  currentDate: Date; 
  onChange: (d: Date) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const displayMonthYear = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedDate = displayMonthYear.charAt(0).toUpperCase() + displayMonthYear.slice(1);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-[#8b5cf6]"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="capitalize">{capitalizedDate}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => onChange(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700">{currentDate.getFullYear()}</span>
            <button 
              onClick={() => onChange(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => {
              const isActive = currentDate.getMonth() === i;
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChange(new Date(currentDate.getFullYear(), i, 1));
                    setIsOpen(false);
                  }}
                  className={`py-2 text-sm rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#8b5cf6] text-white font-semibold shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
