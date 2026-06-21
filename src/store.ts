import { createStore } from "solid-js/store";
import { createEffect, createSignal, createRoot } from "solid-js";
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

type TabId = "list" | "triage" | "plan" | "do" | "reflect";

const saved = localStorage.getItem(STORAGE_KEY);
const parsed = saved ? JSON.parse(saved) : null;

const initialState: AppState = {
  tasks: parsed?.tasks ?? initialTasks,
  classes: parsed?.classes ?? defaultClasses,
  columns: parsed?.columns ?? defaultColumns,
  lineup: parsed?.lineup ?? [],
  reflections: parsed?.reflections ?? [],
};

export const [store, setStore] = createStore<AppState>(initialState);

// Navigation signals (persisted across reloads — see spec AC-001)
export const [activeTab, setActiveTab] = createSignal<TabId>(parsed?.activeTab ?? "list");
export const [activeClassId, setActiveClassId] = createSignal<string>(parsed?.activeClassId ?? "all");
export const [selectedTaskId, setSelectedTaskId] = createSignal<string | null>(
  parsed && "selectedTaskId" in parsed ? parsed.selectedTaskId : "t3"
);

// Persist all app + navigation state. Wrapped in createRoot so the effect has
// an owner (otherwise Solid warns it "will never be disposed").
createRoot(() => {
  createEffect(() => {
    const snapshot = {
      tasks: store.tasks,
      classes: store.classes,
      columns: store.columns,
      lineup: store.lineup,
      reflections: store.reflections,
      activeTab: activeTab(),
      activeClassId: activeClassId(),
      selectedTaskId: selectedTaskId(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  });
});

// Mutators
export function addTask(title: string, listId: string) {
  // Smart-list / virtual views (all, today, completed, ...) aren't real classes,
  // so a task captured from one defaults to the first workspace instead of
  // getting an orphan listId that matches no class.
  const isRealClass = store.classes.some((c) => c.id === listId);
  const newTask: Task = {
    id: "t_" + Date.now(),
    title,
    done: false,
    urgent: false,
    important: false,
    listId: isRealClass ? listId : store.classes[0]?.id ?? "work",
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

export function removeFromLineup(taskId: string) {
  setStore("lineup", (lineup) => lineup.filter((id) => id !== taskId));
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
