import { useState } from "react";
import {
  MAX_MEMO_LENGTH,
  validateMemoContent,
} from "../lib/save-memo/validateMemoContent";

type MemoEditorProps = {
  initialMemo: string;
  onSave: (content: string) => void; // 저장 버튼 클릭 시 현재 편집 중인 내용을 전달한다
  isSaving: boolean; // 저장 요청이 진행 중인 동안 편집/저장 UI를 잠글지 여부
};

export const MemoEditor = ({
  initialMemo,
  onSave,
  isSaving,
}: MemoEditorProps) => {
  const [memo, setMemo] = useState(initialMemo);

  /*
  저장되는 값이 앞뒤 공백을 제거한 내용이므로 글자 수와 오류 판정도 같은 값을 기준으로 한다.
  */
  const memoLength = memo.trim().length;
  const errorMessage = validateMemoContent(memo);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-5">
        <textarea
          className="min-h-0 w-full flex-1 resize-none rounded-md border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:border-red-400 aria-[invalid=true]:focus:ring-red-100"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="Write a memo for this node."
          aria-invalid={errorMessage !== null}
          aria-describedby="memo-length"
        />

        {/*
        글자 수는 항상 보여 주고, 초과했을 때만 안내 문구를 덧붙인다.
        저장 버튼이 잠기는 이유를 입력 중에도 알 수 있게 한다.
        */}
        <div
          id="memo-length"
          className="flex items-baseline justify-between gap-2 text-xs"
        >
          {errorMessage ? (
            <p role="alert" className="font-medium text-red-600">
              {errorMessage}
            </p>
          ) : (
            <span />
          )}

          <span
            className={
              errorMessage ? "shrink-0 text-red-600" : "shrink-0 text-slate-400"
            }
          >
            {memoLength} / {MAX_MEMO_LENGTH}
          </span>
        </div>
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setMemo(initialMemo)}
          disabled={isSaving}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => onSave(memo)}
          disabled={isSaving || errorMessage !== null}
        >
          저장
        </button>
      </footer>
    </>
  );
};
