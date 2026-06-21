import { For, Show } from "solid-js";
import type { Task } from "../types";
import { store, toggleLineup, removeFromLineup, activeClassId } from "../store";
import { TabHeader } from "./TaskList";

const MAX_SLOTS = 3;

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

  const importantTasks = () => getFilteredTasks().filter((t) => t.urgent || t.important);
  const otherTasks = () => getFilteredTasks().filter((t) => !t.urgent && !t.important);

  // Reactive accessors — read store.lineup directly so slots update on every change.
  const getLineupTasks = () =>
    store.lineup
      .map((id) => store.tasks.find((t) => t.id === id))
      .filter((t) => t && !t.done) as Task[];

  const lineupCount = () => getLineupTasks().length;
  const isFull = () => lineupCount() >= MAX_SLOTS;
  const inLineup = (id: string) => store.lineup.includes(id);
  const clearLineup = () => getLineupTasks().forEach((t) => removeFromLineup(t.id));

  // A single backlog row, reused by both columns. Capacity-aware: when the
  // lineup is full it disables rows that aren't already selected.
  const BacklogRow = (props: { task: Task }) => {
    const selected = () => inLineup(props.task.id);
    const disabled = () => isFull() && !selected();
    return (
      <button
        type="button"
        disabled={disabled()}
        onClick={() => toggleLineup(props.task.id)}
        class={`group w-full text-left cursor-pointer rounded-xl ring-1 p-3 flex items-center gap-3 transition-all bg-white shadow-card ${
          selected()
            ? "ring-tt-blue/60 bg-tt-bluefaint/40"
            : disabled()
            ? "ring-tt-soft opacity-45 cursor-not-allowed"
            : "ring-tt-soft hover:-translate-y-px hover:shadow-soft"
        }`}
      >
        {/* Toggle indicator */}
        <span
          class={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${
            selected()
              ? "border-tt-blue bg-tt-blue text-white"
              : "border-slate-300 text-transparent group-hover:border-slate-400"
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 4.5 4.5L19 7" />
          </svg>
        </span>

        <span class="font-medium text-slate-700 text-[12.5px] truncate flex-1">{props.task.title}</span>

        {/* Priority badges */}
        <Show when={props.task.important}>
          <span class="flex-shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 select-none">★</span>
        </Show>
        <Show when={props.task.urgent}>
          <span class="flex-shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-tt-blue select-none">⚡</span>
        </Show>
      </button>
    );
  };

  return (
    <div class="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-line px-6">
        <h1 class="text-[17px] font-semibold text-tt-text">Daily Lineup Planner</h1>
        <TabHeader />
      </header>

      {/* Planning area */}
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {/* Lineup slots */}
        <div class="rounded-2xl border border-tt-soft p-5 bg-white shadow-soft">
          <div class="mb-3.5 flex items-center justify-between select-none">
            <div class="flex items-center gap-2.5">
              <h2 class="text-xs uppercase font-bold text-tt-faint tracking-wider">Today's Focus Lineup</h2>
              <span
                class={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition-colors ${
                  isFull() ? "bg-tt-blue text-white" : "bg-tt-line text-tt-sub"
                }`}
              >
                {lineupCount()}/{MAX_SLOTS}
              </span>
            </div>
            <Show when={lineupCount() > 0}>
              <button
                type="button"
                onClick={clearLineup}
                class="text-[11.5px] font-semibold text-tt-muted hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </Show>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <For each={[0, 1, 2]}>
              {(idx) => {
                // Reactive accessor — re-evaluates whenever the lineup changes.
                const task = () => getLineupTasks()[idx];
                return (
                  <Show
                    when={task()}
                    fallback={
                      <div class="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-tt-soft bg-tt-surface text-[12px] text-slate-400 select-none">
                        Empty Slot {idx + 1}
                      </div>
                    }
                  >
                    <div class="relative flex h-20 flex-col justify-between rounded-xl ring-1 ring-tt-blue/50 bg-tt-bluefaint/50 p-3 shadow-card">
                      <div class="font-semibold text-tt-text text-[12.5px] leading-snug line-clamp-2 pr-6">{task()!.title}</div>
                      <button
                        type="button"
                        onClick={() => removeFromLineup(task()!.id)}
                        class="absolute top-2 right-2 text-slate-400 hover:text-red-500 w-5 h-5 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                        title="Remove from lineup"
                      >
                        ✕
                      </button>
                      <div class="text-[10px] text-tt-blue font-bold bg-white/70 rounded-full px-2 py-0.5 w-max select-none">
                        Focus {idx + 1}
                      </div>
                    </div>
                  </Show>
                );
              }}
            </For>
          </div>

          <Show when={isFull()}>
            <p class="mt-3 text-[11.5px] text-tt-muted select-none">
              Lineup full — remove a task to swap in another.
            </p>
          </Show>
        </div>

        {/* Backlog */}
        <div class="grid grid-cols-2 gap-6 items-start">
          {/* Priority */}
          <section class="space-y-2.5">
            <h3 class="flex items-center gap-1.5 border-b border-amber-100 pb-1.5 text-[13px] font-bold text-amber-600">
              <span>★</span>
              <span>Priority Tasks</span>
              <span class="ml-auto text-[11px] font-bold text-tt-faint tabular-nums">{importantTasks().length}</span>
            </h3>
            <div class="space-y-2">
              <For
                each={importantTasks()}
                fallback={
                  <div class="rounded-xl border border-dashed border-tt-soft bg-white py-4 text-center text-xs text-slate-400 select-none">
                    No priority tasks
                  </div>
                }
              >
                {(task) => <BacklogRow task={task} />}
              </For>
            </div>
          </section>

          {/* Other */}
          <section class="space-y-2.5">
            <h3 class="flex items-center gap-1.5 border-b border-tt-line pb-1.5 text-[13px] font-semibold text-tt-text">
              <span>Inbox & Other Tasks</span>
              <span class="ml-auto text-[11px] font-bold text-tt-faint tabular-nums">{otherTasks().length}</span>
            </h3>
            <div class="space-y-2">
              <For
                each={otherTasks()}
                fallback={
                  <div class="rounded-xl border border-dashed border-tt-soft bg-white py-4 text-center text-xs text-slate-400 select-none">
                    No other tasks
                  </div>
                }
              >
                {(task) => <BacklogRow task={task} />}
              </For>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
