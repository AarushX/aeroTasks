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
    listId: listId === "all" || listId === "today" || listId === "tomorrow" || listId === "week" || listId === "inbox" ? "work" : listId,
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
