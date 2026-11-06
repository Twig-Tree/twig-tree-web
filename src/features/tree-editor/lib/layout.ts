import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import { Position } from "@xyflow/react";

/*
노드 크기는 내용과 상관없이 고정이다. 레이아웃이 이 크기로 위치를 계산하고 React Flow도 같은 크기로 노드를 그린다.
*/
export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 60;

/*
형제가 쌓이는 세로 간격과 연결선이 지나가는 층 사이 간격. 처음 열 때의 배율은 대개 트리 높이가 정하므로
형제 간격을 좁혀 글자를 키우고, 층 사이는 연결선과 접기 버튼이 지나갈 폭을 남긴다.
*/
export const SIBLING_GAP = 32;
const LAYER_GAP = 64;

/*
함수 이름 : sortEdgesByTargetOrder
기능 : 엣지를 자식(target) 노드의 배열 순서대로 정렬한다. 편집기에서 형제 순서를 정하는 것은 노드 배열인데,
노드 이동은 노드 배열만 다시 놓고 엣지 배열은 그대로 두므로 두 배열의 순서가 어긋날 수 있다.
인자 : CustomEditorNode[] nodes -> 형제 순서를 정하는 노드 목록
CustomEditorEdge[] edges -> 정렬할 엣지 목록
반환값 : 자식 노드의 배열 순서로 정렬한 새 엣지 목록
*/
const sortEdgesByTargetOrder = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): CustomEditorEdge[] => {
  const indexByClientId = new Map(nodes.map((node, index) => [node.id, index]));

  const getTargetIndex = (edge: CustomEditorEdge) =>
    indexByClientId.get(edge.target) ?? nodes.length; // 노드 목록에 없는 target은 뒤로 보낸다.

  return [...edges].sort((a, b) => getTargetIndex(a) - getTargetIndex(b));
};

/*
함수 이름 : getNodePositions
기능 : 부모를 첫 자식과 같은 높이에 두고 나머지 형제를 그 아래로 쌓도록 노드 좌표를 계산한다. 앞선 형제의 서브트리가
끝나는 곳 아래에서 다음 형제가 시작하므로 서브트리끼리 겹치지 않고, 접거나 펼쳐도 그 아래 노드만 움직인다.
인자 : CustomEditorNode[] nodes -> 배치할 노드 목록
CustomEditorEdge[] edges -> 배치할 엣지 목록
반환값 : 노드 ID를 키로 하는 좌표
*/
const getNodePositions = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): Map<string, { x: number; y: number }> => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const childIdsByParent = new Map<string, string[]>();
  const childIds = new Set<string>();

  sortEdgesByTargetOrder(nodes, edges).forEach(({ source, target }) => {
    if (!nodeIds.has(source) || !nodeIds.has(target)) return; // 접혀서 보이지 않는 노드와의 연결은 배치와 무관하다.

    const siblingIds = childIdsByParent.get(source);

    if (siblingIds) {
      siblingIds.push(target);
    } else {
      childIdsByParent.set(source, [target]);
    }

    childIds.add(target);
  });

  const positions = new Map<string, { x: number; y: number }>();

  /*
  이미 놓은 노드를 건너뛰어, 잘못된 구조에 순환이 있어도 계산이 끝나게 한다. 서브트리의 아래쪽 끝 좌표를 돌려준다.
  */
  const placeSubtree = (id: string, depth: number, top: number): number => {
    if (positions.has(id)) return top - SIBLING_GAP;

    positions.set(id, { x: depth * (NODE_WIDTH + LAYER_GAP), y: top });

    let bottom = top + NODE_HEIGHT;
    let nextTop = top;

    (childIdsByParent.get(id) ?? []).forEach((childId) => {
      bottom = Math.max(bottom, placeSubtree(childId, depth + 1, nextTop));
      nextTop = bottom + SIBLING_GAP;
    });

    return bottom;
  };

  /*
  부모가 없는 노드를 먼저 놓고, 순환에 묶여 아직 놓이지 않은 노드는 뒤에 놓아 원점에 겹치지 않게 한다.
  */
  const rootIds = nodes
    .filter((node) => !childIds.has(node.id))
    .map((node) => node.id);

  let nextTop = 0;

  [...rootIds, ...nodes.map((node) => node.id)].forEach((id) => {
    if (positions.has(id)) return;

    nextTop = placeSubtree(id, 0, nextTop) + SIBLING_GAP;
  });

  return positions;
};

/*
함수 이름 : getLayoutedElements
기능 : 노드와 엣지의 배치를 계산한다. 호출부가 나중에 시작한 계산의 결과만 얹도록 비동기 결과로 돌려준다.
인자 : CustomEditorNode[] nodes -> 배치할 노드 목록
CustomEditorEdge[] edges -> 배치할 엣지 목록
반환값 : 좌표와 배치 상자 크기, 핸들 위치를 얹은 노드 목록과 엣지 목록
*/
export const getLayoutedElements = async (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): Promise<{ nodes: CustomEditorNode[]; edges: CustomEditorEdge[] }> => {
  const positions = getNodePositions(nodes, edges);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges,
  };
};

/*
함수 이름 : mergeLayoutResult
기능 : 배치 계산 결과에서 레이아웃이 소유하는 값만 현재 노드 목록에 병합한다. 계산 결과 배열로 노드를 통째로 교체하면 계산이 도는 동안 store에 일어난 라벨 수정·메모 저장·추가·삭제가 덮이므로, 배치에 해당하는 값만 얹는다.
인자 : CustomEditorNode[] currentNodes -> 병합 시점의 editor store 노드 목록
CustomEditorNode[] layoutedNodes -> 배치를 계산한 노드 목록
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
    레이아웃이 소유하는 값은 좌표와, 계산이 정한 배치 상자 크기, 정렬 방향이 정하는 핸들 위치다.
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
  배열 순서까지 담는 것은 노드 배열 순서가 형제 배치를 정하기 때문이다(sortEdgesByTargetOrder).

  ID를 빼고 개수만 담으면 개수가 같은 채로 구성이 바뀌는 경우(트리 전환)를 놓치므로 빼지 않는다.
  */
  const nodeIds = nodes.map((node) => node.id);

  /*
  엣지는 ID 대신 연결 관계로 비교한다. 부모를 바꾸는 노드 이동은 엣지 ID를 유지한 채 source만
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
