/*
외부 모델에 넘길 트리 노드. 편집기 store와 시나리오 fixture처럼 모양이 다른 트리를 이 모양으로 옮겨 넘긴다.
*/
export type LectureOutlineNode = {
  id: string; // 서버 노드 ID. 시나리오가 노드를 가리킬 때 쓰는 값이다
  parentId: string | null; // 루트면 null
  name: string; // 노드 제목
};

const OUTLINE_INDENT = "  ";
const UNTITLED_NODE_NAME = "(제목 없음)";

/*
함수 이름 : getOutlineNodeName
기능 : 노드 제목을 outline 한 줄에 맞게 다듬는다. 줄바꿈이 들어 있으면 트리 모양이 깨지므로 공백 하나로 합친다.
인자 : string name -> 노드 제목
반환값 : 한 줄로 다듬은 제목. 비어 있으면 제목 없음 표시
*/
const getOutlineNodeName = (name: string): string =>
  name.replace(/\s+/g, " ").trim() || UNTITLED_NODE_NAME;

/*
함수 이름 : getLectureTreeOutline
기능 : 트리를 외부 모델에 넘길 들여쓴 텍스트로 바꾼다. 한 줄에 노드 하나이고, 모델은 대괄호 안의 ID로 노드를 가리킨다.
형제 순서는 목록 순서를 따른다. 컴파일러의 트리 창구(createLectureCompilerTree)와 같은 기준이다.
목록에 없는 부모를 가리키는 노드는 루트로 보인다. 모델이 그 노드를 가리켜도 컴파일러가 노드로 인정하기 때문이다.
인자 : LectureOutlineNode[] nodes -> 형제끼리 화면 순서대로 놓인 노드 목록
반환값 : 깊이마다 두 칸씩 들여쓴 "- [ID] 제목" 줄들

예:
- [1] HTTP 요청 흐름
  - [2] 브라우저
    - [3] DNS 조회
*/
export const getLectureTreeOutline = (nodes: LectureOutlineNode[]): string => {
  const nodeIds = new Set(nodes.map(({ id }) => id));
  const childrenByParentId = new Map<string, LectureOutlineNode[]>();
  const roots: LectureOutlineNode[] = [];

  for (const node of nodes) {
    if (node.parentId === null || !nodeIds.has(node.parentId)) {
      roots.push(node);
      continue;
    }

    childrenByParentId.set(node.parentId, [
      ...(childrenByParentId.get(node.parentId) ?? []),
      node,
    ]);
  }

  const lines: string[] = [];
  const visitedIds = new Set<string>(); // 잘못된 데이터로 순환이 생겨도 멈추게 한다

  const appendNode = (node: LectureOutlineNode, depth: number) => {
    if (visitedIds.has(node.id)) return;
    visitedIds.add(node.id);

    lines.push(
      `${OUTLINE_INDENT.repeat(depth)}- [${node.id}] ${getOutlineNodeName(node.name)}`,
    );

    for (const child of childrenByParentId.get(node.id) ?? []) {
      appendNode(child, depth + 1);
    }
  };

  for (const root of roots) appendNode(root, 0);

  return lines.join("\n");
};
