import { createSignal, createEffect, For, Show, onCleanup } from "solid-js";
import { store, saveReflection } from "../store";
import { TabHeader } from "./TaskList";

export default function ReflectStats() {
  const today = () => new Date().toISOString().split("T")[0];
  const todaysLog = () => store.reflections.find((r) => r.date === today());

  const [note, setNote] = createSignal("");
  const [saved, setSaved] = createSignal(false);
  let savedTimer: number | null = null;

  createEffect(() => {
    setNote(todaysLog()?.note || "");
  });

  const handleSave = () => {
    saveReflection(note().trim());
    setSaved(true);
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => setSaved(false), 2500);
  };

  const completedToday = () =>
    store.tasks.filter((t) => t.done && t.completedAt?.startsWith(today())).length;

  const lineupProgress = () => {
    const total = store.lineup.length;
    return `${total} / 3`;
  };

  const focusMinutesToday = () => todaysLog()?.focusMinutes || 0;

  onCleanup(() => {
    if (savedTimer) clearTimeout(savedTimer);
  });

  return (
    <div class="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-line px-6">
        <h1 class="text-[17px] font-semibold text-tt-text font-sans">Review & Reflect</h1>
        <TabHeader />
      </header>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {/* Stats grid */}
        <div class="grid grid-cols-3 gap-6">
          <div class="rounded-2xl border border-tt-soft bg-white p-5 shadow-soft text-center select-none">
            <div class="text-3xl font-extrabold text-tt-blue">{completedToday()}</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">Completed Today</div>
          </div>

          <div class="rounded-2xl border border-tt-soft bg-white p-5 shadow-soft text-center select-none">
            <div class="text-3xl font-extrabold text-slate-800">{lineupProgress()}</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">In Lineup</div>
          </div>

          <div class="rounded-2xl border border-tt-soft bg-white p-5 shadow-soft text-center select-none">
            <div class="text-3xl font-extrabold text-green-600">{focusMinutesToday()}m</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">Focus Time Logged</div>
          </div>
        </div>

        {/* Reflection Journal Editor */}
        <div class="rounded-2xl border border-tt-soft bg-white p-5 shadow-soft space-y-4">
          <h2 class="font-semibold text-tt-text text-[14px]">Daily Reflection Log</h2>
          <p class="text-xs text-tt-sub">
            Capture your highlights, obstacles, and what you'd like to adjust for tomorrow.
          </p>

          <textarea
            value={note()}
            onInput={(e) => setNote(e.currentTarget.value)}
            placeholder="Write down today's takeaways..."
            class="w-full h-40 rounded-xl bg-tt-line/40 p-3.5 text-[12.5px] outline-none ring-1 ring-transparent focus:ring-tt-blue/30 focus:bg-white transition placeholder:text-tt-faint font-sans"
          />

          <div class="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              class="rounded-xl bg-tt-blue hover:bg-tt-bluehover px-4 py-2 text-[12.5px] font-semibold text-white transition shadow-card hover:shadow-lift"
            >
              Save Reflection
            </button>
            <Show when={saved()}>
              <span class="text-[12px] font-semibold text-green-600 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
                Saved!
              </span>
            </Show>
          </div>
        </div>

        {/* History log list */}
        <div class="space-y-3">
          <h3 class="text-xs uppercase font-bold text-tt-faint tracking-wider pl-1 select-none">
            Past Reflection History
          </h3>
          <div class="space-y-3">
            <For
              each={[...store.reflections].reverse().filter((r) => r.note.trim() !== "")}
              fallback={
                <div class="text-slate-400 text-xs py-4 text-center border border-dashed border-slate-200 bg-white rounded-lg select-none">
                  No reflection history yet
                </div>
              }
            >
              {(entry) => (
                <div class="rounded-2xl border border-tt-soft bg-white p-4 shadow-soft space-y-2">
                  <div class="flex items-center justify-between text-[11px] text-tt-muted border-b border-tt-line pb-1.5 font-bold">
                    <span>{entry.date}</span>
                    <span class="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                      ✓ {entry.completedCount} done | ⚡ {entry.focusMinutes}m
                    </span>
                  </div>
                  <p class="text-slate-700 text-[12.5px] whitespace-pre-line leading-relaxed font-sans">
                    {entry.note}
                  </p>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
