import { For, createSignal, Show } from "solid-js";
import {
  store,
  addTask,
  activeClassId,
  activeTab,
  setActiveTab,
} from "../store";
import TaskItem from "./TaskItem";
import {
  IconPlus,
  IconCalendar,
  IconFlag,
  IconChevronDown,
} from "./icons";

export function TabHeader() {
  return (
    <div class="inline-flex items-center gap-1 rounded-xl bg-tt-line/70 p-1 ring-1 ring-tt-soft">
      <For each={["list", "triage", "plan", "do", "reflect"] as const}>
        {(tab) => (
          <button
            type="button"
            onClick={() => setActiveTab(tab)}
            class={`rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize transition-all ${
              activeTab() === tab
                ? "bg-tt-blue text-white shadow-card"
                : "text-tt-sub hover:bg-white/70 hover:text-tt-text"
            }`}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}

export default function TaskList() {
  const [taskTitle, setTaskTitle] = createSignal("");
  const [activeOpen, setActiveOpen] = createSignal(true);
  const [completedOpen, setCompletedOpen] = createSignal(true);

  const listTitle = () => {
    const classId = activeClassId();
    if (classId === "all") return "All Tasks";
    if (classId === "today") return "Today";
    if (classId === "tomorrow") return "Tomorrow";
    if (classId === "week") return "Next 7 Days";
    if (classId === "inbox") return "Inbox";
    if (classId === "completed") return "Completed Tasks";
    
    const workspace = store.classes.find((c) => c.id === classId);
    return workspace ? workspace.name : "Tasks";
  };

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
    if (classId === "completed") {
      return store.tasks.filter((t) => t.done);
    }
    return store.tasks.filter((t) => t.listId === classId);
  };

  const activeTasks = () => getFilteredTasks().filter((t) => !t.done);
  const completedTasks = () => getFilteredTasks().filter((t) => t.done);

  const handleAddTaskSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!taskTitle().trim()) return;
    addTask(taskTitle().trim(), activeClassId());
    setTaskTitle("");
  };

  return (
    <main class="flex h-full min-w-0 flex-1 flex-col bg-white">
      {/* Header */}
      <header class="flex items-center justify-between px-6 pt-5 pb-3">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[20px] font-semibold tracking-tight text-tt-text">{listTitle()}</h1>
          <span class="text-[12.5px] text-tt-muted">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <TabHeader />
      </header>

      {/* Add task input — hidden in the completed-only view */}
      <Show when={activeClassId() !== "completed"}>
        <div class="px-6 mb-3">
          <form
            onSubmit={handleAddTaskSubmit}
            class="flex h-10 items-center gap-2.5 rounded-lg border border-tt-border px-3 text-tt-muted transition-colors focus-within:border-tt-blue hover:border-tt-faint bg-white"
          >
            <IconPlus size={16} class="text-tt-blue" />
            <input
              type="text"
              placeholder="Add task to this workspace..."
              value={taskTitle()}
              onInput={(e) => setTaskTitle(e.currentTarget.value)}
              class="flex-1 text-[13px] text-tt-text outline-none placeholder:text-tt-faint bg-transparent"
            />
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded hover:bg-tt-hover"
              title="Due date"
            >
              <IconCalendar size={16} />
            </button>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded hover:bg-tt-hover"
              title="Priority"
            >
              <IconFlag size={16} />
            </button>
          </form>
        </div>
      </Show>

      {/* Task groups */}
      <div class="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
        {/* Active tasks — hidden when browsing the completed-only view */}
        <Show when={activeClassId() !== "completed"}>
          <section>
            <button
              type="button"
              onClick={() => setActiveOpen(!activeOpen())}
              class="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-tt-sub hover:text-tt-text"
            >
              <IconChevronDown
                size={12}
                class={`transform transition-transform ${activeOpen() ? "" : "-rotate-90"}`}
              />
              <span>Active</span>
              <span class="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-tt-muted">
                {activeTasks().length}
              </span>
            </button>

            <Show when={activeOpen()}>
              <div class="mt-1.5 space-y-px">
                <For each={activeTasks()} fallback={<div class="text-slate-400 text-xs px-2 py-3">No active tasks in this view</div>}>
                  {(task) => <TaskItem task={task} />}
                </For>
              </div>
            </Show>
          </section>
        </Show>

        {/* Completed tasks */}
        <Show when={completedTasks().length > 0}>
          <section>
            <button
              type="button"
              onClick={() => setCompletedOpen(!completedOpen())}
              class="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-tt-sub hover:text-tt-text"
            >
              <IconChevronDown
                size={12}
                class={`transform transition-transform ${completedOpen() ? "" : "-rotate-90"}`}
              />
              <span>Completed</span>
              <span class="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-tt-muted">
                {completedTasks().length}
              </span>
            </button>

            <Show when={completedOpen()}>
              <div class="mt-1.5 space-y-px">
                <For each={completedTasks()}>
                  {(task) => <TaskItem task={task} />}
                </For>
              </div>
            </Show>
          </section>
        </Show>

        {/* Empty state for completed view when nothing is done yet */}
        <Show when={activeClassId() === "completed" && completedTasks().length === 0}>
          <div class="flex flex-col items-center justify-center py-16 text-tt-faint select-none gap-1">
            <span class="text-[13px]">No completed tasks yet</span>
            <span class="text-[11.5px]">Complete tasks to see them here</span>
          </div>
        </Show>
      </div>
    </main>
  );
}
