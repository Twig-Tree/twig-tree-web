import { useState } from "react";

type MemoEditorProps = {
  initialMemo: string;
};

export const MemoEditor = ({ initialMemo }: MemoEditorProps) => {
  const [memo, setMemo] = useState(initialMemo);

  return (
    <>
      <div className="min-h-0 flex-1 p-5">
        <textarea
          className="h-full w-full resize-none rounded-md border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="Write a memo for this node."
        />
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          onClick={() => setMemo(initialMemo)}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => alert("메모 저장 API 연동 예정")} // TODO: 메모 저장 API 연동
        >
          저장
        </button>
      </footer>
    </>
  );
};
