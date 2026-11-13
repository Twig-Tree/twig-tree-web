import { type FocusEvent, type KeyboardEvent, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NODE_ACTION_LABELS } from "../constants/nodeActions";
import {
  getNodeActionShortcuts,
  NODE_ACTION_IDS,
} from "../lib/shortcuts/nodeActionShortcuts";
import { useDevicePlatform } from "../model/shortcuts/useDevicePlatform";

type ShortcutGuideProps = {
  onClose: () => void; // 안내를 닫는다. Escape와 닫기 버튼이 부른다
};

/*
함수 이름 : ShortcutGuide
기능 : 이 기기의 노드 동작 단축키 전체를 목록으로 보여 준다. 열리면 닫기 버튼에 focus를 두고,
닫힐 때 안내 안에 focus가 있었으면 열기 전 자리로 돌려준다.
인자 : ShortcutGuideProps
반환값 : 단축키 안내 패널

화면 한쪽에 떠 있는 참고 패널이라 data-non-blocking을 붙여 단축키를 막지 않는다. role="dialog"만 두면 useNodeActionShortcuts가
열린 대화상자로 보고 모든 단축키를 멈춰, 안내를 보며 노드를 눌러 단축키를 써 볼 수 없다. ?로 열고 닫는 일도 그 hook이 맡는다.
focus를 안내 안에 있었을 때만 돌려주는 이유는, 노드를 누른 뒤 ?로 닫으면 focus가 이미 노드에 있어 빼앗으면 안 되기 때문이다.
*/
export function ShortcutGuide({ onClose }: ShortcutGuideProps) {
  const platform = useDevicePlatform();
  const shortcuts = getNodeActionShortcuts(platform);
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
    { label: "노드 아래 버튼으로 이동", keys: "Tab" },
    { label: "단축키 안내 열고 닫기", keys: "?" },
  ];

  return (
    <div
      role="dialog"
      aria-labelledby="shortcut-guide-title"
      data-non-blocking
      onKeyDown={handleKeyDown}
      onFocus={() => {
        hasFocusRef.current = true;
      }}
      onBlur={handleBlur}
      className="absolute top-16 right-4 z-20 w-72 max-w-[calc(100%-2rem)] rounded-card border border-line bg-surface p-4 shadow-overlay"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="shortcut-guide-title"
          className="text-sm font-bold text-content"
        >
          단축키 ({platform === "mac" ? "Mac" : "Windows"})
        </h2>
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
          <div
            key={row.label}
            className="flex items-center justify-between gap-3"
          >
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
