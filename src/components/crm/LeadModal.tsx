import { useState, useEffect } from "react";
import type { CrmLead, CrmColumn } from "./types";
import { updateLead } from "../../lib/crm";
import { supabase } from "../../lib/supabase";
import { X, User, Mail, Phone, Tag, FileText, DollarSign, Trash2, UserCheck } from "lucide-react";

const SOURCE_OPTIONS = [
  "Direto",
  "Instagram",
  "Facebook",
  "Google Ads",
  "LinkedIn",
  "Indicação",
  "WhatsApp",
  "Site",
  "Outro",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  column: CrmColumn | null;
  lead?: CrmLead | null;
  onSave: (lead: CrmLead) => void;
  onDelete?: (leadId: string) => void;
}

type FormState = {
  client_name: string;
  content: string;
  value: string;
  email: string;
  phone: string;
  source: string;
  meeting_at: string;
  notes: string;
  responsible_name: string;
};

function toInputDateTimeLocal(isoString?: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function LeadModal({ isOpen, onClose, column, lead, onSave, onDelete }: Props) {
  const isEdit = !!lead;

  const [form, setForm] = useState<FormState>({
    client_name: "",
    content: "",
    value: "",
    email: "",
    phone: "",
    source: "Direto",
    meeting_at: "",
    notes: "",
    responsible_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Team members para o responsável
  const [teamMembers, setTeamMembers] = useState<{name: string, id: string}[]>([]);

  useEffect(() => {
    supabase.from('usuarios')
      .select('*')
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (data) {
          setTeamMembers(data.map((u: any) => ({
            id: u.id,
            name: u.nome || u.email || 'Usuário'
          })));
        } else if (error) {
          console.error("Erro ao carregar equipe:", error);
        }
      });
  }, []);

  useEffect(() => {
    if (lead) {
      setForm({
        client_name: lead.client_name ?? "",
        content: lead.content ?? "",
        value: lead.value?.toString() ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        source: lead.source ?? "Direto",
        meeting_at: toInputDateTimeLocal(lead.meeting_at),
        notes: lead.notes ?? "",
        responsible_name: lead.responsible_name ?? "",
      });
    } else {
      setForm({
        client_name: "",
        content: "",
        value: "",
        email: "",
        phone: "",
        source: "Direto",
        meeting_at: "",
        notes: "",
        responsible_name: "",
      });
    }
    setError(null);
  }, [lead, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_name.trim()) {
      setError("O nome do contato é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      client_name: form.client_name.trim(),
      content: form.content.trim(),
      value: parseFloat(form.value) || 0,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      source: form.source || "Direto",
      meeting_at: form.meeting_at ? new Date(form.meeting_at).toISOString() : undefined,
      notes: form.notes.trim() || undefined,
      responsible_name: form.responsible_name.trim() || undefined,
    };

    try {
      if (isEdit && lead) {
        await updateLead(lead.id, payload);
        onSave({ ...lead, ...payload });
      } else {
        if (!column) return;
        const { createLead: create } = await import("../../lib/crm");
        const newLead = await create({
          ...payload,
          column_id: column.id,
          order_index: 9999,
        });
        if (newLead) onSave(newLead);
      }
      onClose();
    } catch {
      setError("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? "Editar Oportunidade" : "Nova Oportunidade"}
            </h2>
            {column && !isEdit && (
              <p className="text-sm text-gray-500 mt-0.5">
                Adicionando em: <span className="font-medium text-gray-700">{column.title}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* Nome do Contato + Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nome do Contato" icon={<User size={16} />} required>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={form.client_name}
                  onChange={(e) => handleChange("client_name", e.target.value)}
                  className="form-input"
                />
              </FormField>
              <FormField label="Valor (R$)" icon={<DollarSign size={16} />}>
                <input
                  type="number"
                  placeholder="0,00"
                  min={0}
                  step="0.01"
                  value={form.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  className="form-input"
                />
              </FormField>
            </div>

            {/* Descrição */}
            <FormField label="Descrição da Oportunidade" icon={<FileText size={16} />}>
              <input
                type="text"
                placeholder="Ex: Desenvolvimento de site institucional"
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                className="form-input"
              />
            </FormField>

            {/* Email + Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="E-mail" icon={<Mail size={16} />}>
                <input
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="form-input"
                />
              </FormField>
              <FormField label="Telefone / WhatsApp" icon={<Phone size={16} />}>
                <input
                  type="tel"
                  placeholder="(99) 99999-9999"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="form-input"
                />
              </FormField>
            </div>

            {/* Fonte + Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Fonte do Lead" icon={<Tag size={16} />}>
                <select
                  value={form.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                  className="form-input"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Responsável" icon={<UserCheck size={16} />}>
                <select
                  value={form.responsible_name}
                  onChange={(e) => handleChange("responsible_name", e.target.value)}
                  className="form-input"
                >
                  <option value="">— Sem responsável —</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Observações */}
            <FormField label="Observações" icon={<FileText size={16} />}>
              <textarea
                placeholder="Anote aqui contexto importante sobre esta oportunidade..."
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
                className="form-input resize-none"
              />
            </FormField>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            {/* Botão deletar — só no modo edição */}
            <div>
              {isEdit && lead && (
                <button
                  type="button"
                  onClick={() => { onDelete?.(lead.id); onClose(); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-semibold bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEdit ? "Salvar Alterações" : "Criar Oportunidade"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
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
