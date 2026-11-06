import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Square,
  Undo2,
} from "lucide-react";
import {
  type EditorLectureAnimationAction,
  type EditorLectureAnimation,
  type CustomEditorNode,
} from "../model/types";
import { useTreeStore } from "../model/treeStore";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
import { runLectureAnimation } from "../model/lecture/runLectureAnimation";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";

type LectureAnimationDevPanelProps = {
  selectedNode: CustomEditorNode | undefined; // 단위 동작을 적용할 현재 선택 노드
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // focus 동작이 대상 노드를 화면에 모으는 함수
  onResetCamera: () => void; // reset 동작이 전체 트리 화면으로 돌아가는 함수
};

const ACTION_DURATION_MS = 900;
const SEQUENCE_GAP_MS = 160;

/*
함수 이름 : getAnimationStageLabel
기능 : 실행 중인 단위 애니메이션을 개발 패널에 표시할 짧은 단계 이름으로 바꾼다.
인자 : EditorLectureAnimationAction animation -> 현재 실행 중인 단위 동작
반환값 : 개발 패널에 표시할 단계 이름
*/
const getAnimationStageLabel = (
  animation: EditorLectureAnimationAction,
): string => {
  switch (animation.type) {
    case "focus":
      return "Focus · 화면 이동";
    case "highlight":
      return animation.style === "pulse"
        ? "Pulse · 노드 강조"
        : "Highlight · 노드 강조";
    case "dim":
      return "Dim Others · 주변 흐림";
    case "trace":
      return "Trace Child · 연결 추적";
    case "reset":
      return "Reset · 초기화";
  }
};

/*
함수 이름 : LectureAnimationDevPanel
기능 : 선택 노드와 첫 자식을 대상으로 강의 단위 애니메이션과 순차·병렬 조합을 직접 실행한다.
인자 : LectureAnimationDevPanelProps
반환값 : 프로토타입 검증용 애니메이션 제어 패널
*/
export function LectureAnimationDevPanel({
  selectedNode,
  onRevealNodes,
  onResetCamera,
}: LectureAnimationDevPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const edges = useTreeStore((state) => state.edges);
  const resetVisual = useLectureAnimationStore((state) => state.resetVisual);

  const childClientId = useMemo(
    () =>
      selectedNode
        ? edges.find((edge) => edge.source === selectedNode.id)?.target
        : undefined,
    [edges, selectedNode],
  );

  const stopAnimation = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    resetVisual();
    setIsRunning(false);
    setActiveStage(null);
  }, [resetVisual]);

  const runAnimation = useCallback(
    async (animation: EditorLectureAnimation) => {
      controllerRef.current?.abort();
      resetVisual();

      const controller = new AbortController();
      controllerRef.current = controller;
      setIsRunning(true);

      await runLectureAnimation(animation, {
        revealNodes: onRevealNodes,
        resetCamera: onResetCamera,
        signal: controller.signal,
        sequenceGapMs: SEQUENCE_GAP_MS,
        onActionStart: (action) =>
          setActiveStage(getAnimationStageLabel(action)),
        onActionEnd: () => setActiveStage("다음 단계 준비"),
      });

      if (controllerRef.current !== controller) return;
      controllerRef.current = null;
      setIsRunning(false);
      setActiveStage(null);
    },
    [onResetCamera, onRevealNodes, resetVisual],
  );

  useEffect(
    () => () => {
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.abort();
      resetVisual();
    },
    [resetVisual],
  );

  const selectedClientId = selectedNode?.id;
  const selectedLabel = selectedNode?.data.label;
  const selectedAndChildIds = selectedClientId
    ? childClientId
      ? [selectedClientId, childClientId]
      : [selectedClientId]
    : [];

  const handleReset = () => {
    stopAnimation();
    onResetCamera();
  };

  const handleFocus = () => {
    if (!selectedClientId) return;
    void runAnimation({
      type: "focus",
      targetClientIds: selectedAndChildIds,
      maxZoom: 1.3,
      durationMs: 600,
    });
  };

  const handleHighlight = () => {
    if (!selectedClientId) return;
    void runAnimation({
      type: "highlight",
      targetClientIds: [selectedClientId],
      style: "steady",
      durationMs: ACTION_DURATION_MS,
    });
  };

  const handlePulse = () => {
    if (!selectedClientId) return;
    void runAnimation({
      type: "highlight",
      targetClientIds: [selectedClientId],
      style: "pulse",
      durationMs: ACTION_DURATION_MS,
    });
  };

  const handleDimOthers = () => {
    if (!selectedClientId) return;
    void runAnimation({
      type: "dim",
      exceptClientIds: [selectedClientId],
      durationMs: ACTION_DURATION_MS,
    });
  };

  const handleTrace = () => {
    if (!selectedClientId || !childClientId) return;
    void runAnimation({
      type: "trace",
      clientIds: [selectedClientId, childClientId],
      durationMs: ACTION_DURATION_MS,
    });
  };

  const handleSequence = () => {
    if (!selectedClientId || !childClientId) return;

    const children: EditorLectureAnimation[] = [
      {
        type: "focus",
        targetClientIds: selectedAndChildIds,
        maxZoom: 1.3,
        durationMs: 500,
      },
      {
        type: "highlight",
        targetClientIds: [selectedClientId],
        style: "steady",
        durationMs: 500,
      },
      {
        type: "trace",
        clientIds: [selectedClientId, childClientId],
        durationMs: 1200,
      },
      {
        type: "highlight",
        targetClientIds: [childClientId],
        style: "pulse",
        durationMs: 700,
      },
    ];

    void runAnimation({ type: "group", mode: "sequence", children });
  };

  const handleParallel = () => {
    if (!selectedClientId) return;

    const children: EditorLectureAnimation[] = [
      {
        type: "highlight",
        targetClientIds: [selectedClientId],
        style: "pulse",
        durationMs: 1400,
      },
      {
        type: "dim",
        exceptClientIds: selectedAndChildIds,
        durationMs: 1400,
      },
    ];

    if (childClientId) {
      children.push({
        type: "trace",
        clientIds: [selectedClientId, childClientId],
        durationMs: 1400,
      });
    }

    void runAnimation({ type: "group", mode: "parallel", children });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        aria-label="애니메이션 개발 패널 열기"
      >
        <FlaskConical className="size-4" aria-hidden="true" />
        Animation DEV
        <ChevronDown className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  const isActionDisabled = selectedNode === undefined || isRunning;

  return (
    <section
      aria-label="애니메이션 개발 패널"
      className="w-72 rounded-card border border-line bg-surface/95 p-3 shadow-overlay backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-bold text-content">Animation DEV</h2>
        <IconButton
          aria-label="애니메이션 개발 패널 접기"
          size="sm"
          className="ml-auto"
          onClick={() => setIsOpen(false)}
        >
          <ChevronUp />
        </IconButton>
      </div>

      <p className="mt-1 truncate text-xs text-content-secondary">
        {selectedLabel
          ? `대상: ${selectedLabel}${childClientId ? " + 첫 자식" : ""}`
          : "트리에서 노드를 먼저 선택하세요."}
      </p>

      <p
        role="status"
        aria-live="polite"
        className="mt-2 rounded-md bg-accent-subtle px-2 py-1.5 text-xs font-medium text-accent"
      >
        {activeStage ? `실행 중: ${activeStage}` : "대기 중"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          className="w-full"
          disabled={isActionDisabled}
          onClick={handleFocus}
        >
          Focus
        </Button>
        <Button
          className="w-full"
          disabled={isActionDisabled}
          onClick={handleHighlight}
        >
          Highlight
        </Button>
        <Button
          className="w-full"
          disabled={isActionDisabled}
          onClick={handlePulse}
        >
          Pulse
        </Button>
        <Button
          className="w-full"
          disabled={isActionDisabled}
          onClick={handleDimOthers}
        >
          Dim Others
        </Button>
        <Button
          className="w-full"
          disabled={isActionDisabled || childClientId === undefined}
          onClick={handleTrace}
        >
          Trace Child
        </Button>
        <Button
          className="w-full"
          disabled={isActionDisabled || childClientId === undefined}
          onClick={handleSequence}
        >
          Sequence
        </Button>
        <Button
          className="col-span-2 w-full"
          disabled={isActionDisabled}
          onClick={handleParallel}
        >
          Parallel
        </Button>
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <Button
          className="flex-1"
          disabled={!isRunning}
          onClick={stopAnimation}
        >
          <Square className="size-3.5" aria-hidden="true" />
          중단
        </Button>
        <Button className="flex-1" onClick={handleReset}>
          <Undo2 className="size-3.5" aria-hidden="true" />
          초기화
        </Button>
      </div>
    </section>
  );
}
