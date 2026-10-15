"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
  createLearningPathGraphElements,
  layoutLearningPathGraph,
} from "../lib/graph";
import type {
  LearningCheckpointNode as LearningCheckpointNodeType,
  LearningPathEdge,
} from "../model/graphTypes";
import type { LearningPath, LearningProgress } from "../model/types";
import { LearningCheckpointNode } from "./LearningCheckpointNode";

const nodeTypes = {
  learningCheckpoint: LearningCheckpointNode,
} satisfies NodeTypes;

interface LearningPathGraphProps {
  learningPath: LearningPath;
  progress: LearningProgress;
  onSelectCheckpoint: (checkpointId: string) => void;
}

type LearningPathGraphCanvasProps = LearningPathGraphProps;

interface LayoutState {
  key: string;
  positionById: ReadonlyMap<string, { x: number; y: number }>;
}

function LearningPathGraphCanvas({
  learningPath,
  progress,
  onSelectCheckpoint,
}: LearningPathGraphCanvasProps) {
  const { fitView } = useReactFlow<
    LearningCheckpointNodeType,
    LearningPathEdge
  >();
  const [layoutState, setLayoutState] = useState<LayoutState>({
    key: "",
    positionById: new Map(),
  });
  const layoutKey = JSON.stringify({
    id: learningPath.id,
    version: learningPath.version,
    dependencies: learningPath.checkpoints.map((checkpoint) => [
      checkpoint.id,
      checkpoint.prerequisiteIds,
    ]),
  });
  const isLayoutPending = layoutState.key !== layoutKey;

  const graphElements = useMemo(
    () =>
      createLearningPathGraphElements(
        learningPath,
        progress,
        onSelectCheckpoint,
      ),
    [learningPath, onSelectCheckpoint, progress],
  );

  /*
  진행 상태가 바뀌어도 그래프 구조는 같으므로 경로 객체가 바뀔 때만 ELK 배치를 다시 계산한다.
  비동기 계산이 끝난 뒤 언마운트됐거나 다른 경로로 바뀌었으면 오래된 결과를 적용하지 않는다.
  */
  useEffect(() => {
    let isCurrentLayout = true;
    const layoutSource = createLearningPathGraphElements(
      learningPath,
      { activeCheckpointId: null, completedCheckpointIds: [] },
      () => undefined,
    );

    void layoutLearningPathGraph(layoutSource.nodes, layoutSource.edges).then(
      ({ nodes }) => {
        if (!isCurrentLayout) return;

        setLayoutState({
          key: layoutKey,
          positionById: new Map(nodes.map((node) => [node.id, node.position])),
        });

        requestAnimationFrame(() => {
          void fitView({ padding: 0.18, maxZoom: 1, duration: 250 });
        });
      },
    );

    return () => {
      isCurrentLayout = false;
    };
  }, [fitView, learningPath, layoutKey]);

  const positionById = isLayoutPending
    ? new Map<string, { x: number; y: number }>()
    : layoutState.positionById;

  const nodes = graphElements.nodes.map((node) => ({
    ...node,
    position: positionById.get(node.id) ?? node.position,
  }));

  return (
    <div className="learning-path-flow relative h-full min-h-96 w-full overflow-hidden bg-slate-50">
      {isLayoutPending ? (
        <p
          role="status"
          className="absolute inset-0 z-10 grid place-items-center text-sm text-slate-500"
        >
          학습 경로를 배치하는 중입니다.
        </p>
      ) : null}

      <ReactFlow<LearningCheckpointNodeType, LearningPathEdge>
        nodes={nodes}
        edges={graphElements.edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable={false}
        onNodeClick={(_, node) => node.data.onSelect(node.id)}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        minZoom={0.35}
        maxZoom={1}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#cbd5e1"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function LearningPathGraph(props: LearningPathGraphProps) {
  return (
    <ReactFlowProvider>
      <LearningPathGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
