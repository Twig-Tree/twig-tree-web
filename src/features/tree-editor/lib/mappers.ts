import { TreeNode } from "@/src/entities/tree/model/types";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";

/*
함수 이름 : mapToVisualNodes
기능 : 도메인 노드 목록을 React Flow 노드 배열로 변환한다. 도메인 노드의 어떤 값이 화면 노드의
어느 자리로 가는지가 이 함수에만 있으므로, data에 실을 필드를 펼치지 않고 하나씩 옮긴다.
인자 : TreeNode[] nodes -> 도메인 노드 목록
반환값 : React Flow 노드 배열
*/
export const mapToVisualNodes = (nodes: TreeNode[]): CustomEditorNode[] => {
  return nodes.map((node) => ({
    id: node.id,
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

export const mapToVisualEdges = (nodes: TreeNode[]): CustomEditorEdge[] => {
  return nodes
    .filter((node) => node.parentId !== null) // 루트 노드는 들어오는 엣지가 없으므로 제외
    .map((node) => ({
      id: `e-${node.parentId}-${node.id}`, // 엣지 ID는 고유해야 합니다.
      source: node.parentId!, // 부모가 source가 됩니다.
      target: node.id, // 현재 노드가 target이 됩니다.
      type: "smoothstep", // 트리 구조에 어울리는 선 스타일 (선택 사항)
    }));
};

/*
함수 이름 : transformToFlowElements
기능 : 도메인 노드 목록을 React Flow가 사용하는 노드·엣지 배열로 변환한다. ELK의 considerModelOrder가 배열 순서로 형제 노드의 배치 순서를 정하므로, 화면에 넘기기 직전인 여기서 orderIndex 정렬을 보장한다.
인자 : TreeNode[] nodes -> 트리 조회 캐시의 노드 목록
반환값 : React Flow 노드 배열과 엣지 배열
*/
export const transformToFlowElements = (nodes: TreeNode[]) => {
  const orderedNodes = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    nodes: mapToVisualNodes(orderedNodes),
    edges: mapToVisualEdges(orderedNodes),
  };
};
