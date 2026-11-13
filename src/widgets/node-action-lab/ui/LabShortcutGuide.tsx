import { type FocusEvent, type KeyboardEvent, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NODE_ACTION_IDS, NODE_ACTION_LABELS } from "../model/nodeActions";
import {
  type NodeActionShortcuts,
  type ShortcutPlatform,
} from "../model/shortcuts";

type LabShortcutGuideProps = {
  shortcuts: NodeActionShortcuts;
  platform: ShortcutPlatform; // 목록 제목에 어느 운영체제의 표인지 적는다
  showToolbarEntry: boolean; // 선택한 노드에 버튼이 붙으면 Tab으로 들어가는 것도 적는다
  onClose: () => void;
};

/*
함수 이름 : LabShortcutGuide
기능 : 노드 동작 단축키 전체를 목록으로 보여 준다. 열리면 닫기 버튼에 focus를 두고, Escape나 닫기 버튼으로 닫으면 열기 전 자리로 focus를 돌려준다.
인자 : LabShortcutGuideProps
반환값 : 단축키 안내 대화상자

단축키를 막지 않는 참고 패널이라 data-non-blocking을 단다. ?로 열고 닫는 일은 useLabShortcuts가 focus 위치와 관계없이 맡는다.
focus는 닫힐 때 안내 안에 있었을 때만 돌려준다. 설정 패널에서 안내를 꺼서 닫히면 focus가 방금 누른 설정에 있으므로 빼앗지 않는다.
*/
export function LabShortcutGuide({
  shortcuts,
  platform,
  showToolbarEntry,
  onClose,
}: LabShortcutGuideProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasFocusRef = useRef(false); // 안내 안에 focus가 있는지. 요소가 사라질 때는 blur가 오지 않을 수 있어 직접 기억한다

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    return () => {
      if (hasFocusRef.current && previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    onClose();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    hasFocusRef.current = false;
  };

  const rows = [
    ...NODE_ACTION_IDS.map((actionId) => ({
      label: NODE_ACTION_LABELS[actionId],
      keys: shortcuts[actionId].label,
    })),
    { label: "선택 해제", keys: "Esc" },
    { label: "단축키 안내 열고 닫기", keys: "?" },
    ...(showToolbarEntry
      ? [{ label: "노드 옆 버튼으로 이동", keys: "Tab" }]
      : []),
  ];

  return (
    <div
      role="dialog"
      aria-labelledby="node-action-lab-shortcut-guide"
      data-non-blocking
      onKeyDown={handleKeyDown}
      onFocus={() => {
        hasFocusRef.current = true;
      }}
      onBlur={handleBlur}
      className="absolute top-4 right-4 z-20 w-72 rounded-card border border-line bg-surface p-4 shadow-overlay"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          id="node-action-lab-shortcut-guide"
          className="text-sm font-bold text-content"
        >
          단축키 ({platform === "mac" ? "Mac" : "Windows"})
        </h3>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="단축키 안내 닫기"
          onClick={onClose}
          className="rounded-control p-1 text-content-secondary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-content-secondary">{row.label}</dt>
            <dd>
              <kbd className="rounded-control border border-line px-1.5 py-0.5 font-sans text-xs text-content">
                {row.keys}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-content-muted">
        노드를 하나 선택했을 때 동작합니다.
      </p>
    </div>
  );
}
