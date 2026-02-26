import { useState, useEffect } from "react";
import type { FinCategory, FinTransaction, FinType } from "./types";
import { createTransaction, updateTransaction } from "../../lib/financeiro";
import { X, DollarSign, FileText, User, CreditCard, Tag, Calendar, Repeat } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: FinCategory[];
  transaction?: FinTransaction | null;
  defaultType?: FinType;
  onSave: (transaction: FinTransaction) => void;
}

export function TransactionModal({ isOpen, onClose, categories, transaction, defaultType = 'entrada', onSave }: Props) {
  const isEdit = !!transaction;

  const [type, setType] = useState<FinType>(defaultType);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clientName, setClientName] = useState("");
  const [pgtoMethod, setPgtoMethod] = useState("");
  const [status, setStatus] = useState("Pago");
  const [isRecurrent, setIsRecurrent] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setDescription(transaction.description);
      setValue(transaction.value.toString());
      setCategoryId(transaction.category_id || "");
      setClientName(transaction.client_name || "");
      setPgtoMethod(transaction.pgto_method || "");
      setStatus(transaction.status);
      setIsRecurrent(transaction.is_recurrent);
    } else {
      resetForm(defaultType);
    }
    setError(null);
  }, [transaction, isOpen, defaultType]);

  if (!isOpen) return null;

  function resetForm(forcedType: FinType) {
    setType(forcedType);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription("");
    setValue("");
    setCategoryId("");
    setClientName("");
    setPgtoMethod("");
    setStatus(forcedType === "entrada" ? "Recebido" : "Pago");
    setIsRecurrent(false);
  }

  const availableCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !value || isNaN(parseFloat(value))) {
      setError("Preencha descrição e valor corretamente.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      type,
      date,
      description: description.trim(),
      value: parseFloat(value),
      category_id: categoryId || undefined,
      client_name: type === 'entrada' ? clientName.trim() || undefined : undefined,
      pgto_method: type === 'saida' ? pgtoMethod.trim() || undefined : undefined,
      status,
      is_recurrent: isRecurrent
    };

    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, payload);
        onSave({ ...transaction, ...payload });
      } else {
        const newTx = await createTransaction(payload);
        if (newTx) onSave(newTx);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar a transação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-default" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? "Editar Transação" : type === "entrada" ? "Nova Receita (Entrada)" : "Nova Despesa (Saída)"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            
            {/* Type selector if creating new */}
            {!isEdit && (
              <div className="flex items-center bg-gray-100 p-1 rounded-xl mx-auto w-max mb-2">
                <button
                  type="button"
                  onClick={() => { setType("entrada"); setStatus("Recebido"); setCategoryId(""); }}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'entrada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => { setType("saida"); setStatus("Pago"); setCategoryId(""); }}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'saida' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Saída
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Descrição" icon={<FileText size={16} />} required>
                <input type="text" placeholder="Do que se trata?" value={description} onChange={e => setDescription(e.target.value)} className="form-input" />
              </FormField>
              <FormField label="Valor (R$)" icon={<DollarSign size={16} />} required>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} className="form-input" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Data" icon={<Calendar size={16} />} required>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
              </FormField>
              <FormField label="Categoria" icon={<Tag size={16} />}>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="form-input">
                  <option value="">Selecione a categoria...</option>
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Status" required>
                <select value={status} onChange={e => setStatus(e.target.value)} className="form-input font-medium" style={{ color: status.includes('Atraso') ? '#ef4444' : (status === 'Pago' || status === 'Recebido') ? '#10b981' : '#f59e0b' }}>
                  {type === 'entrada' ? (
                    <>
                      <option value="Recebido">Recebido</option>
                      <option value="Pendente">A Receber (Pendente)</option>
                      <option value="Em Atraso">Em Atraso</option>
                    </>
                  ) : (
                    <>
                      <option value="Pago">Pago</option>
                      <option value="A Pagar">A Pagar (Pendente)</option>
                      <option value="Em Atraso">Em Atraso</option>
                    </>
                  )}
                </select>
              </FormField>
              
              {type === 'entrada' ? (
                <FormField label="Cliente" icon={<User size={16} />}>
                  <input type="text" placeholder="Nome do Cliente (opcional)" value={clientName} onChange={e => setClientName(e.target.value)} className="form-input" />
                </FormField>
              ) : (
                <FormField label="Forma de Pagto." icon={<CreditCard size={16} />}>
                  <input type="text" placeholder="Ex: Cartão, Pix, Boleto" value={pgtoMethod} onChange={e => setPgtoMethod(e.target.value)} className="form-input" />
                </FormField>
              )}
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer w-max group">
              <input type="checkbox" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6] w-4 h-4 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 group-hover:text-gray-900 transition-colors">
                <Repeat size={14} className={isRecurrent ? "text-[#8b5cf6]" : "text-gray-400"} />
                Transação Recorrente (Mensal)
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 z-10">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 ${type === 'entrada' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : type === 'entrada' ? "Criar Entrada" : "Criar Saída"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, icon, required, children }: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
