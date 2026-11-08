import { TreeNode } from "@/src/entities/tree";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { createClientNodeId } from "../createClientNodeId";
import { mapToVisualEdges, mapToVisualNodes } from "../mappers";

type GetReconciledFlowElementsParams = {
  serverNodes: TreeNode[]; // 서버의 최신 노드 목록
  currentNodes: CustomEditorNode[]; // 지금 editor store의 노드 목록
  currentEdges: CustomEditorEdge[]; // 지금 editor store의 엣지 목록
};

/*
함수 이름 : isSameNodeData
기능 : 두 편집기 노드 데이터가 같은지 판단한다. 같으면 노드 객체를 재사용해 다시 그리지 않는다.
인자 : CustomEditorNode["data"] data -> 비교할 노드 데이터
CustomEditorNode["data"] otherData -> 비교할 다른 노드 데이터
반환값 : 같으면 true
*/
const isSameNodeData = (
  data: CustomEditorNode["data"],
  otherData: CustomEditorNode["data"],
): boolean =>
  data.serverId === otherData.serverId &&
  data.label === otherData.label &&
  data.orderIndex === otherData.orderIndex &&
  data.memo === otherData.memo &&
  data.version === otherData.version &&
  data.tagIds.length === otherData.tagIds.length &&
  data.tagIds.every((tagId, index) => tagId === otherData.tagIds[index]);

/*
함수 이름 : getReconciledFlowElements
기능 : 서버의 최신 노드 목록으로 editor store에 넣을 노드·엣지를 만든다. 지금 화면에 있는 노드는 serverId로 찾아 신원(clientId)과 좌표·선택 같은 화면 값을 물려받고,
서버 데이터만 바꾼다. 새 신원을 만들면 모든 노드가 다시 마운트되어 깜빡이고, 선택·강조·레이아웃 뒤로 맡긴 이동이 옛 ID를 가리킨다.
서버에 없는 노드는 빠지고, 새 노드는 새 신원과 원점 좌표로 시작해 레이아웃이 자리를 정한다.
인자 : GetReconciledFlowElementsParams
반환값 : 노드 배열과 엣지 배열. 배열 순서는 orderIndex를 따른다
*/
export const getReconciledFlowElements = ({
  serverNodes,
  currentNodes,
  currentEdges,
}: GetReconciledFlowElementsParams) => {
  const currentNodeByServerId = new Map(
    currentNodes.flatMap((node) =>
      node.data.serverId === null ? [] : [[node.data.serverId, node] as const],
    ),
  );
  const orderedNodes = [...serverNodes].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  ); // 노드 배열 순서가 형제 배치를 정한다.
  const clientIdByServerId = new Map(
    orderedNodes.map((node) => [
      node.id,
      currentNodeByServerId.get(node.id)?.id ?? createClientNodeId(),
    ]),
  );

  const nodes = mapToVisualNodes(orderedNodes, clientIdByServerId).map(
    (node) => {
      const currentNode = currentNodeByServerId.get(node.data.serverId ?? "");

      if (!currentNode) return node;

      return isSameNodeData(currentNode.data, node.data)
        ? currentNode
        : { ...currentNode, data: node.data };
    },
  );

  /*
  부모가 그대로인 엣지는 기존 객체를 쓴다. 노드 이동은 엣지 ID를 유지한 채 source만 바꾸므로, 다시 만들면 ID만 달라져 엣지가 새로 그려진다.
  */
  const currentEdgeByConnection = new Map(
    currentEdges.map((edge) => [`${edge.source}:${edge.target}`, edge]),
  );
  const edges = mapToVisualEdges(orderedNodes, clientIdByServerId).map(
    (edge) =>
      currentEdgeByConnection.get(`${edge.source}:${edge.target}`) ?? edge,
  );

  return { nodes, edges };
};
