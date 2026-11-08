import { type ReactNode, useEffect, useState } from "react";
import { MAX_MEMO_LENGTH } from "@/src/entities/tree";
import { validateMemoContent } from "../lib/save-memo/validateMemoContent";
import { useEditingStore } from "../model/sync/editingStore";

type MemoEditorProps = {
  initialMemo: string;
  onSave: (content: string) => void; // 저장 버튼 클릭 시 현재 편집 중인 내용을 전달한다
  isSaving: boolean; // 저장 요청이 진행 중인 동안 편집/저장 UI를 잠글지 여부
  hasConflict: boolean; // 다른 곳에서 먼저 수정되어 저장하지 못했는지 여부
  onRevert: () => void; // 되돌리기를 눌렀을 때 호출한다. 입력을 최신 메모로 바꾸면 충돌 안내도 필요 없어진다
  children?: ReactNode; // 메모 본문과 되돌리기·저장 버튼 사이에 놓을 내용. 노드 태그 영역이 들어온다
};

export const MemoEditor = ({
  initialMemo,
  onSave,
  isSaving,
  hasConflict,
  onRevert,
  children,
}: MemoEditorProps) => {
  const [memo, setMemo] = useState(initialMemo);
  const [previousInitialMemo, setPreviousInitialMemo] = useState(initialMemo);
  const [hasExternalMemoChange, setHasExternalMemoChange] = useState(false); // 초안을 쓰는 동안 저장된 메모가 다른 곳에서 바뀌었는지

  /*
  다른 곳의 변경으로 저장된 메모가 바뀌면, 입력을 고치지 않은 경우에만 새 값을 보여 준다. 고친 입력은 사용자의 초안이므로 덮지 않는다.
  같은 노드면 key가 그대로라 다시 마운트되지 않으므로 렌더 중에 맞춘다. effect로 맞추면 옛 메모가 한 번 그려진다.
  고쳤는지는 저장되는 값인 앞뒤 공백을 제거한 내용으로 판단한다. 공백만 다른 입력을 초안으로 남기면 저장할 때 새 메모를 옛 내용으로 덮어쓴다.

  초안을 남긴 채 메모가 바뀌면 알려야 한다. 이름 저장의 충돌로 메모와 version이 함께 최신이 되면, 다음 메모 저장은 서버가 거절하지 않아 안내 없이 덮어쓴다.
  직접 저장한 경우에는 입력과 새 메모가 같으므로 알리지 않는다.
  */
  if (previousInitialMemo !== initialMemo) {
    setPreviousInitialMemo(initialMemo);

    const isMemoUntouched = memo.trim() === previousInitialMemo.trim();

    if (isMemoUntouched) setMemo(initialMemo);

    setHasExternalMemoChange(
      !isMemoUntouched && memo.trim() !== initialMemo.trim(),
    );
  }

  /*
  저장되는 값이 앞뒤 공백을 제거한 내용이므로 글자 수와 오류 판정도 같은 값을 기준으로 한다.
  */
  const memoLength = memo.trim().length;
  const errorMessage = validateMemoContent(memo);

  /*
  저장하지 않은 입력이 있는 동안에는 다른 곳의 변경을 반영하지 않도록 알린다. 패널을 닫거나 노드를 바꿔 입력이 버려지면 cleanup이 해제한다.
  */
  const isDirty = memo.trim() !== initialMemo.trim();
  const setMemoDirty = useEditingStore((state) => state.setMemoDirty);

  useEffect(() => {
    if (!isDirty) return;

    setMemoDirty(true);

    return () => setMemoDirty(false);
  }, [isDirty, setMemoDirty]);

  let conflictMessage: string | null = null;

  if (hasConflict) {
    conflictMessage =
      "다른 곳에서 먼저 수정되어 저장하지 않았습니다. 되돌리기를 누르면 최신 메모를 볼 수 있고, 저장을 다시 누르면 지금 내용으로 덮어씁니다.";
  } else if (hasExternalMemoChange && isDirty) {
    conflictMessage =
      "다른 곳에서 메모가 수정되었습니다. 되돌리기를 누르면 최신 메모를 볼 수 있고, 저장을 누르면 지금 내용으로 덮어씁니다.";
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-panel">
        <textarea
          className="min-h-0 w-full flex-1 resize-none rounded-control border border-line bg-surface p-3 text-sm text-content-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle aria-[invalid=true]:border-danger-line aria-[invalid=true]:focus:border-danger-line aria-[invalid=true]:focus:ring-danger-subtle"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="이 노드에 대한 메모를 남겨 보세요."
          aria-invalid={errorMessage !== null}
          aria-describedby="memo-length"
        />

        {conflictMessage ? (
          <p
            role="alert"
            className="rounded-control border border-warning-line bg-warning-subtle px-3 py-2 text-xs text-warning-strong"
          >
            {conflictMessage}
          </p>
        ) : null}

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
          onClick={() => {
            setMemo(initialMemo);
            setHasExternalMemoChange(false);
            onRevert();
          }}
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
