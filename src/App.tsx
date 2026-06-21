import Sidebar from "./components/Sidebar";
import TaskList from "./components/TaskList";
import TriageKanban from "./components/TriageKanban";
import PlanLineup from "./components/PlanLineup";
import DoPomodoro from "./components/DoPomodoro";
import ReflectStats from "./components/ReflectStats";
import DetailPanel from "./components/DetailPanel";
import { activeTab, selectedTaskId } from "./store";
import { Show } from "solid-js";

export default function App() {
  return (
    <div class="flex h-full w-full overflow-hidden bg-white font-sans text-[13px] leading-5 text-tt-text antialiased select-none">
      <Sidebar />
      
      {/* Dynamic Main View */}
      <div class="flex flex-1 overflow-hidden">
        <Show when={activeTab() === "list"}>
          <TaskList />
        </Show>
        <Show when={activeTab() === "triage"}>
          <TriageKanban />
        </Show>
        <Show when={activeTab() === "plan"}>
          <PlanLineup />
        </Show>
        <Show when={activeTab() === "do"}>
          <DoPomodoro />
        </Show>
        <Show when={activeTab() === "reflect"}>
          <ReflectStats />
        </Show>
      </div>

      {/* Hide detail panel in Do view or when no task is selected */}
      <Show when={activeTab() !== "do" && selectedTaskId() !== null}>
        <DetailPanel />
      </Show>
    </div>
  );
}
