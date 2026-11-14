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

export interface CoachmarkStep {
  current: number; // 지금 단계. 1부터 센다
  total: number; // 전체 단계 수
}

export interface CoachmarkCardProps {
  title?: ReactNode; // 안내 제목. 생략하면 본문만 그린다
  children: ReactNode; // 안내 문구
  onDismiss: () => void; // 닫기 버튼, Escape, 마지막 단계의 완료 버튼으로 안내를 닫을 때 부른다
  step?: CoachmarkStep; // 여러 단계로 이어지는 안내의 지금 위치. 생략하면 번호와 이동 버튼을 그리지 않는다
  onPrevious?: () => void; // 이전 단계로 갈 때 부른다. 첫 단계에서는 넘기지 않는다
  onNext?: () => void; // 다음 단계로 갈 때 부른다. 마지막 단계에서는 넘기지 않으며, 그러면 완료 버튼을 그린다
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
카드 본문은 클릭을 아래로 흘려보내고 버튼만 받는다. 안내가 가리키는 노드나 입력창을 덮어도 그 자리를 그대로 누를 수 있다.

step을 받으면 제목 위에 번호를, 아래에 이전·다음 버튼을 그린다. 마지막 단계에서는 다음 자리에 완료가 오고, 완료는 닫기와 같다.
다음과 완료는 같은 버튼 요소라, 다음을 눌러 마지막 단계에 와도 focus가 그 자리에 남는다.
단계마다 문구 길이가 달라도 버튼이 같은 자리에 오도록 폭과 문구 높이를 고정한다. 다음을 연달아 누르는 마우스가 빗나가지 않게 하기 위해서다.
버튼 줄은 빈 곳도 클릭을 받는다. 버튼을 살짝 빗나간 클릭이 아래 노드를 누르지 않게 한다.
*/
export function CoachmarkCard({
  title,
  children,
  onDismiss,
  step,
  onPrevious,
  onNext,
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
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

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

  /*
  두 번째 단계에서 이전을 누르면 첫 단계에는 이전 버튼이 없어 focus가 갈 곳을 잃는다. 다음 버튼으로 옮긴다.
  버튼이 사라지는 것은 상위가 단계를 바꿔 다시 그린 뒤이므로 다음 프레임에 옮긴다.
  */
  const handlePrevious = () => {
    if (!onPrevious) return;

    const isLeavingSecondStep = step?.current === 2;
    onPrevious();

    if (isLeavingSecondStep) {
      window.requestAnimationFrame(() => primaryButtonRef.current?.focus());
    }
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
      className={`pointer-events-none relative ${step ? "w-[min(18rem,calc(100vw-2rem))]" : "w-max max-w-[min(18rem,calc(100vw-2rem))]"} rounded-card bg-inverse px-3.5 py-2.5 text-sm text-on-inverse shadow-overlay ${className ?? ""}`}
    >
      {/*
      닫기 버튼은 오른쪽 위 모서리에 띄우고, 맨 위 한 줄만 그 자리를 비운다. 아래 줄은 카드 폭을 다 쓴다.
      맨 위 줄은 단계 안내면 번호, 아니면 제목이다. 둘 다 없으면 문구 전체가 자리를 비운다.
      버튼은 DOM에서는 맨 뒤에 두어 Tab이 이전·다음을 먼저 지나게 한다.
      */}
      <div className="py-0.5 break-keep">
        {step ? (
          <p className="mb-1 pr-6 text-xs opacity-70">
            <span aria-hidden>
              {step.current}/{step.total}
            </span>
            {/*
            "1/4"를 그대로 읽으면 "4분의 1"로 들린다.
            */}
            <span className="sr-only">
              {step.total}단계 중 {step.current}단계
            </span>
          </p>
        ) : null}
        {title ? (
          <p className={`${step ? "" : "pr-6"} font-semibold leading-snug`}>
            {title}
          </p>
        ) : null}
        <p
          className={`${title ? "mt-1" : ""} ${title || step ? "" : "pr-6"} ${step ? "min-h-[2lh]" : ""} leading-relaxed opacity-90`}
        >
          {children}
        </p>

        {step ? (
          <div className="pointer-events-auto mt-3 flex justify-end gap-1">
            {onPrevious ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="pointer-events-auto h-7 rounded-control px-2.5 text-xs font-semibold opacity-80 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-focus"
              >
                이전
              </button>
            ) : null}
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={(event) => {
                if (onNext) {
                  onNext();
                  return;
                }

                const card =
                  event.currentTarget.closest<HTMLElement>('[role="note"]');
                if (card) dismiss(card);
              }}
              className="pointer-events-auto h-7 rounded-control bg-accent px-3 text-xs font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {onNext ? "다음" : "완료"}
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="안내 닫기"
        onClick={(event) => {
          const card =
            event.currentTarget.closest<HTMLElement>('[role="note"]');
          if (card) dismiss(card);
        }}
        className="pointer-events-auto absolute top-2 right-2 flex size-6 items-center justify-center rounded-control opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-focus"
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
