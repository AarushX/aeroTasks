# aeroTasks — TickTick Clone UI (Design Spec)

**Date:** 2026-06-18
**Status:** Approved (design), pending implementation plan

## Goal

Build the first page of a TickTick-style task manager as **UI only** (no functionality),
on top of infrastructure for a **super high performance, cross-platform desktop app**.

## Stack (approved)

- **Desktop shell:** Tauri v2 (Rust) — native OS webview, ~5MB binaries, low RAM/CPU,
  builds for macOS / Windows / Linux. This is the performance + cross-platform foundation.
- **Frontend:** SolidJS + Vite + TypeScript — compiled fine-grained reactivity, fastest runtime.
- **Styling:** Tailwind CSS — fast iteration, precise control to match TickTick's dense layout.

## Architecture

```
aeroTasks/
├── src-tauri/              # Rust backend (Tauri v2)
│   ├── src/main.rs         # entrypoint
│   ├── src/lib.rs          # app builder
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json     # window config + bundle targets (mac/win/linux)
│   └── icons/              # generated app icons (non-proprietary)
├── src/                    # SolidJS frontend
│   ├── main.tsx            # mount
│   ├── App.tsx             # 3-pane layout shell
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── AddTaskBar.tsx
│   │   └── DetailPanel.tsx
│   ├── data/mock.ts        # static lists + tasks (no logic)
│   ├── types.ts
│   └── index.css           # tailwind directives + base
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── .gitignore
```

- Dev: `npm run tauri dev` (full desktop) and `npm run dev` (web-only preview, no Rust toolchain required).
- Frontend is webview-agnostic, so the same UI renders in browser preview and the native window.

## UI — TickTick main page (3-pane, visual only)

Faithful recreation of the layout and visual language. Light theme matching TickTick's
default, signature blue accent (~#4772FA).

1. **Sidebar (left, ~260px):**
   - Header: avatar/mark, app name, search field, collapse + add icons.
   - Smart lists: Today, Next 7 Days, Inbox, Calendar, Summary (icon + label + count badge).
   - "Lists" section: colored-dot list items (e.g., Work, Personal, Shopping).
   - "Tags" + "Filters" sections.
   - Footer: Completed, Trash.
   - One item shown as active (Today) with highlight.

2. **Task list (middle, flex):**
   - Header: view title ("Today"), date, sort/view/more icons.
   - "+ Add task" input row (static).
   - Task rows grouped (Overdue, Today): circular priority checkbox, title,
     optional metadata line (due time, list tag, priority flag color).
   - One row shown selected (drives detail panel).

3. **Detail panel (right, ~360px):**
   - Selected task: title, list/date/priority pills, description text, subtask list with
     checkboxes, footer toolbar icons.
   - Static, populated from mock data.

## Scope guardrails ("just UI, don't do anything else")

- **In:** static visual recreation of the one main screen; mock data; light theme.
- **Out:** all interactivity (clicks/add/complete are no-ops), dark mode, settings, routing,
  auth, persistence, Supabase, real data, drag-and-drop, animations beyond hover states.
- This is a **look-alike** recreation of the layout — no proprietary TickTick logo/icon
  artwork is reproduced; a generated equivalent mark and open-source-style icons are used.

## Success criteria

- `npm install` then `npm run dev` serves the page; it visually reads as the TickTick main page.
- `npm run tauri dev` opens a native window rendering the same UI (when Rust toolchain present).
- `tauri.conf.json` declares macOS/Windows/Linux bundle targets.
- No console errors; TypeScript compiles clean.
```
