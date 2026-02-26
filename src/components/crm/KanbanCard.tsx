import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CrmLead } from "./types";
import { MoreHorizontal, User, Phone, Mail, Trash2, UserCheck } from "lucide-react";

interface Props {
  task: CrmLead;
  onClick?: () => void;
  onDelete?: () => void;
}

export function KanbanCard({ task, onClick, onDelete }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 border-2 border-[#8b5cf6] bg-white p-4 min-h-[120px] rounded-xl cursor-grabbing flex flex-col gap-2 relative shadow-sm"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-4 rounded-xl cursor-grab hover:ring-2 hover:ring-inset hover:ring-[#8b5cf6] shadow-sm border border-gray-100 flex flex-col gap-3 group transition-all"
    >
      {/* Header: nome + menu */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          <User size={13} className="text-[#8b5cf6] shrink-0" />
          <span className="text-sm font-semibold text-gray-800">
            {task.client_name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Descrição */}
      {task.content && (
        <p className="text-xs text-gray-500 leading-snug">
          {task.content}
        </p>
      )}

      {/* Contato & Email */}
      <div className="flex flex-col gap-1.5">
        {task.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone size={12} className="text-gray-400 shrink-0" />
            <span>{task.phone}</span>
          </div>
        )}
        {task.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{task.email}</span>
          </div>
        )}
      </div>

      {/* Footer: valor + responsável */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          R$ {task.value.toLocaleString('pt-BR')}
        </span>
        {task.responsible_name && (
          <div className="flex items-center gap-1 text-xs text-gray-400" title={`Responsável: ${task.responsible_name}`}>
            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
              <UserCheck size={11} className="text-purple-600" />
            </div>
            <span className="max-w-[80px] truncate font-medium text-gray-500">{task.responsible_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
