import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import { Position } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export const elkOptions = {
  "elk.algorithm": "layered", // 노드들을 층(layer)별로 나누어 배치하는 알고리즘
  "elk.layered.spacing.nodeNodeBetweenLayers": "100", // 층 사이의 간격
  "elk.spacing.nodeNode": "80", // 노드 간의 간격
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES", // 모델 데이터의 인덱스 순서 유지
};

// ELK 레이아웃을 적용하여 노드와 엣지의 위치를 계산하는 함수
export const getLayoutedElements = async (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  options: Record<string, string> = {},
): Promise<{ nodes: CustomEditorNode[]; edges: CustomEditorEdge[] }> => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";
  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node: CustomEditorNode) => ({
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      width: 150,
      height: 50,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  /*
  실패를 여기서 삼키지 않는다. 계산에 실패한 구조를 다시 계산할지 판단하려면
  호출부가 실패를 알아야 한다.
  */
  return elk.layout(graph).then((layoutedGraph) => ({
    nodes: (layoutedGraph.children ?? []).map((node) => ({
      // ELK에서 반환한 node의 x, y 좌표 직접 참조
      ...node,
      position: { x: node.x ?? 0, y: node.y ?? 0 },
    })),
    edges: layoutedGraph.edges,
  }));
};

/*
함수 이름 : mergeLayoutResult
기능 : ELK 계산 결과에서 레이아웃이 소유하는 값만 현재 노드 목록에 병합한다. 계산 결과 배열로 노드를 통째로 교체하면 계산이 도는 동안 store에 일어난 라벨 수정·메모 저장·추가·삭제가 덮이므로, 배치에 해당하는 값만 얹는다.
인자 : CustomEditorNode[] currentNodes -> 병합 시점의 editor store 노드 목록
CustomEditorNode[] layoutedNodes -> ELK가 배치를 계산한 노드 목록
반환값 : 배치 값만 갱신된 노드 목록
*/
export const mergeLayoutResult = (
  currentNodes: CustomEditorNode[],
  layoutedNodes: CustomEditorNode[],
): CustomEditorNode[] => {
  const layoutedById = new Map(layoutedNodes.map((node) => [node.id, node]));

  return currentNodes.map((node) => {
    const layoutedNode = layoutedById.get(node.id);

    /*
    계산 시작 이후 추가된 노드는 계산 결과에 없다.
    이런 노드는 다음 레이아웃 실행이 배치를 잡을 때까지 현재 값을 유지한다.
    */
    if (!layoutedNode) return node;

    /*
    레이아웃이 소유하는 값은 좌표와, ELK에 넘긴 배치 상자 크기, 정렬 방향이 정하는 핸들 위치다.
    id·data·selected·measured처럼 store와 React Flow가 소유하는 값은 현재 노드의 것을 유지한다.
    data에는 서버 응답으로 채워지는 serverId도 들어 있어, 계산이 도는 사이에 도착한 응답이 덮이지 않는다.
    */
    const { position, width, height, targetPosition, sourcePosition } =
      layoutedNode;

    // 배치가 그대로면 노드 객체를 재사용해 불필요한 리렌더를 막는다.
    if (
      node.position.x === position.x &&
      node.position.y === position.y &&
      node.width === width &&
      node.height === height &&
      node.targetPosition === targetPosition &&
      node.sourcePosition === sourcePosition
    ) {
      return node;
    }

    return {
      ...node,
      position,
      width,
      height,
      targetPosition,
      sourcePosition,
    };
  });
};

/*
함수 이름 : getLayoutStructureSignature
기능 : 레이아웃을 다시 계산해야 하는 시점을 식별하는 문자열을 만든다. 배치를 결정하는 노드 배열 순서와 엣지 연결 관계, 좌표를 얹을 때 기준이 되는 노드 ID를 담는다. 개수만 비교하면 개수가 같은 채로 배열이 교체되는 경우(트리 전환, 형제 순서 변경)를 놓친다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 구조 시그니처 문자열
*/
export const getLayoutStructureSignature = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): string => {
  /*
  노드 ID 목록은 추가·삭제·트리 전환처럼 배치가 달라지는 변화를 잡는다. 노드의 신원은 편집기가
  정해 세션 동안 바뀌지 않으므로, 여기에 담긴 ID가 달라졌다는 것은 노드 구성이 달라졌다는 뜻이다.
  배열 순서까지 담는 것은 ELK의 considerModelOrder가 순서로 형제 배치를 정하기 때문이다.

  ID를 빼고 개수만 담으면 개수가 같은 채로 구성이 바뀌는 경우(트리 전환)를 놓치므로 빼지 않는다.
  */
  const nodeIds = nodes.map((node) => node.id);

  /*
  엣지는 ID 대신 연결 관계로 비교한다. reconnect는 엣지 ID를 유지한 채 source·target만
  바꾸므로 ID로는 배치가 달라지는 변화를 감지할 수 없다.
  */
  const edgeConnections = edges.map((edge) => [edge.source, edge.target]);

  /*
  구분자로 이어 붙이지 않고 JSON으로 직렬화한다. 구분자 방식은 ID에 그 구분자가 없다는
  전제에 기대는데, 전제가 깨지면 서로 다른 구조가 같은 문자열이 되어 레이아웃이 조용히
  실행되지 않는다. ID 생성 방식과 무관하게 성립하도록 구조를 그대로 직렬화한다.
  */
  return JSON.stringify({ nodeIds, edgeConnections });
};
