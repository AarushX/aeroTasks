import { createSignal, createEffect, For } from "solid-js";
import { store, saveReflection } from "../store";
import { TabHeader } from "./TaskList";

export default function ReflectStats() {
  const today = () => new Date().toISOString().split("T")[0];
  const todaysLog = () => store.reflections.find((r) => r.date === today());
  
  const [note, setNote] = createSignal("");

  createEffect(() => {
    setNote(todaysLog()?.note || "");
  });

  const handleSave = () => {
    saveReflection(note().trim());
    alert("Reflection log saved for today!");
  };

  const completedToday = () => {
    return store.tasks.filter((t) => t.done && t.completedAt?.startsWith(today())).length;
  };

  const totalCreatedToday = () => {
    return store.tasks.filter((t) => {
      if (!t.id.startsWith("t_")) return false;
      const timestampStr = t.id.split("_")[1];
      if (!timestampStr) return false;
      const createdDate = new Date(parseInt(timestampStr)).toISOString().split("T")[0];
      return createdDate === today();
    }).length;
  };

  const focusMinutesToday = () => {
    return todaysLog()?.focusMinutes || 0;
  };

  return (
    <div class="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-border px-6">
        <h1 class="text-[17px] font-semibold text-tt-text font-sans">Review & Reflect</h1>
        <TabHeader />
      </header>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {/* Stats grid */}
        <div class="grid grid-cols-3 gap-6">
          <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center select-none">
            <div class="text-3xl font-extrabold text-tt-blue">{completedToday()}</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">Completed Today</div>
          </div>

          <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center select-none">
            <div class="text-3xl font-extrabold text-slate-800">{totalCreatedToday()}</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">Created Today</div>
          </div>

          <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm text-center select-none">
            <div class="text-3xl font-extrabold text-green-600">{focusMinutesToday()}m</div>
            <div class="text-[11px] font-bold text-tt-sub uppercase mt-1 tracking-wider">Focus Time Logged</div>
          </div>
        </div>

        {/* Reflection Journal Editor */}
        <div class="rounded-xl border border-tt-border bg-white p-5 shadow-sm space-y-4">
          <h2 class="font-semibold text-tt-text text-[14px]">Daily Reflection Log</h2>
          <p class="text-xs text-tt-sub">
            Capture your highlights, obstacles, and what you'd like to adjust for tomorrow.
          </p>
          
          <textarea
            value={note()}
            onInput={(e) => setNote(e.currentTarget.value)}
            placeholder="Write down today's takeaways..."
            class="w-full h-40 rounded-lg border border-tt-border p-3 text-[12.5px] outline-none focus:border-tt-blue bg-slate-50/20 placeholder:text-tt-faint font-sans"
          />
          <button
            type="button"
            onClick={handleSave}
            class="rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-2 text-[12.5px] font-semibold text-white transition shadow-sm"
          >
            Save Reflection
          </button>
        </div>

        {/* History log list */}
        <div class="space-y-3">
          <h3 class="text-xs uppercase font-bold text-tt-faint tracking-wider pl-1 select-none">
            Past Reflection History
          </h3>
          <div class="space-y-3">
            <For
              each={store.reflections.filter((r) => r.note.trim() !== "")}
              fallback={
                <div class="text-slate-400 text-xs py-4 text-center border border-dashed border-slate-200 bg-white rounded-lg select-none">
                  No reflection history yet
                </div>
              }
            >
              {(entry) => (
                <div class="rounded-xl border border-tt-border bg-white p-4 shadow-sm space-y-2">
                  <div class="flex items-center justify-between text-[11px] text-tt-muted border-b border-slate-100 pb-1.5 font-bold">
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
