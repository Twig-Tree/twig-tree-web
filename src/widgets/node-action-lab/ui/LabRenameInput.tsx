import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useInternalNode, useStore } from "@xyflow/react";
import { type CustomEditorNode } from "@/src/features/tree-editor";

type LabRenameInputProps = {
  clientId: string; // 이름을 바꿀 노드의 편집기 노드 ID
  initialName: string; // 입력창을 열 때 채울 지금 이름
  onCommit: (name: string) => string | null; // 저장한다. 검사에 걸리면 안내 문구를 돌려준다
  onCancel: () => void; // 저장하지 않고 닫는다
};

/*
함수 이름 : LabRenameInput
기능 : 노드 위에 이름 입력창을 겹쳐 띄운다. Enter와 focus 이탈은 저장, Escape는 취소다. 검사에 걸리면 닫지 않고 안내 문구를 보여 준다.
인자 : LabRenameInputProps
반환값 : 노드 가운데에 놓인 이름 입력창

제품 노드의 편집 상태는 CustomNode 안에 있어 메뉴·단축키·버튼에서 시작할 수 없고, 저장은 서버 요청이라 실험실 트리에서는 실패한다.
그래서 실험실은 노드 위에 입력창을 따로 겹친다.

캔버스를 축소해도 입력창은 줄이지 않는다. 캔버스 좌표(ViewportPortal)에 두면 노드와 함께 줄어, 최소 배율(0.3)에서는 입력창이
몇 픽셀로 작아져 열린 줄 모른다. 노드 옆 버튼(NodeToolbar)처럼 화면 좌표로 옮겨 그리고, 확대했을 때만 노드 크기를 따른다.
*/
export function LabRenameInput({
  clientId,
  initialName,
  onCommit,
  onCancel,
}: LabRenameInputProps) {
  const internalNode = useInternalNode<CustomEditorNode>(clientId);
  const [translateX, translateY, zoom] = useStore((state) => state.transform);
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

    if (nextErrorMessage === null) {
      isClosingRef.current = true;
      return;
    }

    /*
    다른 곳을 눌러 저장하다 검사에 걸리면 입력창은 남지만 focus는 떠난다. 고칠 자리로 돌려준다. 제품 노드의 이름 편집과 같다.
    누른 곳이 focus를 가져간 뒤에 돌려줘야 하므로 다음 프레임에 옮긴다.
    */
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return; // 한글을 조합하는 중의 Enter·Escape는 조합을 끝내는 키다

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
  const { width, height } = internalNode.measured;
  const scale = Math.max(zoom, 1); // 축소할 때는 원래 크기, 확대할 때는 노드와 같은 크기로 그린다

  return (
    <div
      style={{
        left: translateX + (x + width / 2) * zoom,
        top: translateY + (y + height / 2) * zoom,
        width: width * scale,
        minHeight: height * scale,
      }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col justify-center gap-1 rounded-node border-2 border-accent bg-surface px-2 py-1 shadow-overlay"
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
  );
}
