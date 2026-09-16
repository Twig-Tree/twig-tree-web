import { isAddNodeAvailable } from "../../lib/add-node/isAddNodeAvailable";
import { useTreeStore } from "../treeStore";
import { useAddNode } from "./add-node/useAddNode";
import { useAddRootNode } from "./add-root-node/useAddRootNode";
import { useDeleteNode } from "./delete-node/useDeleteNode";

type UseTreeEditorActionsParams = {
  workspaceId: string; // 편집 중인 워크스페이스 ID. 트리가 없을 때 루트 추가가 트리를 만든다
  treeId: string | null; // 트리가 없는 워크스페이스는 null
};

export const useTreeEditorActions = ({
  workspaceId,
  treeId,
}: UseTreeEditorActionsParams) => {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  const selectedNode = nodes.find((node) => node.selected);
  const {
    handleAddNode: handleAddChildNode,
    isAddingNode: isAddingChildNode,
    isAddNodeError: isAddChildNodeError,
  } = useAddNode({
    treeId,
    selectedNode,
    nodes,
    edges,
  });
  const { handleAddRootNode, isAddingRootNode, isAddRootNodeError } =
    useAddRootNode({ workspaceId, treeId, nodes });
  const { handleDeleteNode, isDeletingNode, isDeleteNodeError } = useDeleteNode(
    {
      treeId,
      selectedNode,
    },
  );

  /*
  노드 추가 버튼 하나가 노드 개수에 따라 루트 추가와 자식 추가를 나눠 맡는다.
  노드가 없으면 선택할 노드도 없으므로 루트를, 있으면 선택한 노드의 자식을 추가한다.
  */
  const handleAddNode =
    nodes.length === 0 ? () => void handleAddRootNode() : handleAddChildNode;
  const isAddingNode = isAddingChildNode || isAddingRootNode; // 페이지의 편집 잠금이 두 요청을 모두 기다리도록 합친다.
  const isAddNodeError = isAddChildNodeError || isAddRootNodeError;
  const isAddNodeEnabled = isAddNodeAvailable({
    nodeCount: nodes.length,
    hasSelectedNode: selectedNode !== undefined,
  });

  return {
    selectedNode,
    isAddingNode,
    isAddNodeError,
    isAddNodeEnabled,
    handleAddNode,
    isDeletingNode,
    isDeleteNodeError,
    handleDeleteNode,
  };
};
