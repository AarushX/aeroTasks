# Acceptance Criteria: Methodology Pipeline & Workspace Model

**Spec:** `docs/superpowers/specs/2026-06-18-methodology-pipeline-design.md`
**Date:** 2026-06-18
**Status:** Approved

---

## Criteria

| ID | Description | Test Type | Preconditions | Expected Result |
|----|-------------|-----------|---------------|-----------------|
| AC-001 | LocalStorage State Persistence | Logic | App starts, some tasks are added and completed, active tab is changed, then page is reloaded. | On reload, all tasks, workspace classes, active view selection, and Pomodoro configuration are restored identically. |
| AC-002 | Default Triage Kanban Board Columns | UI interaction | Open Triage view with a fresh profile. | Four columns appear: "Urgent & Important", "Important / Not Urgent", "Urgent / Not Important", "Neither" with no visual badges/markers on the columns. |
| AC-003 | Column Modification updates Task Priority | Logic | Drag or select to move a task from "Neither" to "Urgent & Important" column in Triage Kanban. | Task object's properties `urgent` and `important` are both updated to `true`. |
| AC-004 | Column Manager Modal CRUD operations | UI interaction | Click "Manage Columns" button in Triage view, add a new column named "Reviewing" with urgent: true and important: false, rename "Neither" to "Backlog", delete "Urgent / Not Important". | The Kanban board updates dynamically to reflect these changes. Task data is synced to the new columns' priority mappings. |
| AC-005 | Daily Lineup Planning limit | UI interaction | Open Plan view. Click tasks in backlog to populate lineup slots. | Up to 3 tasks can be added to the lineup slots. Clicking a 4th task has no effect or displays a warning, keeping the lineup size strictly $\le 3$. |
| AC-006 | Pomodoro Focus Execution | UI interaction | Select tasks for lineup, go to Do view, start Pomodoro timer. | Timer starts counting down. Clicking "Mark Done" marks the current lineup task as completed, removes it from lineup, and advances to the next lineup task. |
| AC-007 | Reflection and Journal Log Persistence | UI interaction | Go to Reflect view. Input reflection journal text and view completions stats. Reload page. | The text is saved in local history and persists upon reloading the page. Statistics match the number of completed tasks and lineup completions for the current day. |
