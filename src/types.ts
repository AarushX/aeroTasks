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
