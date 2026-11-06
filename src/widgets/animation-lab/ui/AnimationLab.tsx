"use client";

import { useState } from "react";
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
import {
  ANIMATION_LAB_TREE,
  ANIMATION_LAB_TREE_ID,
} from "../model/fixtureTree";
import { getLabAnimation } from "../model/labTimeline";
import { LAB_PRESETS } from "../model/presets";
import { useAnimationLabPlayback } from "../model/useAnimationLabPlayback";
import { useLabTimeline } from "../model/useLabTimeline";
import { AnimationComposer } from "./AnimationComposer";

const handleSelectedNodeHidden = () => {}; // 닫을 메모 패널이 없다. 렌더마다 새 함수가 되면 useVisibleElements의 effect가 매번 다시 돈다.

/*
함수 이름 : AnimationLabCanvas
기능 : 서버 없이 고정 트리를 실제 편집기의 노드·연결선·카메라로 그리고, 타임라인으로 조합한 애니메이션을 실행한다.
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

  useInitializeTree({
    treeId: ANIMATION_LAB_TREE_ID,
    treeData: ANIMATION_LAB_TREE,
  });

  const { visibleNodes, visibleEdges } = useVisibleElements({
    nodes,
    edges,
    onSelectedNodeHidden: handleSelectedNodeHidden,
  });
  const { fitTreeView, runAfterNextLayout, isLayoutRunning } = useEditorLayout(
    visibleNodes,
    visibleEdges,
    setNodes,
  );
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

  const timeline = useLabTimeline(LAB_PRESETS[0].createSteps);
  const [isLooping, setIsLooping] = useState(false);
  const { play, stop, isPlaying, stage } = useAnimationLabPlayback({
    revealNodes,
    resetCamera: fitTreeView,
    isLooping,
  });

  const handleReset = () => {
    stop();
    fitTreeView();
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside
        aria-label="애니메이션 실험 도구"
        className="w-96 shrink-0 overflow-y-auto border-r border-line bg-surface-muted p-4"
      >
        <h2 className="mb-3 text-sm font-bold text-content">Animation Lab</h2>
        <AnimationComposer
          timeline={timeline}
          isPlaying={isPlaying}
          stage={stage}
          isLooping={isLooping}
          onChangeLooping={setIsLooping}
          onPlay={() => play(getLabAnimation(timeline.steps))}
          onStop={stop}
          onReset={handleReset}
        />
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
            if (node.data.serverId !== null) {
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
