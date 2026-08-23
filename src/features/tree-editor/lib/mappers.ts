import { TreeNode } from "@/src/entities/tree/model/types";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import { createClientNodeId } from "./createClientNodeId";

/*
함수 이름 : createClientIdByServerId
기능 : 도메인 노드마다 편집기 노드 ID를 하나씩 만들어 서버 ID에 대응시킨다. 노드와 엣지가 같은
신원을 가리켜야 하므로 두 매핑 함수가 이 표를 함께 쓴다.
인자 : TreeNode[] nodes -> 도메인 노드 목록
반환값 : 서버 ID를 편집기 노드 ID로 바꾸는 표
*/
const createClientIdByServerId = (nodes: TreeNode[]): Map<string, string> =>
  new Map(nodes.map((node) => [node.id, createClientNodeId()]));

/*
함수 이름 : mapToVisualNodes
기능 : 도메인 노드 목록을 React Flow 노드 배열로 변환한다. 노드의 신원은 편집기가 새로 정하고,
서버가 확정한 ID는 data.serverId로 옮겨 싣는다.
인자 : TreeNode[] nodes -> 도메인 노드 목록
Map<string, string> clientIdByServerId -> 서버 ID를 편집기 노드 ID로 바꾸는 표
반환값 : React Flow 노드 배열
*/
export const mapToVisualNodes = (
  nodes: TreeNode[],
  clientIdByServerId: Map<string, string>,
): CustomEditorNode[] => {
  return nodes.map((node) => ({
    id: clientIdByServerId.get(node.id)!, // 표는 같은 목록으로 만들었으므로 항상 값이 있다.
    type: "custom",
    data: {
      serverId: node.id, // 조회로 받은 노드는 이미 서버에 저장되어 있다.
      label: node.label,
      orderIndex: node.orderIndex,
      memo: node.memo,
    },
    position: { x: 0, y: 0 }, // 초기 위치는 ELK 레이아웃 엔진 등이 계산하도록 위임
  }));
};

/*
함수 이름 : mapToVisualEdges
기능 : 도메인 노드의 parentId가 표현하는 부모-자식 관계를 React Flow 엣지 배열로 변환한다.
편집기에서 구조를 들고 있는 것은 엣지이므로, 여기서 부모와 자식을 모두 편집기 노드 ID로 잇는다.
인자 : TreeNode[] nodes -> 도메인 노드 목록
Map<string, string> clientIdByServerId -> 서버 ID를 편집기 노드 ID로 바꾸는 표
반환값 : React Flow 엣지 배열
*/
export const mapToVisualEdges = (
  nodes: TreeNode[],
  clientIdByServerId: Map<string, string>,
): CustomEditorEdge[] => {
  return nodes.flatMap((node) => {
    if (node.parentId === null) return []; // 루트 노드는 들어오는 엣지가 없으므로 제외

    const sourceId = clientIdByServerId.get(node.parentId);
    const targetId = clientIdByServerId.get(node.id);

    /*
    부모가 응답에 없으면 이을 상대가 편집기에 없다. 그리지 못하는 엣지를 만들지 않고 버린다.
    */
    if (sourceId === undefined || targetId === undefined) return [];

    return [
      {
        id: `e-${sourceId}-${targetId}`, // 엣지 ID는 고유해야 합니다.
        source: sourceId, // 부모가 source가 됩니다.
        target: targetId, // 현재 노드가 target이 됩니다.
        type: "smoothstep", // 트리 구조에 어울리는 선 스타일 (선택 사항)
      },
    ];
  });
};

/*
함수 이름 : transformToFlowElements
기능 : 도메인 노드 목록을 React Flow가 사용하는 노드·엣지 배열로 변환한다. ELK의 considerModelOrder가 배열 순서로 형제 노드의 배치 순서를 정하므로, 화면에 넘기기 직전인 여기서 orderIndex 정렬을 보장한다.
인자 : TreeNode[] nodes -> 트리 조회 캐시의 노드 목록
반환값 : React Flow 노드 배열과 엣지 배열
*/
export const transformToFlowElements = (nodes: TreeNode[]) => {
  const orderedNodes = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex);

  const clientIdByServerId = createClientIdByServerId(orderedNodes);

  return {
    nodes: mapToVisualNodes(orderedNodes, clientIdByServerId),
    edges: mapToVisualEdges(orderedNodes, clientIdByServerId),
  };
};
