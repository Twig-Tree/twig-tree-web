import { useDeleteNodeAction } from "@/src/features/tree-editor/hooks/actions/useDeleteNodeAction";
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

  const selectedNode = nodes.find((node) => node.selected);
  const { handleAddNode, isAddingNode, isAddNodeError } = useAddNodeAction({
    treeId,
    selectedNode,
    nodes,
    edges,
  });
  const { handleDeleteNode, isDeletingNode, isDeleteNodeError } =
    useDeleteNodeAction({
      treeId,
      selectedNode,
    });

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
