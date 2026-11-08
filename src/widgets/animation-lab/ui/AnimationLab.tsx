"use client";

import { useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  MIN_ZOOM,
  edgeTypes,
  nodeTypes,
  useEditorLayout,
  useFocusNode,
  useInitializeTree,
  useNodeTransition,
  useReactFlowStoreSetters,
  useTreeStore,
  useVisibleElements,
} from "@/src/features/tree-editor";
import { type LectureAnimation } from "@/src/entities/lecture";
import {
  ANIMATION_LAB_TREE,
  ANIMATION_LAB_TREE_ID,
} from "../model/fixtureTree";
import {
  getLabRecipeRun,
  LAB_RECIPE_IDS,
  LAB_RECIPE_SAMPLE_INPUTS,
} from "../model/labRecipeRun";
import {
  getLabScenarioRun,
  LAB_SCENARIO_FIXTURES,
} from "../model/labScenarioRun";
import {
  getLabAnimation,
  getLabStepsFromAnimation,
} from "../model/labTimeline";
import { createLabPresetSteps, LAB_PRESETS } from "../model/presets";
import { useAnimationLabPlayback } from "../model/useAnimationLabPlayback";
import { useLabTimeline } from "../model/useLabTimeline";
import { isLabTimelinePlayable } from "../model/validateLabStep";
import { AnimationComposer } from "./AnimationComposer";
import { LabPlaybackControls } from "./LabPlaybackControls";
import { type LabRecipeDraft, LabRecipeComposer } from "./LabRecipeComposer";
import {
  createLabScenarioDraft,
  LabScenarioComposer,
} from "./LabScenarioComposer";

type LabMode = "atomic" | "recipe" | "scenario";

const LAB_MODES: { mode: LabMode; label: string; description: string }[] = [
  { mode: "atomic", label: "Atomic", description: "단위 동작을 직접 조합" },
  { mode: "recipe", label: "Recipe", description: "recipe 하나를 실행" },
  {
    mode: "scenario",
    label: "Scenario",
    description: "시나리오를 컴파일해 실행",
  },
];

const INITIAL_RECIPE_DRAFT: LabRecipeDraft = {
  recipeId: LAB_RECIPE_IDS[0],
  inputText: JSON.stringify(
    LAB_RECIPE_SAMPLE_INPUTS[LAB_RECIPE_IDS[0]],
    null,
    2,
  ),
  delivery: {},
};

const INITIAL_SCENARIO_DRAFT = createLabScenarioDraft(
  LAB_SCENARIO_FIXTURES[0].id,
);

const handleSelectedNodeHidden = () => {}; // 닫을 메모 패널이 없다. 렌더마다 새 함수가 되면 useVisibleElements의 effect가 매번 다시 돈다.

/*
함수 이름 : AnimationLabCanvas
기능 : 서버 없이 고정 트리나 시나리오 fixture의 트리를 실제 편집기의 노드·연결선·카메라로 그리고, 모드별로 만든 애니메이션을 실행한다.
인자 : 없음
반환값 : 애니메이션 조합 도구와 트리 캔버스

제품과 같은 렌더러를 써야 여기서 본 효과가 강의에서도 같게 보이므로, 실험용 노드를 따로 만들지 않는다.
*/
function AnimationLabCanvas() {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);
  const onNodesChange = useTreeStore((state) => state.onNodesChange);
  const onEdgesChange = useTreeStore((state) => state.onEdgesChange);
  const { setNodes } = useReactFlowStoreSetters();

  const [mode, setMode] = useState<LabMode>("atomic");
  const [scenarioDraft, setScenarioDraft] = useState(INITIAL_SCENARIO_DRAFT);
  const scenarioFixture =
    LAB_SCENARIO_FIXTURES.find(({ id }) => id === scenarioDraft.fixtureId) ??
    LAB_SCENARIO_FIXTURES[0];

  /*
  Scenario 모드는 fixture가 전제하는 트리를 그린다. 트리 ID가 바뀌면 useInitializeTree가 store를 새로 채운다.
  노드 ID가 트리마다 겹치므로 다른 모드는 고정 트리로 돌아온다.
  */
  useInitializeTree(
    mode === "scenario"
      ? {
          treeId: scenarioFixture.treeId,
          treeData: scenarioFixture.treeNodes,
        }
      : { treeId: ANIMATION_LAB_TREE_ID, treeData: ANIMATION_LAB_TREE },
  );

  const { visibleNodes, visibleEdges } = useVisibleElements({
    nodes,
    edges,
    onSelectedNodeHidden: handleSelectedNodeHidden,
  });
  const {
    fitTreeView,
    fitTreeViewAfterNextLayout,
    runAfterNextLayout,
    isLayoutRunning,
  } = useEditorLayout(visibleNodes, visibleEdges, setNodes);
  /*
  useEditorLayout은 처음 그릴 때 한 번만 화면을 맞춘다. 모드나 fixture로 트리를 바꾸면 카메라가 이전 트리의 자리에 남으므로,
  store가 새 트리로 채워진 뒤의 레이아웃이 끝나면 다시 맞춘다. store의 treeId를 보는 이유는 이 effect가 새 노드의
  레이아웃 계산이 시작된 뒤에 돌아, 이전 트리의 계산이 예약을 가져가지 않게 하기 위해서다. 처음 채울 때는 기존 맞춤에 맡긴다.
  */
  const storeTreeId = useTreeStore((state) => state.treeId);
  const previousStoreTreeIdRef = useRef(storeTreeId);

  useEffect(() => {
    const previousTreeId = previousStoreTreeIdRef.current;
    previousStoreTreeIdRef.current = storeTreeId;

    if (previousTreeId === null || storeTreeId === previousTreeId) return;

    fitTreeViewAfterNextLayout();
  }, [storeTreeId, fitTreeViewAfterNextLayout]);

  const { revealNodes } = useFocusNode({
    visibleNodes,
    runAfterNextLayout,
    isLayoutRunning,
  });

  /*
  접고 펼치는 움직임은 이 전환이 그리므로 제품 캔버스와 똑같이 거친다.
  */
  const { transitionNodes, transitionEdges } = useNodeTransition({
    nodes: visibleNodes,
    edges: visibleEdges,
    isLayoutRunning,
  });

  const timeline = useLabTimeline(() => createLabPresetSteps(LAB_PRESETS[0]));
  const [recipeDraft, setRecipeDraft] = useState(INITIAL_RECIPE_DRAFT);
  const recipeRun = getLabRecipeRun(
    recipeDraft.recipeId,
    recipeDraft.inputText,
    recipeDraft.delivery,
  );
  const scenarioRun = getLabScenarioRun(
    scenarioDraft.scenarioText,
    scenarioFixture.compilerTree,
  );
  const [isLooping, setIsLooping] = useState(false);
  const [isReducedMotionPreview, setIsReducedMotionPreview] = useState(false);
  const {
    play: startPlayback,
    stop: stopPlayback,
    isPlaying,
    stage,
  } = useAnimationLabPlayback({
    revealNodes,
    resetCamera: fitTreeView,
    isLooping,
    isReducedMotionPreview,
  });

  /*
  focus는 레이아웃 계산 중이면 카메라 이동을 runAfterNextLayout에 맡긴다. 재생을 바꾸거나 멈출 때 그 예약이 남으면
  새 재생이 카메라를 되돌린 뒤 이전 대상으로 움직이므로 먼저 비운다. 예약 자리는 하나라 빈 함수로 덮으면 지워진다.
  트리를 바꿀 때의 화면 맞춤은 stop 뒤의 effect가 예약하므로 지워지지 않는다.
  */
  const clearPendingCameraMove = () => runAfterNextLayout(() => {});

  const play = (animation: LectureAnimation) => {
    clearPendingCameraMove();
    startPlayback(animation);
  };

  const stop = () => {
    clearPendingCameraMove();
    stopPlayback();
  };

  const handleReset = () => {
    stop();
    fitTreeView();
  };

  /*
  모드마다 재생할 애니메이션이 다르다. 고쳐야 할 입력이 남아 있으면 재생을 막는다.
  */
  const playableAnimation =
    mode === "atomic"
      ? isLabTimelinePlayable(timeline.steps, ANIMATION_LAB_TREE)
        ? getLabAnimation(timeline.steps)
        : null
      : mode === "recipe"
        ? recipeRun.success
          ? recipeRun.animation
          : null
        : scenarioRun.success
          ? scenarioRun.animation
          : null;

  /*
  recipe 결과를 단위 동작으로 풀어 Atomic 타임라인에서 하나씩 고치게 한다.
  */
  const handleMoveToTimeline = (animation: LectureAnimation) => {
    const result = getLabStepsFromAnimation(animation);
    if ("error" in result) return;

    stop();
    timeline.replaceSteps(result.steps);
    setMode("atomic");
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside
        aria-label="애니메이션 실험 도구"
        className="w-96 shrink-0 overflow-y-auto border-r border-line bg-surface-muted p-4"
      >
        <h2 className="mb-3 text-sm font-bold text-content">Animation Lab</h2>
        <div className="flex flex-col gap-4">
          <div
            role="group"
            aria-label="실험 모드"
            className="grid grid-cols-3 gap-1 rounded-control border border-line bg-surface p-1"
          >
            {LAB_MODES.map((item) => (
              <button
                key={item.mode}
                type="button"
                aria-pressed={mode === item.mode}
                title={item.description}
                className={`h-8 rounded-control text-xs font-bold ${
                  mode === item.mode
                    ? "bg-accent text-on-accent"
                    : "text-content-secondary hover:bg-surface-hover"
                }`}
                onClick={() => {
                  stop();
                  setMode(item.mode);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <LabPlaybackControls
            isPlayDisabled={playableAnimation === null}
            isPlaying={isPlaying}
            stage={stage}
            isLooping={isLooping}
            onChangeLooping={setIsLooping}
            isReducedMotionPreview={isReducedMotionPreview}
            onChangeReducedMotionPreview={setIsReducedMotionPreview}
            onPlay={() => {
              if (playableAnimation) play(playableAnimation);
            }}
            onStop={stop}
            onReset={handleReset}
          />

          {mode === "atomic" ? <AnimationComposer timeline={timeline} /> : null}
          {mode === "recipe" ? (
            <LabRecipeComposer
              draft={recipeDraft}
              run={recipeRun}
              onChangeDraft={setRecipeDraft}
              onMoveToTimeline={handleMoveToTimeline}
            />
          ) : null}
          {mode === "scenario" ? (
            <LabScenarioComposer
              draft={scenarioDraft}
              run={scenarioRun}
              onChangeDraft={(draft) => {
                if (draft.fixtureId !== scenarioDraft.fixtureId) stop(); // 트리가 바뀌므로 재생 중인 효과를 걷어 낸다
                setScenarioDraft(draft);
              }}
              onPlayPart={play}
            />
          ) : null}
        </div>
      </aside>

      <div className="relative min-h-0 min-w-0 flex-1">
        <ReactFlow
          nodes={transitionNodes}
          edges={transitionEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={MIN_ZOOM}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            if (mode === "atomic" && node.data.serverId !== null) {
              timeline.toggleActiveStepNode(node.data.serverId);
            }
          }}
          deleteKeyCode={null}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={0.8}
            bgColor="transparent"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

/*
함수 이름 : AnimationLab
기능 : 강의 애니메이션을 시험하는 개발 전용 화면을 그린다.
인자 : 없음
반환값 : React Flow 문맥을 갖춘 애니메이션 실험실
*/
export function AnimationLab() {
  return (
    <ReactFlowProvider>
      <AnimationLabCanvas />
    </ReactFlowProvider>
  );
}
