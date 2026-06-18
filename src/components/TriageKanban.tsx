import { For, createSignal, Show } from "solid-js";
import { store, updateTask, activeClassId, selectedTaskId, setSelectedTaskId } from "../store";
import ColumnManagerModal from "./ColumnManagerModal";
import { IconSettings } from "./icons";
import { TabHeader } from "./TaskList";

export default function TriageKanban() {
  const [modalOpen, setModalOpen] = createSignal(false);

  const getFilteredTasks = () => {
    const classId = activeClassId();
    if (classId === "all") return store.tasks;
    if (classId === "today") {
      return store.tasks.filter(
        (t) => t.due?.toLowerCase().includes("today") || t.due === "Yesterday"
      );
    }
    if (classId === "tomorrow") {
      return store.tasks.filter((t) => t.due?.toLowerCase().includes("tomorrow"));
    }
    if (classId === "week") {
      return store.tasks.filter((t) => t.due);
    }
    if (classId === "inbox") {
      const classIds = store.classes.map((c) => c.id);
      return store.tasks.filter((t) => !classIds.includes(t.listId));
    }
    return store.tasks.filter((t) => t.listId === classId);
  };

  const getColumnTasks = (colUrgent: boolean, colImportant: boolean) => {
    return getFilteredTasks().filter(
      (t) => !t.done && t.urgent === colUrgent && t.important === colImportant
    );
  };

  // Drag and drop logic
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer?.setData("text/plain", taskId);
  };

  const handleDrop = (e: DragEvent, columnUrgent: boolean, columnImportant: boolean) => {
    e.preventDefault();
    const taskId = e.dataTransfer?.getData("text/plain");
    if (taskId) {
      updateTask(taskId, { urgent: columnUrgent, important: columnImportant });
    }
  };

  return (
    <div class="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-border px-6">
        <div class="flex items-center gap-4">
          <h1 class="text-[17px] font-semibold text-tt-text">Triage Board</h1>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            class="flex items-center gap-1.5 rounded-lg border border-tt-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-tt-text hover:bg-black/5 transition shadow-sm"
          >
            <IconSettings size={15} class="text-tt-sub" />
            <span>Manage Columns</span>
          </button>
          <TabHeader />
        </div>
      </header>

      {/* Board content */}
      <div class="flex flex-1 gap-4 overflow-x-auto p-6 bg-slate-50/50">
        <For each={store.columns}>
          {(col) => (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.urgent, col.important)}
              class="flex w-64 flex-shrink-0 flex-col rounded-xl border border-tt-border bg-white shadow-sm overflow-hidden h-full max-h-[calc(100vh-140px)]"
            >
              {/* Column header */}
              <div class="border-b border-tt-border px-4 py-3 bg-white flex items-center justify-between">
                <h3 class="font-semibold text-tt-text text-[13px] truncate">{col.name}</h3>
                <span class="text-[11px] font-bold text-tt-muted bg-slate-100 rounded-full px-2 py-0.5">
                  {getColumnTasks(col.urgent, col.important).length}
                </span>
              </div>
              
              {/* Column list */}
              <div class="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/30">
                <For each={getColumnTasks(col.urgent, col.important)}>
                  {(task) => (
                    <div
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      class={`cursor-grab active:cursor-grabbing rounded-lg border p-3 shadow-sm hover:shadow-md transition bg-white ${
                        selectedTaskId() === task.id ? "border-tt-blue bg-blue-50/10" : "border-tt-border"
                      }`}
                    >
                      <div class="font-medium text-slate-700 text-[12.5px] leading-snug">{task.title}</div>
                      <Show when={task.due}>
                        <div class="mt-2 text-[11px] text-tt-muted">{task.due}</div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={modalOpen()}>
        <ColumnManagerModal onClose={() => setModalOpen(false)} />
      </Show>
    </div>
  );
}
