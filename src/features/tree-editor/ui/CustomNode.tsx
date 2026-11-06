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
import { useHighlightStore } from "@/src/features/tree-editor/model/highlight/highlightStore";
import {
  getCurrentLectureScene,
  useLectureStore,
} from "@/src/features/tree-editor/model/lecture/lectureStore";
import {
  isLectureNodeDimmed,
  isLectureNodeHighlighted,
  isLectureNodePulsing,
  useLectureAnimationStore,
} from "@/src/features/tree-editor/model/lecture/lectureAnimationStore";
import { CollapseToggleButton } from "./CollapseToggleButton";

export function CustomNode({
  id,
  data,
  targetPosition,
  sourcePosition,
  isConnectable,
}: NodeProps<CustomEditorNode>) {
  const treeId = useTreeStore((state) => state.treeId);

  /*
  트리 구조는 React Flow의 parentId가 아니라 엣지로 표현하므로, 들어오는 엣지가 없는 노드가 루트다.
  */
  const isRoot = useTreeStore(
    (state) => !state.edges.some((edge) => edge.target === id),
  );

  /*
  셀렉터가 boolean을 돌려주므로, 강조 집합이 바뀌어도 이 노드의 강조 여부가 같으면 다시 그려지지 않는다.
  */
  const isHighlighted = useHighlightStore((state) =>
    state.highlightedClientIds.has(id),
  );

  /*
  강의가 지금 설명하는 노드인지. 검색·태그 강조와 따로 표시해 강의 중에 검색해도 서로 지우지 않는다.
  */
  const isLectureCurrent = useLectureStore(
    (state) => getCurrentLectureScene(state)?.clientId === id,
  );
  const isLectureHighlighted = useLectureAnimationStore((state) =>
    isLectureNodeHighlighted(state, id),
  );
  const isLecturePulsing = useLectureAnimationStore((state) =>
    isLectureNodePulsing(state, id),
  );
  const isLectureDimmed = useLectureAnimationStore((state) =>
    isLectureNodeDimmed(state, id),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.label);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);
  const isCancellingRef = useRef(false);

  const { getNodeNameError, updateNodeName, isUpdatingNodeName } =
    useUpdateNodeName({
      treeId: treeId ?? "",
      clientId: id,
      serverId: data.serverId,
    });

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

  /*
  더블클릭 외에 키보드로도 편집을 시작할 수 있게 한다.
  Enter와 Space는 React Flow의 노드 선택 단축키와 겹치므로 전파를 막는다.
  */
  const handleTitleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      event.stopPropagation();
      startEditing();
    },
    [startEditing],
  );

  /*
  테두리는 React Flow가 감싸는 .react-flow__node가 그리므로, 강조 여부를 속성으로만 알리고 스타일은 xy-theme.css가 바깥 요소에 입힌다.
  */
  /*
  Handle은 isConnectable을 받지 않으면 true로 두므로, ReactFlow의 nodesConnectable이 핸들까지 닿도록 그대로 넘긴다.
  */
  return (
    <div
      className="custom-node"
      data-root={isRoot}
      data-highlighted={isHighlighted}
      data-lecture-current={isLectureCurrent}
      data-lecture-highlighted={isLectureHighlighted}
      data-lecture-pulsing={isLecturePulsing}
      data-lecture-dimmed={isLectureDimmed}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        id="input"
        isConnectable={isConnectable}
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
            className="nodrag nopan w-full rounded-control border border-accent/50 bg-node-content/7 px-1 py-0.5 text-center text-xs text-node-content outline-none disabled:cursor-wait disabled:bg-node-content/4"
          />
          {errorMessage ? (
            <p
              id={`node-name-error-${id}`}
              role="alert"
              className="max-w-40 text-[10px] leading-tight font-medium text-danger"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          aria-label={`노드 제목 ${data.label} 편집`}
          onDoubleClick={startEditing}
          onKeyDown={handleTitleKeyDown}
          className="nodrag cursor-text"
        >
          {data.label}
        </button>
      )}

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        id="output"
        isConnectable={isConnectable}
      />

      <CollapseToggleButton clientId={id} serverId={data.serverId} />
    </div>
  );
}
