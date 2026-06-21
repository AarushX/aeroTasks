import type { ProjectList, SmartList, Task } from "../types";

export const smartLists: SmartList[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today", count: 3 },
  { id: "tomorrow", label: "Tomorrow", count: 0 },
  { id: "week", label: "Next 7 Days", count: 3 },
  { id: "inbox", label: "Inbox", count: 0 },
];

export const projectLists: ProjectList[] = [
  { id: "work", label: "Work", color: "#e8494a", count: 2 },
  { id: "personal", label: "Personal", color: "#f5a623", count: 1 },
  { id: "shopping", label: "Shopping", color: "#39b54a" },
  { id: "reading", label: "Reading", color: "#9b59b6" },
];

export const tags: { id: string; label: string; color: string }[] = [
  { id: "focus", label: "focus", color: "#4772fa" },
  { id: "errands", label: "errands", color: "#39b54a" },
  { id: "waiting", label: "waiting", color: "#f5a623" },
];

// Mock tasks matching the new Task schema
export const initialMockTasks: Task[] = [
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
    note: "Pull metrics from last quarter and outline the three key initiatives for the leadership review on Friday.",
    subtasks: [
      { id: "s1", title: "Gather Q2 metrics", done: true },
      { id: "s2", title: "Draft initiative summaries", done: false },
      { id: "s3", title: "Share with team for review", done: false },
    ],
  },
];
