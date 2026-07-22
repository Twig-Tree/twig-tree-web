import { useEffect } from "react";
import { mapNodesDtoToDomain } from "@/src/entities/tree/lib/mappers";
import { mapToVisualEdges, mapToVisualNodes } from "../../lib/mappers";
import { useTreeStore } from "../treeStore";
import { NodeDTO } from "@/src/entities/tree/api/types";

type UseInitializeTreeParams = {
  treeId: string;
  treeData: NodeDTO[] | undefined;
  clear: () => void;
};

export const useInitializeTree = ({
  treeId,
  treeData,
  clear,
}: UseInitializeTreeParams) => {
  const initializeTree = useTreeStore((state) => state.initializeTree);
  const currentTreeId = useTreeStore((state) => state.treeId);
  const isDirty = useTreeStore((state) => state.isDirty);

  useEffect(() => {
    if (!treeData) return;

    if (currentTreeId === treeId && isDirty) return;

    const domainNodes = mapNodesDtoToDomain(treeData);
    const visualNodes = mapToVisualNodes(domainNodes);
    const visualEdges = mapToVisualEdges(domainNodes);

    initializeTree({
      treeId,
      nodes: visualNodes,
      edges: visualEdges,
    });

    clear();
  }, [treeId, treeData, currentTreeId, isDirty, initializeTree, clear]);
};
