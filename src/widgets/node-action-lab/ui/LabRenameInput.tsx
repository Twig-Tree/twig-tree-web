import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useInternalNode, ViewportPortal } from "@xyflow/react";
import { type CustomEditorNode } from "@/src/features/tree-editor";

type LabRenameInputProps = {
  clientId: string; // 이름을 바꿀 노드의 편집기 노드 ID
  initialName: string; // 입력창을 열 때 채울 지금 이름
  onCommit: (name: string) => string | null; // 저장한다. 검사에 걸리면 안내 문구를 돌려준다
  onCancel: () => void; // 저장하지 않고 닫는다
};

/*
함수 이름 : LabRenameInput
기능 : 노드 위에 같은 크기의 이름 입력창을 겹쳐 띄운다. Enter와 focus 이탈은 저장, Escape는 취소다. 검사에 걸리면 닫지 않고 안내 문구를 보여 준다.
인자 : LabRenameInputProps
반환값 : 캔버스 좌표에 놓인 이름 입력창

제품 노드의 편집 상태는 CustomNode 안에 있어 메뉴·단축키·버튼에서 시작할 수 없고, 저장은 서버 요청이라 실험실 트리에서는 실패한다.
그래서 실험실은 노드 위에 입력창을 따로 겹친다. ViewportPortal 안은 캔버스 좌표를 따르므로 확대·이동해도 노드에 붙어 있다.
*/
export function LabRenameInput({
  clientId,
  initialName,
  onCommit,
  onCancel,
}: LabRenameInputProps) {
  const internalNode = useInternalNode<CustomEditorNode>(clientId);
  const [name, setName] = useState(initialName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isClosingRef = useRef(false); // Escape로 닫을 때 뒤따르는 blur가 저장하지 않게 막는다

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    if (isClosingRef.current) return;

    const nextErrorMessage = onCommit(name);
    setErrorMessage(nextErrorMessage);

    if (nextErrorMessage === null) isClosingRef.current = true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      isClosingRef.current = true;
      onCancel();
    }
  };

  if (!internalNode?.measured.width || !internalNode.measured.height) {
    return null;
  }

  const { x, y } = internalNode.internals.positionAbsolute;

  return (
    <ViewportPortal>
      <div
        style={{
          transform: `translate(${x}px, ${y}px)`,
          width: internalNode.measured.width,
          minHeight: internalNode.measured.height,
          pointerEvents: "all",
        }}
        className="nodrag nopan absolute top-0 left-0 z-10 flex flex-col justify-center gap-1 rounded-node border-2 border-accent bg-surface px-2 py-1 shadow-overlay"
      >
        <input
          ref={inputRef}
          type="text"
          value={name}
          aria-label="노드 이름"
          aria-invalid={errorMessage !== null}
          aria-describedby={
            errorMessage ? `lab-rename-error-${clientId}` : undefined
          }
          onChange={(event) => {
            setName(event.target.value);
            setErrorMessage(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          className="w-full rounded-control border border-line bg-surface px-1.5 py-1 text-center text-sm text-content outline-none focus-visible:border-accent"
        />
        {errorMessage ? (
          <p
            id={`lab-rename-error-${clientId}`}
            role="alert"
            className="text-[10px] leading-tight font-medium text-danger"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </ViewportPortal>
  );
}
