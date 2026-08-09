import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";
import { useUpdateNodeName } from "@/src/features/tree-editor/model/actions/update-node-name/useUpdateNodeName";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";

export function CustomNode({
  id,
  data,
  parentId,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomEditorNode>) {
  const isRoot = parentId === null;

  const treeId = useTreeStore((state) => state.treeId);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.label);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);
  const isCancellingRef = useRef(false);

  const { getNodeNameError, updateNodeName, isUpdatingNodeName } =
    useUpdateNodeName({ treeId: treeId ?? "", nodeId: id });

  /*
  편집을 시작하면 기존 제목을 바로 덮어쓸 수 있도록 입력값 전체를 선택한다.
  */
  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const startEditing = useCallback(() => {
    if (!treeId) return;

    setName(data.label);
    setErrorMessage(null);
    setIsEditing(true);
  }, [data.label, treeId]);

  const endEditing = useCallback(() => {
    setIsEditing(false);
    setErrorMessage(null);
    isCancellingRef.current = false;
  }, []);

  /*
  현재 입력값을 검증한 뒤 제목 수정을 요청한다.
  검증이나 요청이 실패하면 편집 상태를 유지하고 입력창으로 focus를 되돌린다.
  */
  const commitName = useCallback(async () => {
    if (isCommittingRef.current || isCancellingRef.current) return;

    const validationError = getNodeNameError(name);

    if (validationError) {
      setErrorMessage(validationError);
      focusInput();
      return;
    }

    isCommittingRef.current = true; // Enter와 blur가 연속으로 발생해도 요청은 한 번만 보낸다.
    setErrorMessage(null);

    const isUpdated = await updateNodeName(name);

    isCommittingRef.current = false;

    if (isUpdated) {
      endEditing();
      return;
    }

    setErrorMessage("제목을 저장하지 못했습니다. 다시 시도해 주세요.");
    focusInput();
  }, [endEditing, focusInput, getNodeNameError, name, updateNodeName]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setErrorMessage(null);
  }, []);

  const handleBlur = useCallback(() => {
    void commitName();
  }, [commitName]);

  /*
  Escape는 서버 요청 없이 원래 제목으로 되돌리고, Enter는 한글 조합이 끝난 경우에만 저장한다.
  나머지 키는 React Flow의 노드 삭제·이동 단축키로 넘어가지 않도록 여기서 막는다.
  */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();

      if (event.key === "Escape") {
        event.preventDefault();
        isCancellingRef.current = true; // 편집 종료 과정에서 발생하는 blur 저장을 막는다.
        setName(data.label);
        endEditing();
        return;
      }

      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

      event.preventDefault();
      void commitName();
    },
    [commitName, data.label, endEditing],
  );

  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        id="input"
        style={{ visibility: isRoot ? "hidden" : "visible" }}
      />

      {isEditing ? (
        <div className="flex flex-col items-stretch gap-1">
          <input
            ref={inputRef}
            type="text"
            value={name}
            aria-label="노드 제목"
            aria-invalid={errorMessage !== null}
            aria-describedby={
              errorMessage ? `node-name-error-${id}` : undefined
            }
            disabled={isUpdatingNodeName}
            onBlur={handleBlur}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="nodrag nopan w-full rounded border border-indigo-400 bg-white px-1 py-0.5 text-center text-xs text-slate-800 outline-none disabled:cursor-wait disabled:bg-slate-50"
          />
          {errorMessage ? (
            <p
              id={`node-name-error-${id}`}
              role="alert"
              className="max-w-40 text-[10px] leading-tight font-medium text-red-600"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <label htmlFor="text" onDoubleClick={startEditing}>
          {data.label}
        </label>
      )}

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        id="output"
      />
    </div>
  );
}
