import { For, Show, createSignal } from "solid-js";
import { store, activeClassId, setActiveClassId, addTask, setActiveTab } from "../store";
import { smartLists, tags } from "../data/mock";
import {
  IconSearch,
  IconPlus,
  IconSun,
  IconStack,
  IconCalendar,
  IconSevenDays,
  IconInbox,
  IconTag,
  IconCheckCircle,
  IconSidebar,
  IconChevronDown,
  IconSettings,
} from "./icons";

const smartIcons: Record<string, typeof IconSun> = {
  all: IconStack,
  today: IconSun,
  tomorrow: IconCalendar,
  week: IconSevenDays,
  inbox: IconInbox,
};

function CountBadge(props: { count?: number; active?: boolean }) {
  return (
    <Show when={props.count !== undefined && props.count > 0}>
      <span
        class={`ml-auto min-w-[18px] rounded-md px-1.5 py-0.5 text-center text-[10.5px] tabular-nums font-bold ${
          props.active ? "text-tt-blue bg-tt-bluefaint" : "text-tt-muted bg-tt-line"
        }`}
      >
        {props.count}
      </span>
    </Show>
  );
}

export default function Sidebar() {
  const [quickAddOpen, setQuickAddOpen] = createSignal(false);
  const [quickAddTitle, setQuickAddTitle] = createSignal("");
  const [workspacesOpen, setWorkspacesOpen] = createSignal(true);
  const [tagsOpen, setTagsOpen] = createSignal(true);

  const getSmartListCount = (id: string) => {
    if (id === "all") return store.tasks.filter((t) => !t.done).length;
    if (id === "today") {
      return store.tasks.filter(
        (t) => !t.done && (t.due?.toLowerCase().includes("today") || t.due === "Yesterday")
      ).length;
    }
    if (id === "tomorrow") {
      return store.tasks.filter((t) => !t.done && t.due?.toLowerCase().includes("tomorrow")).length;
    }
    if (id === "week") {
      return store.tasks.filter((t) => !t.done && t.due).length;
    }
    if (id === "inbox") {
      const classIds = store.classes.map((c) => c.id);
      return store.tasks.filter((t) => !t.done && !classIds.includes(t.listId)).length;
    }
    return 0;
  };

  const getClassTaskCount = (classId: string) => {
    return store.tasks.filter((t) => !t.done && t.listId === classId).length;
  };

  const handleQuickAddSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const title = quickAddTitle().trim();
    if (!title) return;
    addTask(title, activeClassId());
    setActiveTab("list");
    setQuickAddTitle("");
    setQuickAddOpen(false);
  };

  const handleQuickAddKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuickAddOpen(false);
      setQuickAddTitle("");
    }
  };

  return (
    <aside class="flex h-full w-[244px] flex-col border-r border-tt-soft bg-gradient-to-b from-tt-sidebar to-[#f3f4f7] flex-shrink-0">
      {/* Search header */}
      <div class="flex items-center gap-2 px-3.5 pt-3.5 pb-2.5 select-none">
        <div class="flex h-9 flex-1 items-center gap-2 rounded-xl bg-white/70 ring-1 ring-tt-soft px-3 text-tt-muted shadow-card transition hover:bg-white">
          <IconSearch size={14} />
          <span class="text-[12px] text-tt-faint">Search</span>
        </div>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl text-tt-sub hover:bg-white/70 hover:ring-1 hover:ring-tt-soft transition"
          title="Collapse sidebar"
        >
          <IconSidebar size={15} />
        </button>
      </div>

      {/* Quick Add button + inline form */}
      <div class="px-3.5 pb-1.5 select-none space-y-2">
        <button
          type="button"
          onClick={() => setQuickAddOpen((v) => !v)}
          class={`flex h-10 w-full items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-semibold shadow-soft transition-all active:scale-[0.98] ${
            quickAddOpen()
              ? "bg-tt-bluehover text-white"
              : "bg-tt-blue text-white hover:bg-tt-bluehover hover:shadow-lift"
          }`}
        >
          <IconPlus size={15} />
          <span>Quick Add Task</span>
        </button>

        <Show when={quickAddOpen()}>
          <form onSubmit={handleQuickAddSubmit} class="rounded-xl bg-white ring-1 ring-tt-soft p-2 shadow-card">
            <input
              autofocus
              type="text"
              placeholder="Task title…"
              value={quickAddTitle()}
              onInput={(e) => setQuickAddTitle(e.currentTarget.value)}
              onKeyDown={handleQuickAddKeyDown}
              class="w-full rounded-lg bg-tt-line/60 px-3 py-2 text-[12.5px] text-tt-text outline-none ring-1 ring-transparent focus:ring-tt-blue/40 focus:bg-white transition placeholder:text-tt-faint"
            />
            <div class="flex gap-2 mt-2">
              <button
                type="submit"
                class="flex-1 rounded-lg bg-tt-blue hover:bg-tt-bluehover px-3 py-2 text-[12px] font-semibold text-white transition shadow-card"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setQuickAddOpen(false); setQuickAddTitle(""); }}
                class="rounded-lg px-3 py-2 text-[12px] font-semibold text-tt-sub hover:bg-tt-line transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>
      </div>

      {/* Scrollable nav */}
      <div class="flex-1 overflow-y-auto px-2.5 pb-3 pt-1.5 select-none">
        {/* Smart lists */}
        <ul class="space-y-0.5">
          <For each={smartLists}>
            {(item) => {
              const Icon = smartIcons[item.id] ?? IconStack;
              const active = () => activeClassId() === item.id;
              return (
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveClassId(item.id)}
                    class={`flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] transition-all ${
                      active()
                        ? "bg-white font-semibold text-tt-blue shadow-card ring-1 ring-tt-soft"
                        : "text-tt-text hover:bg-white/60"
                    }`}
                  >
                    <Icon size={16} class={active() ? "text-tt-blue" : "text-tt-sub"} />
                    <span class="truncate">{item.label}</span>
                    <CountBadge count={getSmartListCount(item.id)} active={active()} />
                  </button>
                </li>
              );
            }}
          </For>
        </ul>

        {/* Workspaces — collapsible */}
        <button
          type="button"
          onClick={() => setWorkspacesOpen((v) => !v)}
          class="mt-4 mb-1 flex w-full items-center gap-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-tt-faint hover:text-tt-sub transition-colors"
        >
          <IconChevronDown
            size={12}
            class={`transform transition-transform ${workspacesOpen() ? "" : "-rotate-90"}`}
          />
          <span>Workspaces</span>
        </button>
        <Show when={workspacesOpen()}>
          <ul class="space-y-px">
            <For each={store.classes}>
              {(list) => {
                const active = () => activeClassId() === list.id;
                return (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveClassId(list.id)}
                      class={`flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] text-tt-text transition-all ${
                        active()
                          ? "bg-white font-semibold text-tt-blue shadow-card ring-1 ring-tt-soft"
                          : "hover:bg-white/60"
                      }`}
                    >
                      <span
                        class="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ "background-color": list.color }}
                      />
                      <span class="truncate flex-1 text-left">{list.name}</span>
                      <CountBadge count={getClassTaskCount(list.id)} active={active()} />
                    </button>
                  </li>
                );
              }}
            </For>
          </ul>
        </Show>

        {/* Tags — collapsible */}
        <button
          type="button"
          onClick={() => setTagsOpen((v) => !v)}
          class="mt-4 mb-1 flex w-full items-center gap-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-tt-faint hover:text-tt-sub transition-colors"
        >
          <IconChevronDown
            size={12}
            class={`transform transition-transform ${tagsOpen() ? "" : "-rotate-90"}`}
          />
          <span>Tags</span>
        </button>
        <Show when={tagsOpen()}>
          <ul class="space-y-px">
            <For each={tags}>
              {(tag) => (
                <li>
                  <button
                    type="button"
                    class="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] text-tt-text transition-all hover:bg-white/60"
                  >
                    <IconTag size={15} class="text-tt-sub" />
                    <span class="truncate">{tag.label}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      {/* Footer */}
      <div class="border-t border-tt-soft px-2.5 pt-1.5 pb-2 select-none">
        <button
          type="button"
          onClick={() => setActiveClassId("completed")}
          class={`flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] transition-all ${
            activeClassId() === "completed"
              ? "bg-white font-semibold text-tt-blue shadow-card ring-1 ring-tt-soft"
              : "text-tt-sub hover:bg-white/60"
          }`}
        >
          <IconCheckCircle size={16} />
          <span>Completed View</span>
        </button>

        {/* Profile + settings */}
        <div class="mt-1.5 flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all hover:bg-white/60">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tt-blue to-indigo-500 text-[12px] font-semibold text-white shadow-card">
            AP
          </div>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="truncate text-[12.5px] font-semibold text-tt-text">Aarush P</div>
            <div class="truncate text-[11px] text-tt-muted">Free plan</div>
          </div>
          <button
            type="button"
            title="Settings"
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-tt-sub transition-all hover:bg-tt-line hover:text-tt-text hover:rotate-45"
          >
            <IconSettings size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
