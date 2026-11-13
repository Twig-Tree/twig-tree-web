import { Pencil } from "lucide-react";
import { useCallback, useRef } from "react";
import { getNodeActionBlockReason } from "../lib/node-action/getNodeActionBlockReason";
import {
  type NodeNameEditingEndReason,
  useNodeNameInput,
} from "../model/actions/update-node-name/useNodeNameInput";
import { useIsLectureActive } from "../model/lecture/lectureStore";
import { useEditingStore } from "../model/sync/editingStore";
import type { CustomEditorNode } from "../model/types";

const LECTURE_BLOCK_REASON = "강의 중에는 이름을 바꿀 수 없습니다.";

type MemoPanelNodeNameProps = {
  treeId: string; // 노드가 속한 트리 ID
  node: CustomEditorNode; // 메모 패널이 보여 주는 노드
};

/*
함수 이름 : MemoPanelNodeName
기능 : 메모 패널 제목으로 노드 이름을 보여 주고, 제목을 누르면 그 자리에서 이름을 바꾸게 한다.
인자 : MemoPanelNodeNameProps
반환값 : 메모 패널 머리의 노드 이름 제목 또는 이름 입력창

입력·검증·저장·충돌 처리는 캔버스 노드와 같은 useNodeNameInput이 맡는다. 노드를 바꾸면 입력을 버리도록 호출부가 노드 ID를 key로 준다.
노드 아래 버튼처럼 막힌 때는 누르기 전에 이유를 보여 준다. 누른 뒤에 알게 되면 저장 전 노드는 저장할 때 alert이 뜬다.
*/
export const MemoPanelNodeName = ({ treeId, node }: MemoPanelNodeNameProps) => {
  const titleButtonRef = useRef<HTMLButtonElement>(null);
  const isLectureActive = useIsLectureActive();

  /*
  셀렉터가 문자열을 돌려주므로 다른 노드의 입력창이 열리고 닫혀도 다시 그려지지 않는다.
  패널 자신이 연 입력창은 제목 버튼 대신 입력창이 보이므로 막힘 이유로 쓰지 않는다.
  */
  const isEditingInCanvas = useEditingStore(
    (state) => state.nameEditors.get(node.id) === "canvas",
  );

  /*
  WorkspaceHeader와 같다. Enter나 Escape로 끝나면 focus를 가진 입력창이 사라져 focus가 문서 처음으로 떨어지므로 제목 버튼으로 되돌린다.
  blur로 끝났다면 사용자가 다른 곳으로 옮긴 것이므로 되돌리지 않는다. Enter 저장은 요청이 끝난 뒤에 끝나므로,
  그 사이 사용자가 다른 요소로 focus를 옮겼다면 그대로 둔다.
  */
  const handleEditingEnd = useCallback((reason: NodeNameEditingEndReason) => {
    if (reason === "blur") return;

    requestAnimationFrame(() => {
      const { activeElement } = document;

      if (activeElement === null || activeElement === document.body) {
        titleButtonRef.current?.focus();
      }
    });
  }, []);

  const {
    inputRef,
    isEditing,
    name,
    errorMessage,
    isUpdatingNodeName,
    startEditing,
    handleBlur,
    handleChange,
    handleKeyDown,
  } = useNodeNameInput({
    treeId,
    clientId: node.id,
    serverId: node.data.serverId,
    label: node.data.label,
    location: "panel",
    onEditingEnd: handleEditingEnd,
  });

  /*
  루트 여부와 요청 중 여부는 이름 편집을 막지 않으므로 넘기지 않는다.
  */
  const blockReason = isLectureActive
    ? LECTURE_BLOCK_REASON
    : getNodeActionBlockReason({
        actionId: "rename",
        isRoot: false,
        isSaved: node.data.serverId !== null,
        isMutating: false,
        nameEditorLocation: isEditingInCanvas ? "canvas" : null,
      });

  const errorId = `memo-panel-node-name-error-${node.id}`;
  const descriptionId = `memo-panel-node-name-description-${node.id}`;

  /*
  편집 중에도 제목은 화면 구조에 남긴다. 입력창으로 바뀌는 동안 패널의 h2가 사라지지 않게 한다.
  패널 머리는 높이가 고정된 줄이라 오류 문구를 아래에 이어 그리면 머리가 늘어나 메모 입력이 밀린다. 문구는 입력창 아래에 겹쳐 띄운다.
  */
  if (isEditing) {
    return (
      <>
        <h2 className="sr-only">{node.data.label}</h2>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={name}
            aria-label="노드 이름"
            aria-invalid={errorMessage !== null}
            aria-describedby={errorMessage ? errorId : undefined}
            disabled={isUpdatingNodeName}
            onBlur={handleBlur}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="-ml-2 w-full rounded-control border border-accent bg-surface px-2 py-0.5 text-lg leading-7 font-semibold text-content ring-2 ring-accent-subtle outline-none disabled:cursor-wait disabled:bg-surface-muted"
          />
          {errorMessage ? (
            <p
              id={errorId}
              role="alert"
              className="absolute top-full left-0 z-20 mt-2 -ml-2 rounded-control border border-danger-line bg-danger-subtle px-2 py-1 text-xs font-medium text-danger shadow-overlay"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  /*
  제목의 이름은 노드 이름 그대로 읽히게 두고, 바꿀 수 있다는 사실이나 막힌 이유는 설명으로 덧붙인다.
  설명을 h2 안에 두면 h2의 이름에 함께 붙으므로 h2 밖에 둔다(WorkspaceHeader와 같다).
  disabled 대신 aria-disabled를 쓰는 이유는 노드 아래 버튼과 같다. 비활성 버튼은 focus를 받지 못해 키보드 사용자가 막힌 이유를 들을 수 없다.
  */
  return (
    <div className="group relative -ml-2 min-w-0">
      <h2 className="flex max-w-full text-lg font-semibold text-content">
        <button
          ref={titleButtonRef}
          type="button"
          aria-disabled={blockReason !== null || undefined}
          aria-describedby={descriptionId}
          onClick={() => {
            if (blockReason === null) startEditing();
          }}
          className="flex max-w-full items-center gap-1.5 rounded-control px-2 py-0.5 leading-7 transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent"
        >
          <span className="truncate">{node.data.label}</span>
          {blockReason === null ? (
            <Pencil
              className="size-3.5 shrink-0 text-content-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              aria-hidden="true"
            />
          ) : null}
        </button>
      </h2>

      {blockReason === null ? (
        <span id={descriptionId} className="sr-only">
          눌러서 이름을 바꿉니다.
        </span>
      ) : (
        /*
        노드 아래 버튼의 툴팁과 같은 모양이다. 제목 아래에 띄워 패널 머리 높이를 바꾸지 않는다.
        */
        <span
          id={descriptionId}
          role="tooltip"
          className="pointer-events-none invisible absolute top-full left-2 z-20 mt-1.5 rounded-control bg-inverse px-2 py-1 text-xs whitespace-nowrap text-on-inverse shadow-overlay group-focus-within:visible group-hover:visible"
        >
          {blockReason}
        </span>
      )}
    </div>
  );
};
