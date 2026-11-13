"use client";

import type { WorkspaceItem } from "@/src/entities/workspace";
import { useWorkspaceNameEditing } from "../model/useWorkspaceNameEditing";

interface EditableWorkspaceCardProps {
  heightClassName?: string; // 카드 최소 높이. 편집 전 WorkspaceCard와 같은 값을 넘겨 편집을 시작해도 카드 높이가 바뀌지 않게 한다
  workspace: WorkspaceItem; // 이름을 수정할 워크스페이스. 속한 폴더의 형제 목록으로 이름 중복을 검사한다
  onEditingEnd: () => void; // 저장 또는 취소 후 편집 상태를 종료하는 callback
}

/*
함수 이름 : EditableWorkspaceCard
기능 : 워크스페이스 카드 자리에 이름 입력창을 그린다. 입력·검증·저장 흐름은 useWorkspaceNameEditing이 맡는다.
인자 : EditableWorkspaceCardProps
반환값 : 이름을 인라인으로 수정할 수 있는 워크스페이스 카드 UI

입력 처리는 EditableFolderCard와 같다. 카드 모양이 달라 공통 컴포넌트로 뽑지 않고 같은 흐름을 따른다.
*/
export function EditableWorkspaceCard({
  heightClassName = "min-h-36",
  workspace,
  onEditingEnd,
}: EditableWorkspaceCardProps) {
  const {
    errorMessage,
    handleBlur,
    handleChange,
    handleKeyDown,
    inputRef,
    isUpdatingWorkspace,
    name,
  } = useWorkspaceNameEditing({ workspace, onEditingEnd });

  return (
    <article
      className={`flex ${heightClassName} flex-col justify-between rounded-card border border-accent-line bg-surface p-5 shadow-card ring-2 ring-accent-subtle`}
    >
      <div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          aria-label="워크스페이스 이름"
          aria-invalid={errorMessage !== null}
          aria-describedby={
            errorMessage ? `workspace-name-error-${workspace.id}` : undefined
          }
          disabled={isUpdatingWorkspace}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full rounded-control border border-accent bg-surface px-2 py-1 text-base font-semibold leading-snug text-content outline-none ring-2 ring-accent-subtle disabled:cursor-wait disabled:bg-surface-muted"
        />
        {errorMessage ? (
          <p
            id={`workspace-name-error-${workspace.id}`}
            role="alert"
            className="mt-1 text-xs font-medium text-danger"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}
