import { useCallback } from "react";
import { CustomEditorEdge, CustomEditorNode } from "../types";
import { useTreeStore } from "../treeStore";

export const useReactFlowStoreSetters = () => {
  const setNodes = useCallback(
    (
      nodes:
        | CustomEditorNode[]
        | ((prev: CustomEditorNode[]) => CustomEditorNode[]),
    ) => {
      useTreeStore.setState({
        nodes:
          typeof nodes === "function"
            ? nodes(useTreeStore.getState().nodes)
            : nodes,
      });
    },
    [],
  );

  const setEdges = useCallback(
    (
      edges:
        | CustomEditorEdge[]
        | ((prev: CustomEditorEdge[]) => CustomEditorEdge[]),
    ) => {
      useTreeStore.setState({
        edges:
          typeof edges === "function"
            ? edges(useTreeStore.getState().edges)
            : edges,
      });
    },
    [],
  );

  return {
    setNodes,
    setEdges,
  };
};
