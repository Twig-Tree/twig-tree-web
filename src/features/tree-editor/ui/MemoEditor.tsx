import { type ReactNode, useState } from "react";
import { MAX_MEMO_LENGTH } from "@/src/entities/tree";
import { validateMemoContent } from "../lib/save-memo/validateMemoContent";

type MemoEditorProps = {
  initialMemo: string;
  onSave: (content: string) => void; // 저장 버튼 클릭 시 현재 편집 중인 내용을 전달한다
  isSaving: boolean; // 저장 요청이 진행 중인 동안 편집/저장 UI를 잠글지 여부
  children?: ReactNode; // 메모 본문과 되돌리기·저장 버튼 사이에 놓을 내용. 노드 태그 영역이 들어온다
};

export const MemoEditor = ({
  initialMemo,
  onSave,
  isSaving,
  children,
}: MemoEditorProps) => {
  const [memo, setMemo] = useState(initialMemo);

  /*
  저장되는 값이 앞뒤 공백을 제거한 내용이므로 글자 수와 오류 판정도 같은 값을 기준으로 한다.
  */
  const memoLength = memo.trim().length;
  const errorMessage = validateMemoContent(memo);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-panel">
        <textarea
          className="min-h-0 w-full flex-1 resize-none rounded-control border border-line bg-surface p-3 text-sm text-content-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle aria-[invalid=true]:border-danger-line aria-[invalid=true]:focus:border-danger-line aria-[invalid=true]:focus:ring-danger-subtle"
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
            <p role="alert" className="font-medium text-danger">
              {errorMessage}
            </p>
          ) : (
            <span />
          )}

          <span
            className={
              errorMessage
                ? "shrink-0 text-danger"
                : "shrink-0 text-content-muted"
            }
          >
            {memoLength} / {MAX_MEMO_LENGTH}
          </span>
        </div>
      </div>

      {children}

      <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-line px-panel">
        <button
          type="button"
          className="rounded-control border border-line px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-hover disabled:opacity-50"
          onClick={() => setMemo(initialMemo)}
          disabled={isSaving}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="rounded-control bg-inverse px-4 py-2 text-sm font-medium text-on-inverse disabled:opacity-50"
          onClick={() => onSave(memo)}
          disabled={isSaving || errorMessage !== null}
        >
          저장
        </button>
      </footer>
    </>
  );
};
