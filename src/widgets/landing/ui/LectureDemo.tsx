"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  DEMO_CANVAS,
  DEMO_NODE_SIZE,
  DEMO_NODES,
  DEMO_NOTES,
  DEMO_SEQUENCE,
  DEMO_STEP_DURATION_MS,
  getDemoEdgePath,
  type DemoNode,
} from "../model/lectureDemoData";
import { useLectureDemoPlayer } from "../model/useLectureDemoPlayer";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "./icons";
import { Reveal } from "./Reveal";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";

const CAMERA_SCALE = 1.3;
const CAMERA_TRANSITION = { duration: 0.9, ease: [0.65, 0, 0.35, 1] } as const;

const NODE_BY_ID = new Map(DEMO_NODES.map((node) => [node.id, node]));

const EDGES = DEMO_NODES.flatMap((child) => {
  const parent = child.parentId ? NODE_BY_ID.get(child.parentId) : undefined;
  return parent
    ? [{ id: `${parent.id}-${child.id}`, d: getDemoEdgePath(parent, child) }]
    : [];
});

type NodeState = "current" | "visited" | "upcoming";

const NODE_STATE_CLASS: Record<NodeState, string> = {
  current:
    "border-landing-leaf-pale bg-landing-leaf text-landing-ink shadow-landing-glow",
  visited: "border-landing-brand bg-landing-brand text-landing-night-text",
  upcoming:
    "border-landing-night-node-line bg-landing-night-raised text-landing-night-faint",
};

const CONTROL_BUTTON_CLASS = `flex h-11 w-11 items-center justify-center rounded-full border border-landing-night-control text-landing-night-text hover:bg-landing-night-raised disabled:opacity-40 disabled:hover:bg-transparent ${FOCUS_RING_CLASS} focus-visible:outline-landing-leaf`;

/*
함수 이름 : getNodeState
기능 : 강의 순서에서 현재 단계와 비교해 노드를 현재·지나온·남은 노드로 나눈다.
인자 : DemoNode node -> 상태를 정할 노드
number stepIndex -> 현재 강의 단계
반환값 : 노드 상태
*/
const getNodeState = (node: DemoNode, stepIndex: number): NodeState => {
  const sequenceIndex = DEMO_SEQUENCE.indexOf(
    node.id as (typeof DEMO_SEQUENCE)[number],
  );

  if (sequenceIndex === stepIndex) return "current";
  if (sequenceIndex !== -1 && sequenceIndex < stepIndex) return "visited";
  return "upcoming";
};

export function LectureDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.4 });
  const shouldReduceMotion = useReducedMotion();

  /*
  사용자가 직접 멈춘 데모는 화면에 다시 들어와도 자동으로 재생하지 않는다.
  */
  const isPausedByUserRef = useRef(false);

  const {
    stepIndex,
    isPlaying,
    isFirstStep,
    isLastStep,
    goToPrevious,
    goToNext,
    play,
    pause,
  } = useLectureDemoPlayer({
    stepCount: DEMO_SEQUENCE.length,
    stepDurationMs: DEMO_STEP_DURATION_MS,
  });

  /*
  화면에 보일 때만 자동 재생한다. 보이지 않는 곳에서 강의가 넘어가면 돌아왔을 때 흐름을 놓친다.
  움직임을 줄인 사용자에게는 자동 재생을 하지 않는다.
  */
  useEffect(() => {
    if (!isInView) {
      pause();
      return;
    }

    if (!shouldReduceMotion && !isPausedByUserRef.current) play();
  }, [isInView, shouldReduceMotion, play, pause]);

  const handleTogglePlay = () => {
    isPausedByUserRef.current = isPlaying;

    if (isPlaying) pause();
    else play();
  };

  const currentNodeId = DEMO_SEQUENCE[stepIndex];
  const currentNode = NODE_BY_ID.get(currentNodeId);

  /*
  트리 캔버스의 왼쪽 위를 뷰포트 중앙에 두고, 현재 노드의 중심이 그 자리에 오도록 캔버스를 옮긴다.
  */
  const camera = currentNode
    ? {
        x: -CAMERA_SCALE * (currentNode.x + DEMO_NODE_SIZE.width / 2),
        y: -CAMERA_SCALE * (currentNode.y + DEMO_NODE_SIZE.height / 2),
        scale: CAMERA_SCALE,
      }
    : { x: 0, y: 0, scale: CAMERA_SCALE };

  const progressPercent = Math.round(
    ((stepIndex + 1) / DEMO_SEQUENCE.length) * 100,
  );

  return (
    <section
      ref={sectionRef}
      id="lecture"
      className="scroll-mt-4 bg-landing-ink text-landing-on-brand"
    >
      <div className={`${CONTAINER_CLASS} flex flex-col gap-12 py-24 md:py-28`}>
        <Reveal className="flex max-w-[720px] flex-col gap-4">
          <span className="self-start rounded-full bg-landing-leaf px-3 py-1.5 text-[13px] font-bold tracking-[0.06em] text-landing-ink">
            SIGNATURE · 트리 강의
          </span>
          <h2 className="m-0 text-[clamp(36px,6vw,52px)] leading-[1.15] font-extrabold tracking-[-0.035em]">
            트리가 선생님이 됩니다
          </h2>
          <p className="m-0 text-lg leading-[1.7] text-landing-night-muted md:text-[19px]">
            슬라이드를 넘기는 강의가 아니에요. 화면이 노드를 따라 이동하며,
            개념과 개념 사이의 연결까지 해설해 드려요.
          </p>
        </Reveal>

        <Reveal
          delay={0.15}
          className="min-w-0 overflow-hidden rounded-landing-panel border border-landing-night-border bg-landing-night-card"
        >
          {/*
          노드 위치와 카메라 이동은 시각 효과다. 같은 내용은 아래 해설 문단이 전한다.
          */}
          <div
            className="relative h-[420px] w-full overflow-hidden bg-landing-lecture-viewport"
            aria-hidden="true"
          >
            <motion.div
              className="absolute top-1/2 left-1/2"
              style={{
                width: DEMO_CANVAS.width,
                height: DEMO_CANVAS.height,
                originX: 0,
                originY: 0,
              }}
              initial={false}
              animate={camera}
              transition={
                shouldReduceMotion ? { duration: 0 } : CAMERA_TRANSITION
              }
            >
              <svg
                width={DEMO_CANVAS.width}
                height={DEMO_CANVAS.height}
                className="absolute top-0 left-0 stroke-landing-night-edge"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                {EDGES.map(({ id, d }) => (
                  <path key={id} d={d} />
                ))}
              </svg>
              {DEMO_NODES.map((node) => (
                <span
                  key={node.id}
                  className={`absolute box-border rounded-full border-2 text-center text-[15px] leading-9 font-semibold transition-all duration-500 motion-reduce:transition-none ${NODE_STATE_CLASS[getNodeState(node, stepIndex)]}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: DEMO_NODE_SIZE.width,
                    height: DEMO_NODE_SIZE.height,
                  }}
                >
                  {node.label}
                </span>
              ))}
            </motion.div>
            <span className="absolute top-[18px] left-5 text-xs font-semibold tracking-[0.06em] text-landing-night-faint">
              운영체제 · 예시 강의
            </span>
          </div>

          <div className="flex flex-col gap-5 border-t border-landing-night-border px-5 pt-6 pb-7 md:px-7">
            <div className="flex items-start gap-3.5">
              <span className="mt-[3px] shrink-0 rounded-md bg-landing-leaf px-2.5 py-1 text-xs font-bold text-landing-ink">
                해설
              </span>
              <p
                className="m-0 min-h-[58px] text-base leading-[1.7] text-landing-night-text md:text-[17px]"
                aria-live={isPlaying ? "off" : "polite"}
              >
                <span className="sr-only">{currentNode?.label}: </span>
                {DEMO_NOTES[currentNodeId]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={isFirstStep}
                aria-label="이전 노드"
                className={CONTROL_BUTTON_CLASS}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? "일시정지" : "재생"}
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full bg-landing-leaf text-landing-ink hover:bg-landing-leaf-pale ${FOCUS_RING_CLASS} focus-visible:outline-landing-leaf`}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon size={18} />}
              </button>
              <button
                type="button"
                onClick={goToNext}
                disabled={isLastStep}
                aria-label="다음 노드"
                className={CONTROL_BUTTON_CLASS}
              >
                <ChevronRightIcon />
              </button>
              <div
                className="h-1.5 min-w-0 flex-[1_1_160px] overflow-hidden rounded-full bg-landing-night-border"
                role="progressbar"
                aria-label="강의 진행"
                aria-valuemin={1}
                aria-valuemax={DEMO_SEQUENCE.length}
                aria-valuenow={stepIndex + 1}
              >
                <div
                  className="h-full rounded-full bg-landing-leaf transition-[width] duration-[600ms] motion-reduce:transition-none"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span
                className="text-sm font-semibold text-landing-night-subtle tabular-nums"
                aria-hidden="true"
              >
                {stepIndex + 1} / {DEMO_SEQUENCE.length}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
