"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FolderItem } from "@/src/entities/folder";
import { useUpdateFolder } from "../model/useUpdateFolder";

interface EditableFolderCardProps {
  folder: FolderItem & { id: string }; // 이름을 수정할 폴더
  folders: FolderItem[]; // 이름 중복을 검사할 형제 폴더 목록
  folderParentId: string | null; // 수정 후 목록 cache를 갱신할 부모 폴더 ID
  onEditingEnd: () => void; // 저장 또는 취소 후 편집 상태를 종료하는 callback
}

/*
함수 이름 : EditableFolderCard
기능 : 폴더 이름 입력 상태를 관리하고 Enter, blur, Escape 이벤트에 따라 이름 저장 또는 편집 취소를 처리한다.
인자 : EditableFolderCardProps
반환값 : 이름을 인라인으로 수정할 수 있는 폴더 카드 UI
*/
export function EditableFolderCard({
  folder,
  folders,
  folderParentId,
  onEditingEnd,
}: EditableFolderCardProps) {
  const [name, setName] = useState(folder.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);
  const isCancellingRef = useRef(false);
  const { getFolderNameError, isUpdatingFolder, updateFolder } =
    useUpdateFolder({
      folders,
      folderParentId,
    });

  /*
  새 폴더가 편집 카드로 전환되면 기본 이름을 바로 덮어쓸 수 있도록 입력값 전체를 선택한다.
  */
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  /*
  현재 입력값을 검증한 뒤 폴더 이름 수정 요청을 보낸다.
  검증 또는 요청이 실패하면 편집 상태를 유지하고 입력창으로 focus를 되돌린다.
  */
  const commitName = useCallback(async () => {
    if (isCommittingRef.current || isCancellingRef.current) return;

    const trimmedName = name.trim();

    if (trimmedName === folder.name) {
      onEditingEnd();
      return;
    }

    const validationError = getFolderNameError({
      folderId: folder.id,
      name,
    });

    if (validationError) {
      setErrorMessage(validationError);
      focusInput();
      return;
    }

    isCommittingRef.current = true; // Enter와 blur가 연속으로 발생해도 요청은 한 번만 보낸다.
    setErrorMessage(null);

    const isUpdated = await updateFolder({
      folderId: folder.id,
      name,
    });

    isCommittingRef.current = false;

    if (isUpdated) {
      onEditingEnd();
      return;
    }

    focusInput();
  }, [
    focusInput,
    folder.id,
    folder.name,
    getFolderNameError,
    name,
    onEditingEnd,
    updateFolder,
  ]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setErrorMessage(null);
  }, []);

  const handleBlur = useCallback(() => {
    void commitName();
  }, [commitName]);

  /*
  Escape는 서버 요청 없이 최초 이름으로 복원하고, Enter는 한글 조합이 끝난 경우에만 저장한다.
  */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        isCancellingRef.current = true; // 편집 종료 과정에서 발생하는 blur 저장을 막는다.
        setName(folder.name);
        setErrorMessage(null);
        onEditingEnd();
        return;
      }

      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

      event.preventDefault();
      void commitName();
    },
    [commitName, folder.name, onEditingEnd],
  );

  return (
    <article className="flex min-h-36 flex-col justify-between rounded-xl border border-indigo-200 bg-white p-5 shadow-sm ring-2 ring-indigo-100">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50"
        aria-hidden="true"
      >
        <span className="relative block h-4 w-5 rounded-[3px] bg-indigo-600 before:absolute before:-top-1 before:left-0 before:h-1.5 before:w-2.5 before:rounded-t-[2px] before:bg-indigo-600" />
      </div>

      <div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          aria-label="폴더 이름"
          aria-invalid={errorMessage !== null}
          aria-describedby={
            errorMessage ? `folder-name-error-${folder.id}` : undefined
          }
          disabled={isUpdatingFolder}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-indigo-400 bg-white px-2 py-1 text-base font-semibold leading-snug text-slate-800 outline-none ring-2 ring-indigo-100 disabled:cursor-wait disabled:bg-slate-50"
        />
        {errorMessage ? (
          <p
            id={`folder-name-error-${folder.id}`}
            role="alert"
            className="mt-1 text-xs font-medium text-red-600"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}
