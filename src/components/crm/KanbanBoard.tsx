import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { CrmColumn, CrmLead } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { LeadModal } from "./LeadModal";
import { updateLeadOrders, updateLead, deleteLead } from "../../lib/crm";

interface KanbanProps {
  columns: CrmColumn[];
  setColumns: React.Dispatch<React.SetStateAction<CrmColumn[]>>;
  tasks: CrmLead[];
  setTasks: React.Dispatch<React.SetStateAction<CrmLead[]>>;
  isLoading: boolean;
}

export function KanbanBoard({ columns, setColumns, tasks, setTasks, isLoading }: KanbanProps) {
  const [activeColumn, setActiveColumn] = useState<CrmColumn | null>(null);
  const [activeTask, setActiveTask] = useState<CrmLead | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<CrmColumn | null>(null);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);

  function openAddModal(column: CrmColumn) {
    setEditingLead(null);
    setModalColumn(column);
    setModalOpen(true);
  }

  function openEditModal(lead: CrmLead) {
    const col = columns.find((c) => c.id === lead.column_id) ?? null;
    setEditingLead(lead);
    setModalColumn(col);
    setModalOpen(true);
  }

  function handleLeadSave(saved: CrmLead) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  function handleDeleteLead(leadId: string) {
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== leadId));
    deleteLead(leadId).catch((err) => {
      console.error('Failed to delete lead:', err);
      // Optionally reload board on failure
    });
  }

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return <div className="flex p-8 text-gray-500 w-full h-full justify-center">Carregando CRM...</div>;
  }

  return (
    <>
      <div className="flex w-full h-full overflow-x-auto overflow-y-hidden gap-4 pb-4 px-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={tasks.filter((task) => task.column_id === col.id)}
                  onAdd={() => openAddModal(col)}
                  onCardClick={openEditModal}
                  onDelete={handleDeleteLead}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeColumn && (
              <KanbanColumn
                column={activeColumn}
                tasks={tasks.filter((task) => task.column_id === activeColumn.id)}
                onAdd={() => {}}
                onCardClick={() => {}}
                onDelete={() => {}}
              />
            )}
            {activeTask && <KanbanCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>

      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        column={modalColumn}
        lead={editingLead}
        onSave={handleLeadSave}
        onDelete={handleDeleteLead}
      />
    </>
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    // We do not persist column sorting for now via Supabase in this hook to keep it simple,
    // but we allow visual reordering 
    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
      const overColumnIndex = columns.findIndex((col) => col.id === overId);
      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        let newTasks = [...tasks];
        
        if (newTasks[activeIndex].column_id != newTasks[overIndex].column_id) {
          // Different columns
          newTasks[activeIndex].column_id = newTasks[overIndex].column_id;
          newTasks = arrayMove(newTasks, activeIndex, overIndex - 1);
        } else {
          // Same column
          newTasks = arrayMove(newTasks, activeIndex, overIndex);
        }

        // Re-index visually and send sync to DB
        newTasks = newTasks.map((t, idx) => ({ ...t, order_index: idx }));
        
        // Asynchronous silent fetch to DB
        updateLeadOrders(newTasks.filter(t => t.column_id === newTasks[overIndex].column_id).map(t => ({ id: t.id, order_index: t.order_index })));
        if (tasks[activeIndex].column_id != tasks[overIndex].column_id) {
            updateLead(String(activeId), { column_id: String(newTasks[overIndex].column_id) }); 
        }

        return newTasks;
      });
    }

    const isOverAColumnDroppable = isOverAColumn;

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumnDroppable) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        
        const newTasks = [...tasks];
        newTasks[activeIndex].column_id = String(overId);
        
        const rearranged = arrayMove(newTasks, activeIndex, activeIndex);
        
        updateLead(String(activeId), { column_id: String(overId) });
        return rearranged;
      });
    }
  }
}
