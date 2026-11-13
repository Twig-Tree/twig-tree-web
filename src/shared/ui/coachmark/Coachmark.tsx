"use client";

import {
  arrow,
  autoUpdate,
  flip,
  hide,
  offset,
  shift,
  useFloating,
  type Middleware,
  type Placement,
  type Side,
} from "@floating-ui/react-dom";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CoachmarkCard,
  type CoachmarkSide,
  type CoachmarkStep,
} from "./CoachmarkCard";

/*
기준 요소와 카드 사이 간격(px). 꼬리가 반쯤 내민 만큼을 더한다.
*/
const ANCHOR_GAP = 10;

/*
카드가 화면 가장자리에 붙지 않게 남기는 여백(px). 카드 최대 폭의 calc(100vw - 2rem)과 맞춘다.
*/
const VIEWPORT_PADDING = 16;

/*
꼬리가 카드 모서리의 둥근 부분까지 가지 않게 남기는 여백(px)
*/
const ARROW_PADDING = 12;

/*
꼬리 한 변의 길이(px). CoachmarkCard의 꼬리 size-2와 맞춘다.
*/
const ARROW_SIZE = 8;

/*
useFloating은 middleware를 options로 비교해 같으면 이전 것을 그대로 쓴다. 요소를 options에 그대로 넣으면 비교가
React가 요소에 붙인 내부 속성까지 따라 들어가므로, 요소마다 번호를 붙여 번호로 비교하게 한다.
*/
const elementKeys = new WeakMap<HTMLElement, number>();
let nextElementKey = 0;

const getElementKey = (element: HTMLElement): number => {
  const key = elementKeys.get(element) ?? (nextElementKey += 1);
  elementKeys.set(element, key);
  return key;
};

/*
함수 이름 : getArrowToTargetMiddleware
기능 : 카드는 기준 요소에 맞춰 둔 채, 꼬리만 다른 요소의 가운데를 가리키게 한다. 카드 모서리까지는 가지 않게 막는다.
인자 : HTMLElement target -> 꼬리가 가리킬 요소
반환값 : 꼬리 위치를 middlewareData.arrowToTarget에 담는 middleware
*/
const getArrowToTargetMiddleware = (target: HTMLElement): Middleware => ({
  name: "arrowToTarget",
  options: { targetKey: getElementKey(target) },
  fn: ({ x, y, placement, rects, elements }) => {
    const side = placement.split("-")[0] as Side;
    const targetRect = target.getBoundingClientRect();
    const referenceRect = elements.reference.getBoundingClientRect();
    const isHorizontalEdge = side === "top" || side === "bottom";

    /*
    기준 요소를 거쳐 재므로 화면 좌표와 카드 좌표의 기준이 달라도 맞는다.
    */
    const targetCenter = isHorizontalEdge
      ? targetRect.left +
        targetRect.width / 2 -
        referenceRect.left +
        rects.reference.x -
        x
      : targetRect.top +
        targetRect.height / 2 -
        referenceRect.top +
        rects.reference.y -
        y;
    const length = isHorizontalEdge
      ? rects.floating.width
      : rects.floating.height;
    const position = Math.min(
      Math.max(targetCenter - ARROW_SIZE / 2, ARROW_PADDING),
      length - ARROW_PADDING - ARROW_SIZE,
    );

    return { data: isHorizontalEdge ? { x: position } : { y: position } };
  },
});

/*
카드가 기준 요소의 어느 쪽에 놓이는지와 꼬리가 붙는 카드의 변은 반대다. 위에 놓인 카드는 아랫변에서 기준 요소를 가리킨다.
*/
const ARROW_SIDE_BY_PLACEMENT: Record<Side, CoachmarkSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

interface CoachmarkProps {
  anchor: HTMLElement | null; // 카드를 맞출 요소. null이면 그리지 않는다
  arrowTarget?: HTMLElement | null; // 꼬리가 가리킬 요소. 생략하면 anchor. 여러 요소를 차례로 가리킬 때 카드는 제자리에 두고 꼬리만 옮긴다
  title?: ReactNode; // 안내 제목. 생략하면 본문만 그린다
  children: ReactNode; // 안내 문구
  onDismiss: () => void; // 안내를 닫을 때 부른다
  step?: CoachmarkStep; // 여러 단계로 이어지는 안내의 지금 위치. CoachmarkCard에 그대로 넘긴다
  onPrevious?: () => void; // 이전 단계로 갈 때 부른다. 첫 단계에서는 넘기지 않는다
  onNext?: () => void; // 다음 단계로 갈 때 부른다. 마지막 단계에서는 넘기지 않는다
  placement?: Placement; // 기준 요소의 어느 쪽과 정렬에 띄울지. 자리가 모자라면 반대쪽으로 뒤집는다. 생략하면 위
  container?: HTMLElement | null; // 카드를 그릴 요소이자 카드가 벗어나지 않을 영역. 생략하면 body와 화면 전체
}

export type CoachmarkPlacement = Placement;

/*
함수 이름 : Coachmark
기능 : 기준 요소 옆에 안내 카드를 띄운다. 자리가 모자라면 반대쪽으로 뒤집고, 화면 밖으로 나가면 안쪽으로 민다.
스크롤·크기 변화를 따라가고, 기준 요소가 스크롤로 가려지면 카드도 숨긴다.
인자 : CoachmarkProps
반환값 : container에 그린 안내 카드. 기준 요소가 없으면 null

카드는 기본으로 body에 그린다. 기준 요소를 감싼 스크롤 영역의 overflow에 잘리지 않게 하기 위해서다.
container를 넘기면 그 안에 그려 그 영역의 쌓임 순서를 따르고, 뒤집기·밀기도 그 영역 안에서 한다.
캔버스처럼 바깥 패널이 위에 겹쳐 뜨는 영역에서, 기준 요소가 패널에 가려졌는데 카드만 패널 위에 남지 않게 하기 위해서다.
anchor를 ref가 아닌 요소로 받는 이유는 요소가 붙는 시점에 다시 그려야 위치를 계산할 수 있어서다. 호출하는 쪽은 useState의 setter를 ref에 넘긴다.
카드와 꼬리도 같은 이유로 state에 받는다. useFloating의 refs.setFloating을 넘기면 lint가 render 중 ref 접근으로 본다.
*/
export function Coachmark({
  anchor,
  title,
  children,
  onDismiss,
  step,
  onPrevious,
  onNext,
  placement = "top",
  container,
  arrowTarget,
}: CoachmarkProps) {
  const [floatingElement, setFloatingElement] = useState<HTMLElement | null>(
    null,
  );
  const [arrowElement, setArrowElement] = useState<HTMLSpanElement | null>(
    null,
  );

  const {
    floatingStyles,
    placement: resolvedPlacement,
    middlewareData,
    isPositioned,
  } = useFloating({
    elements: { reference: anchor, floating: floatingElement },
    open: anchor !== null, // isPositioned는 open을 넘겨야 켜진다.
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(ANCHOR_GAP),
      flip({ padding: VIEWPORT_PADDING, boundary: container ?? undefined }),
      shift({ padding: VIEWPORT_PADDING, boundary: container ?? undefined }),
      arrowTarget
        ? getArrowToTargetMiddleware(arrowTarget)
        : arrow({ element: arrowElement, padding: ARROW_PADDING }),
      hide(),
    ],
  });

  if (!anchor) return null;

  const side = resolvedPlacement.split("-")[0] as Side; // placement는 "top-start"처럼 정렬이 붙어 올 수 있다.
  const arrowData = arrowTarget
    ? (middlewareData.arrowToTarget as { x?: number; y?: number } | undefined)
    : middlewareData.arrow;
  const isAnchorHidden = middlewareData.hide?.referenceHidden ?? false;

  return createPortal(
    <CoachmarkCard
      ref={setFloatingElement}
      title={title}
      onDismiss={onDismiss}
      step={step}
      onPrevious={onPrevious}
      onNext={onNext}
      arrowSide={ARROW_SIDE_BY_PLACEMENT[side]}
      arrowRef={setArrowElement}
      arrowStyle={
        arrowData
          ? {
              left: arrowData.x,
              top: arrowData.y,
            }
          : undefined
      }
      /*
      위치가 정해지기 전에는 화면 왼쪽 위에 잠깐 그려지므로 숨긴다. 토스트(z-50)보다는 아래에 둔다.
      */
      style={{
        ...floatingStyles,
        visibility: isPositioned && !isAnchorHidden ? "visible" : "hidden",
      }}
      className="z-40"
    >
      {children}
    </CoachmarkCard>,
    container ?? document.body,
  );
}
