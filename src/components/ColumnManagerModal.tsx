import { For, createSignal } from "solid-js";
import { store, setStore } from "../store";

export default function ColumnManagerModal(props: { onClose: () => void }) {
  const [newColName, setNewColName] = createSignal("");
  const [newColUrgent, setNewColUrgent] = createSignal(false);
  const [newColImportant, setNewColImportant] = createSignal(false);

  const handleAdd = () => {
    if (!newColName().trim()) return;
    const col = {
      id: "c_" + Date.now(),
      name: newColName().trim(),
      urgent: newColUrgent(),
      important: newColImportant(),
    };
    setStore("columns", (columns) => [...columns, col]);
    setNewColName("");
    setNewColUrgent(false);
    setNewColImportant(false);
  };

  const handleDelete = (id: string) => {
    setStore("columns", (columns) => columns.filter((c) => c.id !== id));
  };

  const toggleColumnFlag = (id: string, flag: "urgent" | "important") => {
    setStore("columns", (c) => c.id === id, flag, (v) => !v);
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="w-[450px] rounded-xl border border-tt-border bg-white shadow-xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div class="flex items-center justify-between border-b border-tt-border p-4">
          <h2 class="text-sm font-semibold text-tt-text uppercase tracking-wide">Manage Columns</h2>
          <button
            type="button"
            onClick={props.onClose}
            class="text-tt-sub hover:text-tt-text font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        {/* List of columns */}
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          <For each={store.columns}>
            {(col) => (
              <div class="flex items-center justify-between rounded-lg border border-tt-border p-3 bg-white shadow-sm gap-4">
                <div class="flex-1 min-w-0">
                  <input
                    type="text"
                    value={col.name}
                    onInput={(e) => setStore("columns", (c) => c.id === col.id, "name", e.currentTarget.value)}
                    class="bg-transparent font-medium border-b border-transparent hover:border-slate-300 focus:border-tt-blue px-1 py-0.5 text-tt-text outline-none text-[13px] w-full"
                  />
                  <div class="flex items-center gap-4 mt-2 px-1">
                    <label class="flex items-center gap-1.5 text-xs text-tt-sub cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={col.urgent}
                        onChange={() => toggleColumnFlag(col.id, "urgent")}
                        class="rounded border-slate-300 text-tt-blue focus:ring-0"
                      />
                      Urgent
                    </label>
                    <label class="flex items-center gap-1.5 text-xs text-tt-sub cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={col.important}
                        onChange={() => toggleColumnFlag(col.id, "important")}
                        class="rounded border-slate-300 text-tt-blue focus:ring-0"
                      />
                      Important
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(col.id)}
                  class="text-red-500 hover:bg-red-50 rounded px-2.5 py-1.5 text-[12px] font-semibold transition"
                >
                  Delete
                </button>
              </div>
            )}
          </For>
        </div>

        {/* Add column form */}
        <div class="border-t border-tt-border p-4 space-y-3 bg-white">
          <h3 class="font-bold text-tt-text text-xs uppercase tracking-wider">Add New Column</h3>
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Column Name"
              value={newColName()}
              onInput={(e) => setNewColName(e.currentTarget.value)}
              class="flex-1 rounded-lg border border-tt-border px-3 py-1.5 text-[12.5px] outline-none focus:border-tt-blue bg-slate-50/50"
            />
            <button
              type="button"
              onClick={handleAdd}
              class="rounded-lg bg-tt-blue hover:bg-tt-bluehover px-4 py-1.5 text-[12.5px] font-semibold text-white transition shadow-sm"
            >
              Add
            </button>
          </div>
          <div class="flex gap-4 px-1">
            <label class="flex items-center gap-1.5 text-xs text-tt-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newColUrgent()}
                onChange={() => setNewColUrgent((v) => !v)}
                class="rounded border-slate-300 text-tt-blue focus:ring-0"
              />
              Urgent
            </label>
            <label class="flex items-center gap-1.5 text-xs text-tt-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newColImportant()}
                onChange={() => setNewColImportant((v) => !v)}
                class="rounded border-slate-300 text-tt-blue focus:ring-0"
              />
              Important
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
