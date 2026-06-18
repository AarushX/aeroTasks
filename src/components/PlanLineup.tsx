import { For, Show } from "solid-js";
import { store, toggleLineup, activeClassId } from "../store";
import { TabHeader } from "./TaskList";

export default function PlanLineup() {
  const getFilteredTasks = () => {
    const classId = activeClassId();
    if (classId === "all") return store.tasks.filter((t) => !t.done);
    if (classId === "today") {
      return store.tasks.filter(
        (t) => !t.done && (t.due?.toLowerCase().includes("today") || t.due === "Yesterday")
      );
    }
    if (classId === "tomorrow") {
      return store.tasks.filter((t) => !t.done && t.due?.toLowerCase().includes("tomorrow"));
    }
    if (classId === "week") {
      return store.tasks.filter((t) => !t.done && t.due);
    }
    if (classId === "inbox") {
      const classIds = store.classes.map((c) => c.id);
      return store.tasks.filter((t) => !t.done && !classIds.includes(t.listId));
    }
    return store.tasks.filter((t) => !t.done && t.listId === classId);
  };

  const importantTasks = () => getFilteredTasks().filter((t) => t.important);
  const otherTasks = () => getFilteredTasks().filter((t) => !t.important);

  const getLineupTasks = () => {
    return store.lineup
      .map((id) => store.tasks.find((t) => t.id === id))
      .filter((t) => t && !t.done) as typeof store.tasks;
  };

  return (
    <div class="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-border px-6">
        <h1 class="text-[17px] font-semibold text-tt-text">Daily Lineup Planner</h1>
        <TabHeader />
      </header>

      {/* Planning area */}
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {/* Slots indicator */}
        <div class="rounded-xl border border-dashed border-tt-border p-5 bg-white shadow-sm">
          <h2 class="text-xs uppercase font-bold text-tt-faint tracking-wider mb-3 select-none">
            Active Focus Lineup (Max 3)
          </h2>
          <div class="grid grid-cols-3 gap-4">
            <For each={[0, 1, 2]}>
              {(idx) => {
                const task = getLineupTasks()[idx];
                return (
                  <Show
                    when={task}
                    fallback={
                      <div class="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-[12px] text-slate-400 select-none">
                        Empty Slot {idx + 1}
                      </div>
                    }
                  >
                    <div class="relative flex h-20 flex-col justify-between rounded-lg border border-tt-blue bg-blue-50/30 p-3 shadow-sm">
                      <div class="font-semibold text-tt-text text-[12.5px] truncate pr-6">{task!.title}</div>
                      <button
                        type="button"
                        onClick={() => toggleLineup(task!.id)}
                        class="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 font-bold text-xs w-5 h-5 flex items-center justify-center hover:bg-black/5 rounded-full"
                        title="Remove from Lineup"
                      >
                        ✕
                      </button>
                      <div class="text-[10px] text-tt-blue font-bold bg-blue-50 rounded-full px-2 py-0.5 w-max select-none">
                        Lineup {idx + 1}
                      </div>
                    </div>
                  </Show>
                );
              }}
            </For>
          </div>
        </div>

        {/* Backlog Lists */}
        <div class="grid grid-cols-2 gap-6 items-start">
          {/* Important section */}
          <div class="space-y-3">
            <h3 class="font-bold text-[13px] text-red-500 border-b border-red-100 pb-1.5 flex items-center gap-1">
              <span>★</span>
              <span>Priority Tasks</span>
            </h3>
            <div class="space-y-2">
              <For
                each={importantTasks()}
                fallback={
                  <div class="text-slate-400 text-xs py-4 text-center border border-dashed border-slate-200 bg-white rounded-lg select-none">
                    No priority tasks
                  </div>
                }
              >
                {(task) => (
                  <div
                    onClick={() => toggleLineup(task.id)}
                    class={`cursor-pointer rounded-lg border p-3 flex items-center justify-between transition bg-white shadow-sm ${
                      store.lineup.includes(task.id)
                        ? "border-tt-blue bg-blue-50/10 shadow-sm"
                        : "border-tt-border hover:border-slate-300"
                    }`}
                  >
                    <span class="font-medium text-slate-700 text-[12.5px] truncate flex-1 pr-3">{task.title}</span>
                    <input
                      type="checkbox"
                      checked={store.lineup.includes(task.id)}
                      readOnly
                      class="rounded border-slate-300 text-tt-blue focus:ring-0 pointer-events-none"
                    />
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Other section */}
          <div class="space-y-3">
            <h3 class="font-semibold text-[13px] text-tt-text border-b border-tt-border pb-1.5 flex items-center gap-1">
              <span>Inbox & Other Tasks</span>
            </h3>
            <div class="space-y-2">
              <For
                each={otherTasks()}
                fallback={
                  <div class="text-slate-400 text-xs py-4 text-center border border-dashed border-slate-200 bg-white rounded-lg select-none">
                    No other tasks
                  </div>
                }
              >
                {(task) => (
                  <div
                    onClick={() => toggleLineup(task.id)}
                    class={`cursor-pointer rounded-lg border p-3 flex items-center justify-between transition bg-white shadow-sm ${
                      store.lineup.includes(task.id)
                        ? "border-tt-blue bg-blue-50/10 shadow-sm"
                        : "border-tt-border hover:border-slate-300"
                    }`}
                  >
                    <span class="font-medium text-slate-700 text-[12.5px] truncate flex-1 pr-3">{task.title}</span>
                    <input
                      type="checkbox"
                      checked={store.lineup.includes(task.id)}
                      readOnly
                      class="rounded border-slate-300 text-tt-blue focus:ring-0 pointer-events-none"
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
