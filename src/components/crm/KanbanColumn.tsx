import { useMemo } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CrmColumn, CrmLead } from "./types";
import { KanbanCard } from "./KanbanCard";
import { Plus, MoreHorizontal } from "lucide-react";

interface Props {
  column: CrmColumn;
  tasks: CrmLead[];
  onAdd: () => void;
  onCardClick: (lead: CrmLead) => void;
  onDelete: (leadId: string) => void;
}

export function KanbanColumn({ column, tasks, onAdd, onCardClick, onDelete }: Props) {
  const taskIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const columnColor = column.color || "#8b5cf6";

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, borderColor: columnColor }}
        className="bg-gray-50/50 opacity-40 border-2 border-dashed w-[350px] min-w-[350px] rounded-2xl flex flex-col"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 flex flex-col rounded-2xl w-[350px] min-w-[350px] shadow-sm border border-gray-100"
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        style={{ borderTopColor: columnColor }}
        className="flex items-center justify-between p-4 bg-white rounded-t-2xl border-t-4 border-b border-b-gray-100 cursor-grab"
      >
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: columnColor }} className="w-2.5 h-2.5 rounded-full" />
          <h3 className="font-bold text-gray-800 text-[15px]">{column.title}</h3>
          <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-700 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Column Body - Droppable Area */}
      <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
        <SortableContext items={taskIds}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Column Footer */}
      <div className="p-3 pt-0">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#8b5cf6] hover:bg-purple-50 w-full p-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={16} /> Adicionar Oportunidade
        </button>
      </div>
    </div>
  );
}
