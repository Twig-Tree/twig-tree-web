import { useCallback, useLayoutEffect, Dispatch, SetStateAction } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  CustomEditorNode,
  CustomEditorEdge,
} from "@/src/features/editor/types";
import {
  getLayoutedElements,
  elkOptions,
} from "@/src/domains/tree/utils/layout";
import {
  RAW_TREE_NODE_DATA,
  RAW_TREE_EDGE_DATA,
} from "@/src/domains/tree/constants";
import { Direction } from "@/src/features/editor/constants/flowConfig";

// ELK 레이아웃을 언제 정렬할지 결정하고, 실제로 화면에 적용하는 커스텀 훅
export function useEditorLayout(
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  setNodes: Dispatch<SetStateAction<CustomEditorNode[]>>,
  setEdges: Dispatch<SetStateAction<CustomEditorEdge[]>>,
) {
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    ({
      direction,
      useInitialNodes = false,
    }: {
      direction: Direction;
      useInitialNodes?: boolean;
    }) => {
      const opts = { "elk.direction": direction, ...elkOptions };
      const ns = useInitialNodes ? RAW_TREE_NODE_DATA : nodes;
      const es = useInitialNodes ? RAW_TREE_EDGE_DATA : edges;

      // ELK 레이아웃 계산 후 노드와 엣지의 위치를 업데이트하고, 화면에 맞게 뷰를 조정
      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(
            layoutedNodes.map((node) => ({
              ...node,
              type: "custom" as const,
              position: node.position ?? { x: 0, y: 0 },
            })),
          );
          setEdges(layoutedEdges);
          window.requestAnimationFrame(() => fitView());
        },
      );
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  // 레이아웃 정렬 시점 결정
  useLayoutEffect(() => {
    onLayout({ direction: "RIGHT", useInitialNodes: nodes.length === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length]);

  return { onLayout };
}
