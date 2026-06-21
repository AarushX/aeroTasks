import { Show, For } from "solid-js";
import type { Task } from "../types";
import { IconStar, IconChevronRight } from "./icons";
import { store, updateTask, selectedTaskId, setSelectedTaskId } from "../store";

/** A circular checkbox whose ring color encodes the task priority. */
function Checkbox(props: { task: Task }) {
  const checkboxColorClass = () => {
    if (props.task.done) return "border-tt-faint bg-tt-faint text-white";
    if (props.task.urgent && props.task.important) return "border-red-500 text-red-500 hover:bg-red-50";
    if (props.task.important) return "border-amber-500 text-amber-500 hover:bg-amber-50";
    if (props.task.urgent) return "border-blue-500 text-blue-500 hover:bg-blue-50";
    return "border-slate-300 text-slate-400 hover:border-slate-400";
  };

  const handleToggle = (e: Event) => {
    e.stopPropagation();
    updateTask(props.task.id, {
      done: !props.task.done,
      completedAt: !props.task.done ? new Date().toISOString() : undefined,
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      class={`mt-[1px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${checkboxColorClass()}`}
    >
      <Show when={props.task.done}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 12 4.5 4.5L19 7" />
        </svg>
      </Show>
    </button>
  );
}

export default function TaskItem(props: { task: Task; selected?: boolean }) {
  const taskList = () => store.classes.find((c) => c.id === props.task.listId);

  const handleToggleStar = (e: Event) => {
    e.stopPropagation();
    updateTask(props.task.id, { important: !props.task.important });
  };

  return (
    <div
      onClick={() => setSelectedTaskId(props.task.id)}
      class={`group flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 pr-2 transition-colors ${
        selectedTaskId() === props.task.id ? "bg-tt-active" : "hover:bg-tt-hover"
      }`}
    >
      <Checkbox task={props.task} />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span
            class={`truncate text-[13px] ${
              props.task.done ? "text-tt-faint line-through" : "text-tt-text"
            }`}
          >
            {props.task.title}
          </span>
        </div>

        <Show when={props.task.due || props.task.tags?.length || taskList()}>
          <div class="mt-1 flex items-center gap-2 text-[11.5px]">
            <Show when={props.task.due}>
              <span class={props.task.due === "Yesterday" && !props.task.done ? "text-red-500 font-medium" : "text-tt-muted"}>
                {props.task.due}
              </span>
            </Show>
            <For each={props.task.tags}>
              {(tag) => (
                <span class="rounded bg-blue-50 px-1.5 py-px text-[11px] text-tt-blue font-medium">
                  #{tag}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Right side: list label + hover actions */}
      <div class="flex items-center gap-2 pt-px" onClick={(e) => e.stopPropagation()}>
        <Show when={taskList()}>
          <span class="flex items-center gap-1 text-[11.5px] text-tt-muted">
            <span
              class="h-2 w-2 rounded-full"
              style={{ "background-color": taskList()!.color }}
            />
            {taskList()!.name}
          </span>
        </Show>
        <button
          type="button"
          onClick={handleToggleStar}
          class={`text-slate-300 hover:text-amber-500 transition-colors ${
            props.task.important ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <IconStar size={15} class={props.task.important ? "fill-amber-500 stroke-amber-500 text-amber-500" : ""} />
        </button>
        <IconChevronRight size={14} class="text-slate-300 group-hover:text-slate-400" />
      </div>
    </div>
  );
}
