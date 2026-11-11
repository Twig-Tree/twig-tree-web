import {
  createClientNodeId,
  createEditorEdge,
  createEditorNode,
  getNextOrderIndex,
  type CustomEditorEdge,
  type CustomEditorNode,
} from "@/src/features/tree-editor";

export const NODE_ACTION_IDS = [
  "openMemo",
  "addChild",
  "rename",
  "delete",
] as const;

export type NodeActionId = (typeof NODE_ACTION_IDS)[number];

export const NODE_ACTION_LABELS: Record<NodeActionId, string> = {
  openMemo: "메모 열기",
  addChild: "자식 노드 추가",
  rename: "이름 편집",
  delete: "노드 삭제",
};

/*
동작을 실행한 진입점. 실행 기록에서 어떤 방식으로 동작을 찾았는지 비교하는 데 쓴다.
*/
export type NodeActionEntry = "contextMenu";

export const NODE_ACTION_ENTRY_LABELS: Record<NodeActionEntry, string> = {
  contextMenu: "우클릭 메뉴",
};

/*
함수 이름 : getNodeActionBlockReason
기능 : 노드에 동작을 실행할 수 없는 이유를 돌려준다. 제품 편집기가 막는 조건을 같게 막아, 막힌 동작을 어떻게 알릴지도 함께 본다.
인자 : NodeActionId actionId -> 실행하려는 동작
string clientId -> 대상 노드의 편집기 노드 ID
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 막힌 이유 문구, 실행할 수 있으면 null
*/
export const getNodeActionBlockReason = (
  actionId: NodeActionId,
  clientId: string,
  edges: CustomEditorEdge[],
): string | null => {
  const isRoot = !edges.some((edge) => edge.target === clientId);

  if (actionId === "delete" && isRoot) return "루트 노드는 삭제할 수 없습니다.";

  return null;
};

/*
함수 이름 : createLabChildElements
기능 : 부모 노드 아래에 붙일 새 자식 노드와 엣지를 만든다. 이름과 순번은 제품의 노드 추가와 같은 규칙을 따른다.
인자 : CustomEditorNode parent -> 자식을 붙일 노드
CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 새 노드와 부모에서 새 노드로 가는 엣지

실험실은 서버에 저장하지 않지만 serverId를 채워 저장된 노드처럼 다룬다. 접힘 상태가 serverId로 노드를 가리키므로,
비워 두면 새 노드에는 접기 버튼이 생기지 않고 그 아래에 자식을 붙여도 펼칠 수 없다.
*/
export const createLabChildElements = (
  parent: CustomEditorNode,
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): { node: CustomEditorNode; edge: CustomEditorEdge } => {
  const orderIndex = getNextOrderIndex(parent.id, nodes, edges);
  const clientId = createClientNodeId();

  return {
    node: createEditorNode({
      clientId,
      serverId: `lab-${clientId}`,
      label: `새 노드 ${orderIndex}`,
      orderIndex,
      x: parent.position.x, // 좌표는 레이아웃이 다시 정한다
      y: parent.position.y,
    }),
    edge: createEditorEdge({
      sourceClientId: parent.id,
      targetClientId: clientId,
    }),
  };
};
