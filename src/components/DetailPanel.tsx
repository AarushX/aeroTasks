import { For, Show, createSignal } from "solid-js";
import { store, updateTask, deleteTask, selectedTaskId } from "../store";
import {
  IconCalendar,
  IconPlus,
} from "./icons";

export default function DetailPanel() {
  const task = () => store.tasks.find((t) => t.id === selectedTaskId());
  const taskList = () => store.classes.find((c) => c.id === task()?.listId);

  const [addingSubtask, setAddingSubtask] = createSignal(false);
  const [subtaskTitle, setSubtaskTitle] = createSignal("");

  const toggleTaskDone = () => {
    const t = task();
    if (t) {
      updateTask(t.id, {
        done: !t.done,
        completedAt: !t.done ? new Date().toISOString() : undefined,
      });
    }
  };

  const handleToggleSubtask = (subId: string) => {
    const t = task();
    if (!t) return;
    const updatedSubtasks =
      t.subtasks?.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) || [];
    updateTask(t.id, { subtasks: updatedSubtasks });
  };

  const commitSubtask = () => {
    const t = task();
    const title = subtaskTitle().trim();
    if (!t || !title) return;
    const newSub = { id: "s_" + Date.now(), title, done: false };
    updateTask(t.id, { subtasks: [...(t.subtasks || []), newSub] });
    setSubtaskTitle("");
    setAddingSubtask(false);
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commitSubtask(); }
    if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle(""); }
  };

  const handleDelete = () => {
    const t = task();
    if (t && confirm("Are you sure you want to delete this task?")) {
      deleteTask(t.id);
    }
  };

  return (
    <section class="flex h-full w-[368px] flex-col border-l border-tt-soft bg-tt-surface flex-shrink-0 shadow-[-10px_0_36px_-26px_rgba(16,24,40,0.22)]">
      <Show
        when={task()}
        fallback={
          <div class="flex flex-1 items-center justify-center px-8 text-center text-[12.5px] text-tt-faint select-none">
            Select a task to see its details
          </div>
        }
      >
        {(t) => (
          <>
            {/* Top bar: workspace + actions */}
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-tt-line bg-white/70 backdrop-blur-sm select-none">
              <span class="flex items-center gap-2 rounded-full bg-tt-line/70 pl-2 pr-2.5 py-1 text-[11.5px] font-medium text-tt-sub">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  style={{ "background-color": taskList()?.color || "#cbd5e1" }}
                />
                {taskList()?.name || "Unassigned"}
              </span>
              <button
                type="button"
                onClick={handleDelete}
                class="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>

            {/* Title */}
            <div class="flex items-start gap-2.5 px-5 pt-4 bg-white pb-3">
              <button
                type="button"
                onClick={toggleTaskDone}
                class={`mt-1 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
                  t().done
                    ? "border-tt-faint bg-tt-faint text-white"
                    : t().urgent && t().important
                    ? "border-red-500 text-red-500 bg-red-50"
                    : t().important
                    ? "border-amber-500 text-amber-500 bg-amber-50"
                    : t().urgent
                    ? "border-blue-500 text-blue-500 bg-blue-50"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                <Show when={t().done}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m5 12 4.5 4.5L19 7" />
                  </svg>
                </Show>
              </button>

              <input
                type="text"
                value={t().title}
                onInput={(e) => updateTask(t().id, { title: e.currentTarget.value })}
                class="w-full bg-transparent font-semibold leading-snug text-tt-text outline-none text-[15px] border-b border-transparent focus:border-tt-blue/30 pb-0.5 px-0.5"
              />
            </div>

            {/* Priority and due date modifiers */}
            <div class="flex flex-wrap gap-2 px-5 py-3.5 bg-white border-b border-tt-line select-none">
              <button
                type="button"
                onClick={() => updateTask(t().id, { urgent: !t().urgent })}
                class={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-bold transition-all ${
                  t().urgent
                    ? "bg-blue-500 text-white shadow-card"
                    : "bg-tt-line/70 text-slate-500 hover:bg-tt-line"
                }`}
              >
                ⚡ Urgent
              </button>

              <button
                type="button"
                onClick={() => updateTask(t().id, { important: !t().important })}
                class={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-bold transition-all ${
                  t().important
                    ? "bg-amber-500 text-white shadow-card"
                    : "bg-tt-line/70 text-slate-500 hover:bg-tt-line"
                }`}
              >
                ⭐ Important
              </button>

              <Show when={t().due}>
                <div class="flex h-8 items-center gap-1.5 rounded-full px-3 text-[11.5px] text-tt-blue bg-tt-bluefaint font-semibold">
                  <IconCalendar size={13} />
                  <span>{t().due}</span>
                </div>
              </Show>
            </div>

            {/* Note */}
            <div class="px-5 py-4 bg-white border-b border-tt-line">
              <label class="block text-[11px] font-semibold text-tt-faint uppercase tracking-wider mb-2 select-none">Notes</label>
              <textarea
                value={t().note || ""}
                onInput={(e) => updateTask(t().id, { note: e.currentTarget.value })}
                placeholder="Click to add details or notes..."
                class="w-full h-24 rounded-xl bg-tt-line/40 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600 outline-none resize-none ring-1 ring-transparent focus:ring-tt-blue/30 focus:bg-white transition placeholder:text-tt-faint font-sans"
              />
            </div>

            {/* Subtasks */}
            <div class="flex-1 overflow-y-auto px-5 py-4 bg-white">
              <label class="block text-[11px] font-semibold text-tt-faint uppercase tracking-wider mb-2.5 select-none">Subtasks</label>
              <div class="space-y-1">
                <For each={t().subtasks}>
                  {(sub) => (
                    <div class="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-tt-line/60 transition-colors">
                      <div class="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(sub.id)}
                          class={`flex h-[15px] w-[15px] flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition ${
                            sub.done ? "border-tt-faint bg-tt-faint text-white" : "border-slate-300"
                          }`}
                        >
                          <Show when={sub.done}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                              <path d="m5 12 4.5 4.5L19 7" />
                            </svg>
                          </Show>
                        </button>
                        <span class={`text-[12.5px] truncate ${sub.done ? "text-tt-faint line-through" : "text-tt-text font-medium"}`}>
                          {sub.title}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              {/* Inline add-subtask input */}
              <Show
                when={addingSubtask()}
                fallback={
                  <button
                    type="button"
                    onClick={() => setAddingSubtask(true)}
                    class="mt-2 flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] text-tt-blue font-semibold hover:bg-blue-50 rounded-lg transition"
                  >
                    <IconPlus size={14} />
                    <span>Add subtask</span>
                  </button>
                }
              >
                <div class="mt-2 flex items-center gap-1.5 rounded-xl ring-1 ring-tt-blue/40 px-2.5 py-1.5 bg-white shadow-card">
                  <input
                    autofocus
                    type="text"
                    placeholder="Subtask title…"
                    value={subtaskTitle()}
                    onInput={(e) => setSubtaskTitle(e.currentTarget.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    class="flex-1 bg-transparent text-[12.5px] text-tt-text outline-none placeholder:text-tt-faint"
                  />
                  <button
                    type="button"
                    onClick={commitSubtask}
                    class="text-[11px] font-bold text-tt-blue hover:text-tt-bluehover px-1"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSubtask(false); setSubtaskTitle(""); }}
                    class="text-[11px] font-bold text-tt-muted hover:text-tt-text px-1"
                  >
                    ✕
                  </button>
                </div>
              </Show>
            </div>

            {/* Footer info */}
            <div class="flex items-center justify-between border-t border-tt-line bg-tt-surface px-5 py-3 select-none text-tt-faint text-[11px]">
              <span>Triage Pipeline</span>
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-tt-green" />
                Saved locally
              </span>
            </div>
          </>
        )}
      </Show>
    </section>
  );
}
