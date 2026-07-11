import type { CustomEditorNode } from "@/src/features/tree-editor/model/types";

type MemoSidePanelProps = {
  selectedNode: CustomEditorNode | undefined;
  onClose: () => void;
};

export function MemoSidePanel({ selectedNode, onClose }: MemoSidePanelProps) {
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Memo
          </p>
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {selectedNode?.data.label ?? "No node selected"}
          </h2>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close memo panel"
          onClick={onClose}
        >
          x
        </button>
      </header>

      <div className="min-h-0 flex-1 p-5">
        {selectedNode ? (
          <textarea
            key={selectedNode.id}
            className="h-full w-full resize-none rounded-md border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            defaultValue={selectedNode.data.memo ?? ""}
            placeholder="Write a memo for this node."
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
            Select a node to add a memo.
          </div>
        )}
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          disabled={!selectedNode}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!selectedNode}
        >
          저장
        </button>
      </footer>
    </aside>
  );
}
