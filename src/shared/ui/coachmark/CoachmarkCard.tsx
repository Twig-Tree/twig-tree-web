"use client";

import { X } from "lucide-react";
import {
  useRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

export type CoachmarkSide = "top" | "right" | "bottom" | "left";

export interface CoachmarkCardProps {
  children: ReactNode; // 안내 문구
  onDismiss: () => void; // 닫기 버튼이나 Escape로 안내를 닫을 때 부른다
  arrowSide?: CoachmarkSide; // 꼬리가 붙을 카드의 변. 기준 요소가 있는 쪽이다. 생략하면 꼬리를 그리지 않는다
  arrowRef?: Ref<HTMLSpanElement>; // 꼬리 위치를 계산하는 쪽에 꼬리 요소를 넘긴다
  arrowStyle?: CSSProperties; // 계산된 꼬리 위치. 생략하면 변의 가운데에 둔다
  className?: string; // 카드를 띄우는 쪽이 더할 클래스. 예: React Flow의 nodrag
  style?: CSSProperties; // 카드를 띄우는 쪽이 정한 위치
  ref?: Ref<HTMLDivElement>; // 위치를 계산하는 쪽에 카드 요소를 넘긴다
}

/*
꼬리는 카드와 같은 색의 정사각형을 45도 돌려 변 밖으로 반쯤 내민다.
변을 따라가는 축은 계산된 위치를 받으면 그 값을, 받지 않으면 변의 가운데를 쓴다.
*/
const ARROW_EDGE_CLASS_NAMES: Record<CoachmarkSide, string> = {
  top: "-top-1",
  bottom: "-bottom-1",
  left: "-left-1",
  right: "-right-1",
};

const ARROW_CENTER_CLASS_NAMES: Record<CoachmarkSide, string> = {
  top: "left-1/2 -ml-1",
  bottom: "left-1/2 -ml-1",
  left: "top-1/2 -mt-1",
  right: "top-1/2 -mt-1",
};

/*
함수 이름 : CoachmarkCard
기능 : 기능 소개 문구와 닫기 버튼을 그린다. 위치는 모르고, 띄우는 쪽이 style과 꼬리 위치를 정한다.
인자 : CoachmarkCardProps
반환값 : 안내 카드

화면을 막지 않는 안내라 나타날 때 focus를 옮기지 않고, 모달 대신 note 영역으로 읽힌다. 닫기 버튼은 Tab으로 닿는다.
Escape는 focus가 카드 안에 있을 때만 닫는다. 노드 툴바·메모 패널·모달이 이미 전역에서 Escape를 쓴다.
카드 본문은 클릭을 아래로 흘려보내고 닫기 버튼만 받는다. 안내가 가리키는 노드나 입력창을 덮어도 그 자리를 그대로 누를 수 있다.
*/
export function CoachmarkCard({
  children,
  onDismiss,
  arrowSide,
  arrowRef,
  arrowStyle,
  className,
  style,
  ref,
}: CoachmarkCardProps) {
  /*
  카드로 focus가 들어오기 직전에 focus가 있던 요소. 카드 안에서 닫으면 focus가 body로 떨어지지 않게 여기로 돌려준다.
  */
  const focusOriginRef = useRef<HTMLElement | null>(null);

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const origin = event.relatedTarget;

    if (
      origin instanceof HTMLElement &&
      !event.currentTarget.contains(origin)
    ) {
      focusOriginRef.current = origin;
    }
  };

  /*
  focus가 카드 안에 있을 때만 이전 자리로 돌려준다. 마우스로 닫아 focus가 카드에 들어온 적 없으면 그대로 둔다.
  */
  const dismiss = (card: HTMLElement) => {
    const origin = focusOriginRef.current;

    if (card.contains(document.activeElement) && origin?.isConnected) {
      origin.focus();
    }

    onDismiss();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    event.stopPropagation(); // 같은 Escape로 뒤에 있는 패널이나 노드 선택까지 닫히지 않게 한다.
    dismiss(event.currentTarget);
  };

  return (
    <div
      ref={ref}
      role="note"
      aria-label="기능 안내"
      aria-live="polite"
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      style={style}
      className={`pointer-events-none relative flex w-max max-w-[min(20rem,calc(100vw-2rem))] items-start gap-2 rounded-card bg-inverse py-2.5 pr-2 pl-3.5 text-sm text-on-inverse shadow-overlay ${className ?? ""}`}
    >
      <p className="min-w-0 flex-1 py-0.5 leading-relaxed break-keep">
        {children}
      </p>

      <button
        type="button"
        aria-label="안내 닫기"
        onClick={(event) => {
          const card =
            event.currentTarget.closest<HTMLElement>('[role="note"]');
          if (card) dismiss(card);
        }}
        className="pointer-events-auto flex size-6 shrink-0 items-center justify-center rounded-control opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-focus"
      >
        <X aria-hidden className="size-4" strokeWidth={2} />
      </button>

      {arrowSide ? (
        <span
          ref={arrowRef}
          aria-hidden
          style={arrowStyle}
          className={`absolute size-2 rotate-45 bg-inverse ${ARROW_EDGE_CLASS_NAMES[arrowSide]} ${
            arrowStyle ? "" : ARROW_CENTER_CLASS_NAMES[arrowSide]
          }`}
        />
      ) : null}
    </div>
  );
}
