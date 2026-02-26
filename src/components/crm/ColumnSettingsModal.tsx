import { useState, useEffect } from "react";
import type { CrmColumn } from "./types";
import { createColumn, updateColumn, deleteColumn } from "../../lib/crm";
import { X, Palette, Trash2, Plus, Edit2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: CrmColumn[];
  onColumnsChange: (columns: CrmColumn[]) => void;
}

const COLORS = [
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#64748b", label: "Cinza" },
  { value: "#ec4899", label: "Rosa" },
];

export function ColumnSettingsModal({ isOpen, onClose, columns, onColumnsChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setColor(COLORS[0].value);
    setError(null);
    setSaving(false);
  }

  function handleEdit(col: CrmColumn) {
    setEditingId(col.id);
    setTitle(col.title);
    setColor(col.color || COLORS[0].value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("O nome da coluna é obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        // Atualizar
        await updateColumn(editingId, { title: title.trim(), color });
        onColumnsChange(
          columns.map((c) =>
            c.id === editingId ? { ...c, title: title.trim(), color } : c
          )
        );
      } else {
        // Criar nova - colocar por último
        const nextOrder = columns.length > 0 ? Math.max(...columns.map((c) => c.order_index)) + 1 : 1;
        const newCol = await createColumn({
          title: title.trim(),
          color,
          order_index: nextOrder,
        });
        if (newCol) {
          onColumnsChange([...columns, newCol]);
        }
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar coluna.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(colId: string) {
    if (!confirm("Tem certeza que deseja excluir esta coluna? TODOS os leads nela também serão excluídos.")) return;
    try {
      await deleteColumn(colId);
      onColumnsChange(columns.filter((c) => c.id !== colId));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir coluna.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col z-10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configurar Colunas</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie as etapas do seu funil.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Listagem de Colunas Atuais */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Colunas Existentes</h3>
            {columns.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhuma coluna configurada.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {columns.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 group hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: col.color || COLORS[0].value }}
                      />
                      <span className="text-sm font-medium text-gray-800">{col.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(col)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Formulário de Criação/Edição */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              {editingId ? "Editando Coluna" : "Adicionar Nova Coluna"}
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-blue-600 hover:underline font-normal"
                >
                  Cancelar edição
                </button>
              )}
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Nome da Etapa</label>
              <input
                type="text"
                placeholder="Ex: Reunião Agendada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Palette size={14} /> Cor de Destaque
              </label>
              <div className="flex items-center flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {color === c.value && (
                      <div className="w-3 h-3 bg-white rounded-full opacity-90 shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {saving ? "Salvando..." : editingId ? "Salvar Alterações" : <><Plus size={16} /> Adicionar Coluna</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
