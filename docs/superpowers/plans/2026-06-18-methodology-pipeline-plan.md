# Methodology Pipeline & Workspace Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform aeroTasks from a static UI clone into a functional, opinionated productivity app with LocalStorage persistence, workspace classes, Triage (Kanban), Plan (3-task Lineup), Do (Pomodoro focus), and Reflect (daily journaling/stats) views.

**Architecture:** We use a centralized SolidJS store (`src/store.ts`) that manages state and synchronizes automatically with LocalStorage. The middle panel dynamically renders views based on the `activeTab` signal, while the sidebar controls the filtered workspace (`activeClassId`).

**Tech Stack:** SolidJS, Tailwind CSS, TypeScript, HTML5 LocalStorage, Lucide-style inline SVGs.

---

### Task 1: Update Types and Create global Store

**Files:**
- Modify: `src/types.ts`
- Create: `src/store.ts`

- [ ] **Step 1: Write updated interfaces in types.ts**
  Replace `src/types.ts` contents with support for urgent/important flags, workspaces, and columns.
  ```typescript
  export type Priority = "high" | "medium" | "low" | "none";

  export interface Subtask {
    id: string;
    title: string;
    done: boolean;
  }

  export interface Task {
    id: string;
    title: string;
    done: boolean;
    urgent: boolean;
    important: boolean;
    due?: string;
    listId: string; // references ClassWorkspace id
    tags?: string[];
    note?: string;
    subtasks?: Subtask[];
    completedAt?: string; // ISO Date String
  }

  export interface KanbanColumn {
    id: string;
    name: string;
    urgent: boolean;
    important: boolean;
  }

  export interface ClassWorkspace {
    id: string;
    name: string;
    color: string;
  }

  export interface ReflectionEntry {
    date: string; // YYYY-MM-DD
    note: string;
    completedCount: number;
    focusMinutes: number;
  }
  ```

- [ ] **Step 2: Create src/store.ts**
  Write a central store containing signals for tasks, classes, kanban columns, active views, lineup, and Pomodoro timer, with localStorage synchronization.
  ```typescript
  import { createStore } from "solid-js/store";
  import { createEffect, createSignal } from "solid-js";
  import type { Task, KanbanColumn, ClassWorkspace, ReflectionEntry } from "./types";

  const STORAGE_KEY = "aerotasks_state";

  interface AppState {
    tasks: Task[];
    classes: ClassWorkspace[];
    columns: KanbanColumn[];
    lineup: string[]; // up to 3 task IDs
    reflections: ReflectionEntry[];
  }

  const defaultClasses: ClassWorkspace[] = [
    { id: "work", name: "Work", color: "#e8494a" },
    { id: "personal", name: "Personal", color: "#f5a623" },
    { id: "shopping", name: "Shopping", color: "#39b54a" },
    { id: "reading", name: "Reading", color: "#9b59b6" },
  ];

  const defaultColumns: KanbanColumn[] = [
    { id: "c1", name: "Urgent & Important", urgent: true, important: true },
    { id: "c2", name: "Important / Not Urgent", urgent: false, important: true },
    { id: "c3", name: "Urgent / Not Important", urgent: true, important: false },
    { id: "c4", name: "Neither", urgent: false, important: false },
  ];

  const initialTasks: Task[] = [
    {
      id: "t1",
      title: "Reply to design feedback email",
      done: false,
      urgent: true,
      important: true,
      due: "Yesterday",
      listId: "work",
    },
    {
      id: "t2",
      title: "Renew gym membership",
      done: false,
      urgent: false,
      important: false,
      due: "Mon",
      listId: "personal",
    },
    {
      id: "t3",
      title: "Finish Q3 roadmap draft",
      done: false,
      urgent: true,
      important: true,
      due: "Today 17:00",
      listId: "work",
      tags: ["focus"],
      note: "Pull metrics from last quarter and outline key initiatives.",
      subtasks: [
        { id: "s1", title: "Gather Q2 metrics", done: true },
        { id: "s2", title: "Draft initiative summaries", done: false },
      ],
    },
  ];

  const saved = localStorage.getItem(STORAGE_KEY);
  const initialState: AppState = saved
    ? JSON.parse(saved)
    : {
        tasks: initialTasks,
        classes: defaultClasses,
        columns: defaultColumns,
        lineup: [],
        reflections: [],
      };

  export const [store, setStore] = createStore<AppState>(initialState);

  createEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  });

  // Navigation signals
  export const [activeTab, setActiveTab] = createSignal<"list" | "triage" | "plan" | "do" | "reflect">("list");
  export const [activeClassId, setActiveClassId] = createSignal<string>("all");
  export const [selectedTaskId, setSelectedTaskId] = createSignal<string | null>("t3");

  // Mutators
  export function addTask(title: string, listId: string) {
    const newTask: Task = {
      id: "t_" + Date.now(),
      title,
      done: false,
      urgent: false,
      important: false,
      listId: listId === "all" || listId.startsWith("smart:") ? "work" : listId,
    };
    setStore("tasks", (tasks) => [newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
  }

  export function updateTask(taskId: string, updates: Partial<Task>) {
    setStore("tasks", (t) => t.id === taskId, updates);
  }

  export function deleteTask(taskId: string) {
    setStore("tasks", (tasks) => tasks.filter((t) => t.id !== taskId));
    setStore("lineup", (lineup) => lineup.filter((id) => id !== taskId));
    if (selectedTaskId() === taskId) setSelectedTaskId(null);
  }

  export function toggleLineup(taskId: string) {
    if (store.lineup.includes(taskId)) {
      setStore("lineup", (lineup) => lineup.filter((id) => id !== taskId));
    } else if (store.lineup.length < 3) {
      setStore("lineup", (lineup) => [...lineup, taskId]);
    }
  }

  export function saveReflection(note: string) {
    const today = new Date().toISOString().split("T")[0];
    const completedCount = store.tasks.filter(
      (t) => t.done && t.completedAt?.startsWith(today)
    ).length;
    
    setStore("reflections", (reflections) => {
      const existing = reflections.findIndex((r) => r.date === today);
      const newEntry: ReflectionEntry = {
        date: today,
        note,
        completedCount,
        focusMinutes: reflections[existing]?.focusMinutes || 0,
      };
      if (existing >= 0) {
        const copy = [...reflections];
        copy[existing] = newEntry;
        return copy;
      }
      return [...reflections, newEntry];
    });
  }

  export function addFocusMinutes(minutes: number) {
    const today = new Date().toISOString().split("T")[0];
    setStore("reflections", (reflections) => {
      const existing = reflections.findIndex((r) => r.date === today);
      if (existing >= 0) {
        const copy = [...reflections];
        copy[existing] = {
          ...copy[existing],
          focusMinutes: copy[existing].focusMinutes + minutes,
        };
        return copy;
      } else {
        return [
          ...reflections,
          { date: today, note: "", completedCount: 0, focusMinutes: minutes },
        ];
      }
    });
  }
  ```

- [ ] **Step 3: Run typescript compiler check**
  Run: `npm run build`
  Expected: Success or minor build errors related to mock data imports that we'll update.

- [ ] **Step 4: Commit**
  ```bash
  git add src/types.ts src/store.ts
  git commit -m "feat: add store with localstorage persistence and types"
  ```

---

### Task 2: Create Core UI View Layouts and Tab Header

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TaskList.tsx`

- [ ] **Step 1: Update App.tsx**
  Modify the App shell to render dynamic views based on the `activeTab()` state.
  ```typescript
  import IconRail from "./components/IconRail";
  import Sidebar from "./components/Sidebar";
  import TaskList from "./components/TaskList";
  import TriageKanban from "./components/TriageKanban";
  import PlanLineup from "./components/PlanLineup";
  import DoPomodoro from "./components/DoPomodoro";
  import ReflectStats from "./components/ReflectStats";
  import DetailPanel from "./components/DetailPanel";
  import { activeTab } from "./store";
  import { Show } from "solid-js";

  export default function App() {
    return (
      <div class="flex h-full w-full overflow-hidden bg-white font-sans text-[13px] leading-5 text-tt-text antialiased select-none">
        <IconRail />
        <Sidebar />
        
        {/* Dynamic Main View */}
        <div class="flex flex-1 overflow-hidden">
          <Show when={activeTab() === "list"}>
            <TaskList />
          </Show>
          <Show when={activeTab() === "triage"}>
            <TriageKanban />
          </Show>
          <Show when={activeTab() === "plan"}>
            <PlanLineup />
          </Show>
          <Show when={activeTab() === "do"}>
            <DoPomodoro />
          </Show>
          <Show when={activeTab() === "reflect"}>
            <ReflectStats />
          </Show>
        </div>

        {/* Hide detail panel in Do view or when active task is null */}
        <Show when={activeTab() !== "do"}>
          <DetailPanel />
        </Show>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create the Tab Switcher in TaskList.tsx**
  Add tab headers on the top right.
  ```typescript
  // Find where header elements are in TaskList.tsx and include:
  import { activeTab, setActiveTab } from "../store";
  // Then in the header buttons area:
  <div class="flex items-center border border-tt-border rounded-lg overflow-hidden bg-white">
    <For each={["list", "triage", "plan", "do", "reflect"] as const}>
      {(tab) => (
        <button
          type="button"
          onClick={() => setActiveTab(tab)}
          class={`px-3 py-1.5 text-[12px] font-medium border-r last:border-r-0 border-tt-border capitalize transition-colors ${
            activeTab() === tab ? "bg-tt-blue text-white" : "text-tt-sub hover:bg-black/5"
          }`}
        >
          {tab}
        </button>
      )}
    </For>
  </div>
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add src/App.tsx
  git commit -m "feat: integrate top-tab routing shell"
  ```

---

### Task 3: Implement Triage View (Kanban Board)

**Files:**
- Create: `src/components/TriageKanban.tsx`

- [ ] **Step 1: Write TriageKanban.tsx**
  Create the customizable Kanban board. It maps tasks to columns based on `urgent` and `important` properties. Moving/clicking moves tasks.
  ```typescript
  import { For, createSignal, Show } from "solid-js";
  import { store, updateTask, activeClassId, setSelectedTaskId } from "../store";
  import ColumnManagerModal from "./ColumnManagerModal";
  import { IconSettings } from "./icons";

  export default function TriageKanban() {
    const [modalOpen, setModalOpen] = createSignal(false);

    const filteredTasks = () => {
      const classId = activeClassId();
      if (classId === "all") return store.tasks;
      if (classId === "today") {
        return store.tasks.filter((t) => t.due?.toLowerCase().includes("today"));
      }
      return store.tasks.filter((t) => t.listId === classId);
    };

    const getColumnTasks = (colUrgent: boolean, colImportant: boolean) => {
      return filteredTasks().filter(
        (t) => !t.done && t.urgent === colUrgent && t.important === colImportant
      );
    };

    // Simple Drag & Drop handlers
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
        <div class="flex h-14 items-center justify-between border-b border-tt-border px-6">
          <div class="flex items-center gap-4">
            <h1 class="text-[17px] font-semibold text-tt-text">Triage Board</h1>
          </div>
          
          <div class="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              class="flex items-center gap-1.5 rounded-lg border border-tt-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-tt-text hover:bg-black/5"
            >
              <IconSettings size={15} />
              Manage Columns
            </button>
            {/* Unified tab navigation header */}
            <TabHeader />
          </div>
        </div>

        {/* Board content */}
        <div class="flex flex-1 gap-4 overflow-x-auto p-6 bg-slate-50">
          <For each={store.columns}>
            {(col) => (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.urgent, col.important)}
                class="flex w-72 flex-col rounded-xl border border-tt-border bg-white shadow-sm overflow-hidden"
              >
                <div class="border-b border-tt-border px-4 py-3 bg-white">
                  <h3 class="font-semibold text-tt-text text-[13.5px] truncate">{col.name}</h3>
                </div>
                
                <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <For each={getColumnTasks(col.urgent, col.important)}>
                    {(task) => (
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        class="cursor-pointer rounded-lg border border-tt-border bg-white p-3 hover:shadow-md hover:border-tt-blue/40 transition"
                      >
                        <div class="font-medium text-tt-text text-[12.5px]">{task.title}</div>
                        <Show when={task.due}>
                          <div class="mt-1.5 text-[11px] text-tt-muted">{task.due}</div>
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

  function TabHeader() {
    const { activeTab, setActiveTab } = require("../store");
    return (
      <div class="flex items-center border border-tt-border rounded-lg overflow-hidden bg-white">
        <For each={["list", "triage", "plan", "do", "reflect"] as const}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab)}
              class={`px-3 py-1.5 text-[12px] font-medium border-r last:border-r-0 border-tt-border capitalize transition-colors ${
                activeTab() === tab ? "bg-tt-blue text-white" : "text-tt-sub hover:bg-black/5"
              }`}
            >
              {tab}
            </button>
          )}
        </For>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/TriageKanban.tsx
  git commit -m "feat: add triage kanban board view"
  ```

---

### Task 4: Implement Column Manager Modal

**Files:**
- Create: `src/components/ColumnManagerModal.tsx`

- [ ] **Step 1: Write ColumnManagerModal.tsx**
  A modal popup that lets users edit existing columns, adjust Urgent & Important flags, add columns, or delete columns.
  ```typescript
  import { For, createSignal } from "solid-js";
  import { store, setStore } from "../store";

  export default function ColumnManagerModal(props: { onClose: () => void }) {
    const [newColName, setNewColName] = createSignal("");
    const [newColUrgent, setNewColUrgent] = createSignal(false);
    const [newColImportant, setNewColImportant] = createSignal(false);

    const handleAdd = () => {
      if (!newColName().trim()) return;
      const col = {
        id: "c_" + Date.now(),
        name: newColName(),
        urgent: newColUrgent(),
        important: newColImportant(),
      };
      setStore("columns", (columns) => [...columns, col]);
      setNewColName("");
      setNewColUrgent(false);
      setNewColImportant(false);
    };

    const handleDelete = (id: string) => {
      setStore("columns", (columns) => columns.filter((c) => c.id !== id));
    };

    const toggleColumnFlag = (id: string, flag: "urgent" | "important") => {
      setStore("columns", (c) => c.id === id, flag, (v) => !v);
    };

    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="w-[500px] rounded-xl border border-tt-border bg-white shadow-xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div class="flex items-center justify-between border-b border-tt-border p-4">
            <h2 class="text-base font-semibold text-tt-text">Manage Columns</h2>
            <button onClick={props.onClose} class="text-tt-sub hover:text-tt-text font-medium">✕</button>
          </div>

          {/* List of columns */}
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <For each={store.columns}>
              {(col) => (
                <div class="flex items-center justify-between rounded-lg border border-tt-border p-3 bg-slate-50">
                  <div class="flex-1">
                    <input
                      value={col.name}
                      onInput={(e) => setStore("columns", (c) => c.id === col.id, "name", e.currentTarget.value)}
                      class="bg-transparent font-medium border-b border-transparent hover:border-tt-border focus:border-tt-blue px-1 text-tt-text outline-none text-[13px] w-48"
                    />
                    <div class="flex items-center gap-4 mt-2">
                      <label class="flex items-center gap-1.5 text-xs text-tt-sub cursor-pointer">
                        <input
                          type="checkbox"
                          checked={col.urgent}
                          onChange={() => toggleColumnFlag(col.id, "urgent")}
                          class="rounded border-tt-border text-tt-blue"
                        />
                        Urgent
                      </label>
                      <label class="flex items-center gap-1.5 text-xs text-tt-sub cursor-pointer">
                        <input
                          type="checkbox"
                          checked={col.important}
                          onChange={() => toggleColumnFlag(col.id, "important")}
                          class="rounded border-tt-border text-tt-blue"
                        />
                        Important
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(col.id)}
                    class="text-red-500 hover:bg-red-50 rounded p-1.5 text-xs transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </For>
          </div>

          {/* Add form */}
          <div class="border-t border-tt-border p-4 space-y-3 bg-slate-50 rounded-b-xl">
            <h3 class="font-medium text-tt-text text-xs uppercase tracking-wide">Add New Column</h3>
            <div class="flex gap-2">
              <input
                placeholder="Column Name"
                value={newColName()}
                onInput={(e) => setNewColName(e.currentTarget.value)}
                class="flex-1 rounded-lg border border-tt-border px-3 py-1.5 text-[12.5px] outline-none focus:border-tt-blue"
              />
              <button
                onClick={handleAdd}
                class="rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-1.5 text-[12.5px] font-semibold text-white transition"
              >
                Add
              </button>
            </div>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 text-xs text-tt-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={newColUrgent()}
                  onChange={() => setNewColUrgent((v) => !v)}
                  class="rounded border-tt-border text-tt-blue"
                />
                Urgent
              </label>
              <label class="flex items-center gap-1.5 text-xs text-tt-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={newColImportant()}
                  onChange={() => setNewColImportant((v) => !v)}
                  class="rounded border-tt-border text-tt-blue"
                />
                Important
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/ColumnManagerModal.tsx
  git commit -m "feat: add column manager modal component"
  ```

---

### Task 5: Implement Plan View (Lineup Selector)

**Files:**
- Create: `src/components/PlanLineup.tsx`

- [ ] **Step 1: Write PlanLineup.tsx**
  Provides a UI showing 3 slots for the active task Lineup. Displays backlog grouped by "Important" and "Others".
  ```typescript
  import { For, Show } from "solid-js";
  import { store, toggleLineup, activeClassId, setSelectedTaskId } from "../store";

  export default function PlanLineup() {
    const filteredTasks = () => {
      const classId = activeClassId();
      if (classId === "all") return store.tasks.filter((t) => !t.done);
      if (classId === "today") {
        return store.tasks.filter((t) => !t.done && t.due?.toLowerCase().includes("today"));
      }
      return store.tasks.filter((t) => !t.done && t.listId === classId);
    };

    const importantTasks = () => filteredTasks().filter((t) => t.important);
    const otherTasks = () => filteredTasks().filter((t) => !t.important);

    const getLineupTasks = () => {
      return store.lineup
        .map((id) => store.tasks.find((t) => t.id === id))
        .filter(Boolean) as typeof store.tasks;
    };

    return (
      <div class="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        <div class="flex h-14 items-center justify-between border-b border-tt-border px-6">
          <h1 class="text-[17px] font-semibold text-tt-text">Daily Lineup Planner</h1>
          <TabHeader />
        </div>

        {/* Planning area */}
        <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Slots indicator */}
          <div class="rounded-xl border border-dashed border-tt-border p-5 bg-white shadow-sm">
            <h2 class="text-xs uppercase font-semibold text-tt-faint tracking-wider mb-3">Active Focus Lineup (Max 3)</h2>
            <div class="grid grid-cols-3 gap-4">
              <For each={[0, 1, 2]}>
                {(idx) => {
                  const task = getLineupTasks()[idx];
                  return (
                    <Show
                      when={task}
                      fallback={
                        <div class="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-[12px] text-slate-400">
                          Empty Slot {idx + 1}
                        </div>
                      }
                    >
                      <div class="relative flex h-20 flex-col justify-between rounded-lg border border-tt-blue bg-blue-50/40 p-3 shadow-sm">
                        <div class="font-medium text-tt-text text-[12.5px] truncate">{task!.title}</div>
                        <button
                          onClick={() => toggleLineup(task!.id)}
                          class="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-bold"
                          title="Remove from Lineup"
                        >
                          ✕
                        </button>
                        <div class="text-[10px] text-tt-blue font-semibold bg-blue-50 rounded-full px-2 py-0.5 w-max">
                          Lineup {idx + 1}
                        </div>
                      </div>
                    </Show>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Backlog */}
          <div class="grid grid-cols-2 gap-6">
            {/* Important section */}
            <div class="space-y-3">
              <h3 class="font-bold text-[13px] text-red-500 border-b border-red-100 pb-1.5">★ Priority Tasks</h3>
              <div class="space-y-2">
                <For each={importantTasks()} fallback={<div class="text-slate-400 text-xs">No priority tasks</div>}>
                  {(task) => (
                    <div
                      onClick={() => toggleLineup(task.id)}
                      class={`cursor-pointer rounded-lg border p-3 flex items-center justify-between transition ${
                        store.lineup.includes(task.id)
                          ? "border-tt-blue bg-blue-50/10 shadow-sm"
                          : "border-tt-border bg-white hover:border-slate-400"
                      }`}
                    >
                      <span class="font-medium text-slate-700 text-[12.5px]">{task.title}</span>
                      <input
                        type="checkbox"
                        checked={store.lineup.includes(task.id)}
                        readOnly
                        class="rounded border-tt-border text-tt-blue pointer-events-none"
                      />
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Other section */}
            <div class="space-y-3">
              <h3 class="font-semibold text-[13px] text-tt-text border-b border-tt-border pb-1.5">Inbox & Other Tasks</h3>
              <div class="space-y-2">
                <For each={otherTasks()} fallback={<div class="text-slate-400 text-xs">No backlog tasks</div>}>
                  {(task) => (
                    <div
                      onClick={() => toggleLineup(task.id)}
                      class={`cursor-pointer rounded-lg border p-3 flex items-center justify-between transition ${
                        store.lineup.includes(task.id)
                          ? "border-tt-blue bg-blue-50/10 shadow-sm"
                          : "border-tt-border bg-white hover:border-slate-400"
                      }`}
                    >
                      <span class="font-medium text-slate-700 text-[12.5px]">{task.title}</span>
                      <input
                        type="checkbox"
                        checked={store.lineup.includes(task.id)}
                        readOnly
                        class="rounded border-tt-border text-tt-blue pointer-events-none"
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

  function TabHeader() {
    const { activeTab, setActiveTab } = require("../store");
    return (
      <div class="flex items-center border border-tt-border rounded-lg overflow-hidden bg-white">
        <For each={["list", "triage", "plan", "do", "reflect"] as const}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab)}
              class={`px-3 py-1.5 text-[12px] font-medium border-r last:border-r-0 border-tt-border capitalize transition-colors ${
                activeTab() === tab ? "bg-tt-blue text-white" : "text-tt-sub hover:bg-black/5"
              }`}
            >
              {tab}
            </button>
          )}
        </For>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/PlanLineup.tsx
  git commit -m "feat: add plan lineup selector view"
  ```

---

### Task 6: Implement Do View (Pomodoro Timer)

**Files:**
- Create: `src/components/DoPomodoro.tsx`

- [ ] **Step 1: Write DoPomodoro.tsx**
  Implement Pomodoro timer (focus, break) with countdown logic and play/pause controls. Emits sound or logs minutes completed on focus interval.
  ```typescript
  import { createSignal, onCleanup, For, Show } from "solid-js";
  import { store, updateTask, addFocusMinutes } from "../store";

  type TimerState = "focus" | "break";

  export default function DoPomodoro() {
    const [timerState, setTimerState] = createSignal<TimerState>("focus");
    const [timeLeft, setTimeLeft] = createSignal(25 * 60); // 25 minutes
    const [isRunning, setIsRunning] = createSignal(false);
    let intervalId: number | null = null;

    const startTimer = () => {
      if (isRunning()) return;
      setIsRunning(true);
      intervalId = window.setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            // Timer expired
            handleTimerExpire();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    };

    const pauseTimer = () => {
      setIsRunning(false);
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const resetTimer = () => {
      pauseTimer();
      setTimeLeft(timerState() === "focus" ? 25 * 60 : 5 * 60);
    };

    const handleTimerExpire = () => {
      pauseTimer();
      if (timerState() === "focus") {
        addFocusMinutes(25);
        setTimerState("break");
        setTimeLeft(5 * 60); // 5 min break
        alert("Focus block complete! Time for a short break.");
      } else {
        setTimerState("focus");
        setTimeLeft(25 * 60); // 25 min focus
        alert("Break over! Let's get back to focus.");
      }
    };

    const handleComplete = (taskId: string) => {
      updateTask(taskId, { done: true, completedAt: new Date().toISOString() });
    };

    const getLineupTasks = () => {
      return store.lineup
        .map((id) => store.tasks.find((t) => t.id === id))
        .filter((t) => t && !t.done) as typeof store.tasks;
    };

    const currentTask = () => getLineupTasks()[0];

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    onCleanup(() => {
      if (intervalId) window.clearInterval(intervalId);
    });

    return (
      <div class="flex flex-1 flex-col overflow-hidden bg-white">
        <div class="flex h-14 items-center justify-between border-b border-tt-border px-6">
          <h1 class="text-[17px] font-semibold text-tt-text">Focus (Do)</h1>
          <TabHeader />
        </div>

        <div class="flex flex-1 flex-col items-center justify-center p-8 bg-slate-50/50">
          <Show
            when={currentTask()}
            fallback={
              <div class="text-center text-slate-400">
                <p class="text-base font-medium">No tasks in your lineup</p>
                <p class="text-xs mt-1">Add tasks in the Plan view to start focusing.</p>
              </div>
            }
          >
            {/* Timer card */}
            <div class="flex w-96 flex-col items-center rounded-2xl border border-tt-border bg-white p-8 shadow-md text-center">
              <h2 class="text-xs uppercase font-bold text-tt-faint tracking-wider mb-1">
                Active Focus Block
              </h2>
              <p class="font-semibold text-tt-text text-[15px] mb-8 truncate w-full">
                {currentTask()?.title}
              </p>

              {/* Timer circle representation */}
              <div class="relative flex h-52 w-52 items-center justify-center mb-8">
                <svg class="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="104"
                    cy="104"
                    r="96"
                    class="stroke-slate-100 fill-none stroke-[8]"
                  />
                  <circle
                    cx="104"
                    cy="104"
                    r="96"
                    class="stroke-tt-blue fill-none stroke-[8] transition-all duration-1000"
                    stroke-dasharray="603"
                    stroke-dashoffset={
                      603 - (603 * timeLeft()) / (timerState() === "focus" ? 25 * 60 : 5 * 60)
                    }
                  />
                </svg>
                <span class="text-4xl font-bold font-mono text-tt-text">
                  {formatTime(timeLeft())}
                </span>
              </div>

              {/* Controls */}
              <div class="flex gap-4 mb-4">
                <button
                  onClick={isRunning() ? pauseTimer : startTimer}
                  class="w-32 rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-2 text-[13px] font-semibold text-white transition"
                >
                  {isRunning() ? "Pause" : "Start"}
                </button>
                <button
                  onClick={resetTimer}
                  class="rounded-lg border border-tt-border px-4 py-2 text-[13px] font-medium text-tt-text hover:bg-black/5"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => handleComplete(currentTask()!.id)}
                class="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full transition"
              >
                ✓ Complete Task
              </button>
            </div>

            {/* Next in lineup */}
            <div class="mt-8 w-96 space-y-2">
              <h3 class="text-xs uppercase font-bold text-tt-faint tracking-wider pl-1">
                Lineup Up Next
              </h3>
              <For each={getLineupTasks().slice(1)}>
                {(task) => (
                  <div class="flex items-center gap-3 rounded-lg border border-tt-border bg-white p-3 shadow-sm">
                    <span class="h-2 w-2 rounded-full bg-slate-300" />
                    <span class="font-medium text-slate-700 text-xs truncate">{task.title}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    );
  }

  function TabHeader() {
    const { activeTab, setActiveTab } = require("../store");
    return (
      <div class="flex items-center border border-tt-border rounded-lg overflow-hidden bg-white">
        <For each={["list", "triage", "plan", "do", "reflect"] as const}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab)}
              class={`px-3 py-1.5 text-[12px] font-medium border-r last:border-r-0 border-tt-border capitalize transition-colors ${
                activeTab() === tab ? "bg-tt-blue text-white" : "text-tt-sub hover:bg-black/5"
              }`}
            >
              {tab}
            </button>
          )}
        </For>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/DoPomodoro.tsx
  git commit -m "feat: add do pomodoro timer focus view"
  ```

---

### Task 7: Implement Reflect View (Reflection & Stats)

**Files:**
- Create: `src/components/ReflectStats.tsx`

- [ ] **Step 1: Write ReflectStats.tsx**
  A daily journal editor block along with daily metric progress visualization.
  ```typescript
  import { createSignal, createEffect } from "solid-js";
  import { store, saveReflection } from "../store";

  export default function ReflectStats() {
    const today = new Date().toISOString().split("T")[0];
    const todaysLog = () => store.reflections.find((r) => r.date === today);
    
    const [note, setNote] = createSignal("");

    createEffect(() => {
      setNote(todaysLog()?.note || "");
    });

    const handleSave = () => {
      saveReflection(note());
      alert("Reflection saved!");
    };

    const completedToday = () => {
      return store.tasks.filter((t) => t.done && t.completedAt?.startsWith(today)).length;
    };

    const totalCreatedToday = () => {
      return store.tasks.filter((t) => t.id.startsWith("t_") && new Date(parseInt(t.id.split("_")[1])).toISOString().split("T")[0] === today).length;
    };

    const focusMinutesToday = () => {
      return todaysLog()?.focusMinutes || 0;
    };

    return (
      <div class="flex flex-1 flex-col overflow-hidden bg-white">
        <div class="flex h-14 items-center justify-between border-b border-tt-border px-6">
          <h1 class="text-[17px] font-semibold text-tt-text">Daily Reflection</h1>
          <TabHeader />
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <div class="grid grid-cols-3 gap-6">
            {/* Completed Stat */}
            <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center">
              <div class="text-3xl font-extrabold text-tt-blue">{completedToday()}</div>
              <div class="text-[11px] font-medium text-tt-sub uppercase mt-1">Completed Today</div>
            </div>

            {/* Total Created Stat */}
            <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center">
              <div class="text-3xl font-extrabold text-tt-text">{totalCreatedToday()}</div>
              <div class="text-[11px] font-medium text-tt-sub uppercase mt-1">New Tasks Created</div>
            </div>

            {/* Focus Minutes Stat */}
            <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center">
              <div class="text-3xl font-extrabold text-green-600">{focusMinutesToday()}m</div>
              <div class="text-[11px] font-medium text-tt-sub uppercase mt-1">Focus Time Logged</div>
            </div>
          </div>

          {/* Reflection Journal Editor */}
          <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm space-y-4">
            <h2 class="font-semibold text-tt-text text-[14px]">Daily Reflection Log</h2>
            <p class="text-xs text-tt-sub">Write down any takeaways, lessons, or notes on what went well (or what didn't) today.</p>
            
            <textarea
              value={note()}
              onInput={(e) => setNote(e.currentTarget.value)}
              placeholder="What worked? What got in the way? What will you adjust tomorrow?"
              class="w-full h-44 rounded-lg border border-tt-border p-3 text-[12.5px] outline-none focus:border-tt-blue"
            />
            <button
              onClick={handleSave}
              class="rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-2 text-[12.5px] font-semibold text-white transition"
            >
              Save Reflection
            </button>
          </div>
        </div>
      </div>
    );
  }

  function TabHeader() {
    const { activeTab, setActiveTab } = require("../store");
    return (
      <div class="flex items-center border border-tt-border rounded-lg overflow-hidden bg-white">
        <For each={["list", "triage", "plan", "do", "reflect"] as const}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab)}
              class={`px-3 py-1.5 text-[12px] font-medium border-r last:border-r-0 border-tt-border capitalize transition-colors ${
                activeTab() === tab ? "bg-tt-blue text-white" : "text-tt-sub hover:bg-black/5"
              }`}
            >
              {tab}
            </button>
          )}
        </For>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/ReflectStats.tsx
  git commit -m "feat: add daily reflection journal stats view"
  ```

---

### Task 8: Connect Sidebar, TaskList add bar, detail panels, and verify build

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/DetailPanel.tsx`

- [ ] **Step 1: Update Sidebar.tsx**
  Read dynamic workspace classes from store. Bind list button clicks to `setActiveClassId(list.id)`. Add workspace classes to lists array.
  ```typescript
  // Replace references of static lists with dynamic properties from store.
  import { store, activeClassId, setActiveClassId } from "../store";
  // Bind Sidebar selectors:
  // For classes: onClick={() => setActiveClassId(list.id)}
  // Active checks: activeClassId() === list.id
  ```

- [ ] **Step 2: Update TaskList.tsx**
  Update task list rows to map to task store, sync "+ Add Task" button to trigger `addTask(title, activeClassId())`, and hook selection to `setSelectedTaskId(task.id)`.

- [ ] **Step 3: Update DetailPanel.tsx**
  Retrieve the active selected task details dynamically using `store.tasks.find((t) => t.id === selectedTaskId())` and bind updates (changing title, checkboxes, priorities, subtask checklist items) back to store.

- [ ] **Step 4: Verify build compiles cleanly**
  Run: `npm run build`
  Expected: Finished bundle without errors.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/Sidebar.tsx src/components/TaskList.tsx src/components/DetailPanel.tsx
  git commit -m "feat: bind workspace classes, list views, and details to store"
  ```
