import { useTreeStore } from "../treeStore";
import { useAddNode } from "./add-node/useAddNode";
import { useDeleteNode } from "./delete-node/useDeleteNode";

type UseTreeEditorActionsParams = {
  treeId: string;
};

export const useTreeEditorActions = ({
  treeId,
}: UseTreeEditorActionsParams) => {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  const selectedNode = nodes.find((node) => node.selected);
  const { handleAddNode, isAddingNode, isAddNodeError } = useAddNode({
    treeId,
    selectedNode,
    nodes,
    edges,
  });
  const { handleDeleteNode, isDeletingNode, isDeleteNodeError } = useDeleteNode(
    {
      treeId,
      selectedNode,
    },
  );

  return {
    selectedNode,
    isAddingNode,
    isAddNodeError,
    handleAddNode,
    isDeletingNode,
    isDeleteNodeError,
    handleDeleteNode,
  };
};
