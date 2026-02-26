import { useState, useEffect } from "react";
import type { FinCategory, FinType } from "./types";
import { createCategory, updateCategory, deleteCategory } from "../../lib/financeiro";
import { X, Palette, Trash2, Plus, Edit2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: FinCategory[];
  onCategoriesChange: (cats: FinCategory[]) => void;
  typeFilter?: FinType | 'all';
}

const COLORS = [
  { value: "#10b981", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#64748b", label: "Cinza" },
];

export function CategorySettingsModal({ isOpen, onClose, categories, onCategoriesChange, typeFilter = 'all' }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<FinType>("entrada");
  const [color, setColor] = useState(COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCategories = typeFilter === 'all' 
    ? categories 
    : categories.filter(c => c.type === typeFilter);

  function resetForm() {
    setEditingId(null);
    setName("");
    setType("entrada");
    setColor(COLORS[0].value);
    setError(null);
    setSaving(false);
  }

  function handleEdit(cat: FinCategory) {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || COLORS[0].value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da categoria é obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), type, color });
        onCategoriesChange(
          categories.map((c) =>
            c.id === editingId ? { ...c, name: name.trim(), type, color } : c
          )
        );
      } else {
        const newCat = await createCategory({
          name: name.trim(),
          type,
          color,
        });
        if (newCat) {
          onCategoriesChange([...categories, newCat].sort((a,b) => a.name.localeCompare(b.name)));
        }
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar categoria. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria? As transações ligadas a ela ficarão sem categoria.")) return;
    try {
      await deleteCategory(id);
      onCategoriesChange(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir categoria.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col z-10 overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configurar Categorias</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie os tipos de receitas e despesas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorias Existentes</h3>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhuma categoria encontrada.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 group hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color || COLORS[0].value }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800 leading-tight">{cat.name}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {cat.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              {editingId ? "Editando Categoria" : "Adicionar Nova Categoria"}
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs text-blue-600 hover:underline font-normal">
                  Cancelar edição
                </button>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">Nome</label>
                <input type="text" placeholder="Ex: Fornecedores" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value as FinType)} className="form-input">
                  <option value="entrada">Entrada (Receita)</option>
                  <option value="saida">Saída (Despesa)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Palette size={14} /> Cor de Destaque
              </label>
              <div className="flex items-center flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setColor(c.value)} className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: c.value }} title={c.label}>
                    {color === c.value && <div className="w-3 h-3 bg-white rounded-full opacity-90 shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

            <button type="submit" disabled={saving} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70">
              {saving ? "Salvando..." : editingId ? "Salvar Alterações" : <><Plus size={16} /> Adicionar Categoria</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
