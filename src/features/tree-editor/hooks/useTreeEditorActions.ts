import { useTreeStore } from "../model/treeStore";
import { useAddNodeAction } from "./actions/useAddNodeAction";

type UseTreeEditorActionsParams = {
  treeId: string;
};

export const useTreeEditorActions = ({
  treeId,
}: UseTreeEditorActionsParams) => {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );

  const selectedNode = nodes.find((node) => node.selected);
  const { handleAddNode, isAddingNode, isAddNodeError } = useAddNodeAction({
    treeId,
    selectedNode,
    nodes,
    edges,
  });

  return {
    selectedNode,
    isAddingNode,
    isAddNodeError,
    handleAddNode,
    handleDeleteNode: deleteNodeFromStore,
  };
};
