import { useCallback, useLayoutEffect, Dispatch, SetStateAction } from "react";
import { useReactFlow } from "@xyflow/react";
import { CustomEdgeType, CustomNodeType } from "@/src/domains/tree/types";
import { getLayoutedElements, elkOptions } from "@/src/domains/tree/utils/layout";
import { initialNodes, initialEdges } from "@/src/domains/tree/constants";
import { Direction } from "@/src/features/editor/constants/flowConfig";

export function useEditorLayout(
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
  setNodes: Dispatch<SetStateAction<CustomNodeType[]>>,
  setEdges: Dispatch<SetStateAction<CustomEdgeType[]>>
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
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          window.requestAnimationFrame(() => fitView());
        },
      );
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  useLayoutEffect(() => {
    onLayout({ direction: "RIGHT", useInitialNodes: nodes.length === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length]);

  return { onLayout };
}
