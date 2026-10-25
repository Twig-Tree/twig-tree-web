import { MarkerType, Position, type EdgeMarker } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";
import { getLearningCheckpointStatus } from "./progress";
import type {
  LearningCheckpointNode,
  LearningPathEdge,
  LearningPathGraphElements,
} from "../model/graphTypes";
import type { LearningPath, LearningProgress } from "../model/types";

const elk = new ELK();
const LEARNING_NODE_WIDTH = 224;
const LEARNING_NODE_HEIGHT = 124;

export const learningPathElkOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "48",
  "elk.layered.spacing.nodeNodeBetweenLayers": "88",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
};

const mainEdgeMarker: EdgeMarker = {
  type: MarkerType.ArrowClosed,
  color: "#64748b",
  width: 18,
  height: 18,
};

const optionalEdgeMarker: EdgeMarker = {
  type: MarkerType.ArrowClosed,
  color: "#a78bfa",
  width: 18,
  height: 18,
};

/*
함수 이름 : createLearningPathGraphElements
기능 : 학습 경로와 진행 상태를 React Flow가 표시할 노드와 의존성 edge로 변환한다.
인자 : LearningPath learningPath -> 표시할 학습 경로
LearningProgress progress -> 노드 상태를 계산할 진행 상태
(checkpointId: string) => void onSelect -> 체크포인트 선택 동작
반환값 : 레이아웃 전 React Flow 노드와 edge
*/
export const createLearningPathGraphElements = (
  learningPath: LearningPath,
  progress: LearningProgress,
  onSelect: (checkpointId: string) => void,
): LearningPathGraphElements => {
  const checkpointById = new Map(
    learningPath.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]),
  );
  const nodes: LearningCheckpointNode[] = learningPath.checkpoints.map(
    (checkpoint) => ({
      id: checkpoint.id,
      type: "learningCheckpoint",
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      ariaLabel: `${checkpoint.title}, ${checkpoint.kind}, ${getLearningCheckpointStatus(checkpoint, progress)}`,
      data: {
        checkpoint,
        status: getLearningCheckpointStatus(checkpoint, progress),
        onSelect,
      },
    }),
  );
  const edges: LearningPathEdge[] = learningPath.checkpoints.flatMap(
    (checkpoint) =>
      checkpoint.prerequisiteIds.flatMap((prerequisiteId) => {
        const prerequisite = checkpointById.get(prerequisiteId);

        if (!prerequisite) return [];

        const isOptional =
          checkpoint.kind !== "core" || prerequisite.kind !== "core";

        return [
          {
            id: `${prerequisiteId}->${checkpoint.id}`,
            source: prerequisiteId,
            target: checkpoint.id,
            type: "smoothstep",
            className: isOptional
              ? "learning-path-edge learning-path-edge--optional"
              : "learning-path-edge",
            markerEnd: isOptional ? optionalEdgeMarker : mainEdgeMarker,
            data: { isOptional },
            style: isOptional
              ? { stroke: "#a78bfa", strokeDasharray: "6 5" }
              : { stroke: "#64748b", strokeWidth: 1.75 },
          },
        ];
      }),
  );

  return { nodes, edges };
};

/*
함수 이름 : layoutLearningPathGraph
기능 : DAG를 지원하는 ELK layered 알고리즘으로 학습 경로를 왼쪽에서 오른쪽으로 배치한다.
인자 : LearningCheckpointNode[] nodes -> 배치할 학습 노드
LearningPathEdge[] edges -> 학습 의존 관계 edge
반환값 : 위치가 계산된 노드와 원래 edge
*/
export const layoutLearningPathGraph = async (
  nodes: LearningCheckpointNode[],
  edges: LearningPathEdge[],
): Promise<LearningPathGraphElements> => {
  const graph = {
    id: "learning-path-root",
    layoutOptions: learningPathElkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: LEARNING_NODE_WIDTH,
      height: LEARNING_NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
  const layoutedGraph = await elk.layout(graph);
  const positionById = new Map(
    (layoutedGraph.children ?? []).map((node) => [
      node.id,
      { x: node.x ?? 0, y: node.y ?? 0 },
    ]),
  );

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positionById.get(node.id) ?? node.position,
      width: LEARNING_NODE_WIDTH,
      height: LEARNING_NODE_HEIGHT,
    })),
    edges,
  };
};
