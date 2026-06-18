import { createSignal, onCleanup, For, Show } from "solid-js";
import { store, updateTask, addFocusMinutes } from "../store";
import { TabHeader } from "./TaskList";

type TimerState = "focus" | "shortBreak" | "longBreak";

const DURATIONS: Record<TimerState, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function DoPomodoro() {
  const [timerState, setTimerState] = createSignal<TimerState>("focus");
  const [timeLeft, setTimeLeft] = createSignal(DURATIONS.focus);
  const [isRunning, setIsRunning] = createSignal(false);
  let intervalId: number | null = null;

  const startTimer = () => {
    if (isRunning()) return;
    setIsRunning(true);
    intervalId = window.setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
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
    setTimeLeft(DURATIONS[timerState()]);
  };

  const handleStateChange = (state: TimerState) => {
    pauseTimer();
    setTimerState(state);
    setTimeLeft(DURATIONS[state]);
  };

  const handleTimerExpire = () => {
    pauseTimer();
    if (timerState() === "focus") {
      // Log focus time
      addFocusMinutes(25);
      alert("Focus block complete! Time for a short break.");
      handleStateChange("shortBreak");
    } else {
      alert("Break over! Ready to focus?");
      handleStateChange("focus");
    }
  };

  const handleComplete = (taskId: string) => {
    updateTask(taskId, { done: true, completedAt: new Date().toISOString() });
    // Keep timer running or pause? Usually pause on task complete or keep going
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
      {/* Header */}
      <header class="flex h-14 items-center justify-between border-b border-tt-border px-6">
        <h1 class="text-[17px] font-semibold text-tt-text font-sans">Focus Mode (Pomodoro)</h1>
        <TabHeader />
      </header>

      {/* Main layout */}
      <div class="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-slate-50/50">
        <Show
          when={currentTask()}
          fallback={
            <div class="text-center text-slate-400 select-none py-12">
              <p class="text-[15px] font-semibold">No tasks in your lineup</p>
              <p class="text-xs mt-1">Add tasks in the Plan view to start focusing.</p>
            </div>
          }
        >
          {/* Pomodoro Timer Box */}
          <div class="flex w-96 flex-col items-center rounded-2xl border border-tt-border bg-white p-8 shadow-sm text-center">
            {/* Mode selection buttons */}
            <div class="flex border border-slate-200 rounded-lg p-1 bg-slate-50 mb-6">
              <button
                type="button"
                onClick={() => handleStateChange("focus")}
                class={`px-3 py-1 rounded text-xs font-semibold select-none transition ${
                  timerState() === "focus"
                    ? "bg-tt-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pomodoro
              </button>
              <button
                type="button"
                onClick={() => handleStateChange("shortBreak")}
                class={`px-3 py-1 rounded text-xs font-semibold select-none transition ${
                  timerState() === "shortBreak"
                    ? "bg-tt-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Short Break
              </button>
              <button
                type="button"
                onClick={() => handleStateChange("longBreak")}
                class={`px-3 py-1 rounded text-xs font-semibold select-none transition ${
                  timerState() === "longBreak"
                    ? "bg-tt-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Long Break
              </button>
            </div>

            <h2 class="text-xs uppercase font-bold text-tt-faint tracking-wider mb-1 select-none">
              Now Focusing On
            </h2>
            <p class="font-semibold text-tt-text text-[14px] mb-8 truncate w-full px-2">
              {currentTask()?.title}
            </p>

            {/* Circular Timer Visual */}
            <div class="relative flex h-48 w-48 items-center justify-center mb-8 select-none">
              <svg class="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  class="stroke-slate-100 fill-none stroke-[6]"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  class="stroke-tt-blue fill-none stroke-[6] transition-all duration-1000"
                  stroke-dasharray="552"
                  stroke-dashoffset={
                    552 - (552 * timeLeft()) / DURATIONS[timerState()]
                  }
                  stroke-linecap="round"
                />
              </svg>
              <span class="text-3xl font-extrabold font-mono text-tt-text tracking-wide">
                {formatTime(timeLeft())}
              </span>
            </div>

            {/* Actions */}
            <div class="flex gap-3 w-full justify-center mb-4">
              <button
                type="button"
                onClick={isRunning() ? pauseTimer : startTimer}
                class="w-28 rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-2 text-[12.5px] font-semibold text-white transition shadow-sm"
              >
                {isRunning() ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                class="rounded-lg border border-tt-border px-4 py-2 text-[12.5px] font-semibold text-tt-text hover:bg-black/5 transition"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleComplete(currentTask()!.id)}
              class="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-4 py-1.5 rounded-full transition mt-2 flex items-center gap-1.5 shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 12 4.5 4.5L19 7" />
              </svg>
              <span>Complete Task</span>
            </button>
          </div>

          {/* Up next lineup */}
          <div class="mt-8 w-96 space-y-2">
            <h3 class="text-xs uppercase font-bold text-tt-faint tracking-wider pl-1 select-none">
              Up Next in Lineup
            </h3>
            <For
              each={getLineupTasks().slice(1)}
              fallback={
                <div class="text-slate-400 text-xs py-3 text-center border border-dashed border-slate-200 bg-white rounded-lg select-none">
                  No other tasks in lineup
                </div>
              }
            >
              {(task) => (
                <div class="flex items-center gap-3 rounded-lg border border-tt-border bg-white p-3 shadow-sm select-none">
                  <span class="h-2 w-2 rounded-full bg-slate-300" />
                  <span class="font-medium text-slate-700 text-xs truncate flex-1">{task.title}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
