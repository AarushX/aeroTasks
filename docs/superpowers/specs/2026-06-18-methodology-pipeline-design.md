# aeroTasks — Methodology Pipeline & Workspace Model (Design Spec)

**Date:** 2026-06-18
**Status:** Approved (via /goal workflow)

## Goal
Transform the static aeroTasks TickTick-clone UI into a functional, opinionated productivity app built around a methodology pipeline (capture → triage → plan → do → reflect) with a class-based workspace model and LocalStorage persistence.

## Core Features

### 1. Workspace (Class) Model
- The custom lists (Work, Personal, etc. in the sidebar) represent the classes/workspaces.
- Selecting a class filters the tasks in the current view.
- Smart views in the sidebar (All, Today, Tomorrow, Next 7 Days, Inbox) remain functional and group tasks across workspaces.

### 2. Methodology Pipeline (Top-Right Tabs)
In the top-right header of the middle panel, buttons toggle between the 5 stages:
1. **List (Capture)**:
   - Standard task list with "+ Add task" bar.
   - Tasks default to the currently selected Class.
2. **Triage (Kanban)**:
   - Kanban board view of tasks in the active workspace.
   - Columns represent Eisenhower priorities (default: Urgent & Important, Important / Not Urgent, Urgent / Not Important, Neither).
   - No badges or markers on the columns to maintain a clean aesthetic.
   - Separate "Manage Columns" modal to add, edit, delete columns and configure their Urgent/Important mapping.
   - Moving a task to a column automatically updates its `urgent` and `important` properties to match that column's settings.
3. **Plan (Lineup)**:
   - Interface to pick exactly up to 3 tasks as the active focus lineup.
   - Backlog divided into "Important" tasks (urgent or important) and "Other" tasks.
   - Selecting a task adds it to one of the 3 lineup slots.
4. **Do (Pomodoro)**:
   - Focused execution interface for the 3 lineup tasks.
   - Pomodoro timer (25 min Focus, 5 min Short Break, 15 min Long Break) with status controls (Start/Pause, Reset).
   - Completing a task marks it done and automatically queues the next lineup item.
5. **Reflect (Daily Review)**:
   - Metrics of the day: completed tasks count, lineup progress (e.g. 2/3), total focus minutes.
   - Text editor for entering daily journaling reflections, stored chronologically.

### 3. LocalStorage Persistence
- All states (tasks, columns, classes, active view, active class, lineup, Pomodoro, reflection logs) are persisted locally to localStorage.
- Loads state on application mount.

## Data Model & Interfaces (`src/types.ts`)

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
  listId: string; // references Class/Workspace ID
  tags?: string[];
  note?: string;
  subtasks?: Subtask[];
  completedAt?: string; // ISO string for daily stats
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

## UI Structure & Layout Modifications
- **Top Bar in Middle Pane**: Contains the view toggle buttons: `List`, `Triage`, `Plan`, `Do`, `Reflect`.
- **Detail Panel (Right Pane)**: Shows details for the currently active task in all views except `Do` (which focuses entirely on Pomodoro) or when collapsed.
