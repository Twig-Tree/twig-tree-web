import { useEffect } from "react";
import { transformToFlowElements } from "../../lib/mappers";
import { useTreeStore } from "../treeStore";
import { TreeNode } from "@/src/entities/tree";

type UseInitializeTreeParams = {
  treeId: string;
  treeData: TreeNode[] | undefined;
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

    const { nodes, edges } = transformToFlowElements(treeData);

    initializeTree({
      treeId,
      nodes,
      edges,
    });

    clear();
  }, [treeId, treeData, currentTreeId, isDirty, initializeTree, clear]);
};
