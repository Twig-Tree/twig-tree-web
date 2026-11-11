import { type TreeNode } from "@/src/entities/tree";

/*
서버 조회 없이 편집기 store를 채우는 트리 ID의 앞부분. 숫자가 아니라서 제품 노드의 제목 저장 같은 요청이 실수로 나가도 실제 트리를 가리키지 않는다.
트리를 처음 상태로 되돌릴 때는 뒤에 회차를 붙여 useInitializeTree가 store를 새로 채우게 한다.
*/
export const NODE_ACTION_LAB_TREE_ID = "node-action-lab";

type FixtureRow = [id: string, parentId: string | null, label: string];

/*
루트 삭제 금지, 하위 트리째 삭제, 접힌 노드에 자식 추가를 모두 시험할 수 있도록 깊이를 섞었다.
기본 펼침 깊이(2)보다 깊은 노드가 있어 처음 열면 일부가 접혀 있다.
*/
const FIXTURE_ROWS: FixtureRow[] = [
  ["1", null, "웹 개발 입문"],
  ["2", "1", "HTML"],
  ["3", "1", "CSS"],
  ["4", "1", "JavaScript"],
  ["5", "2", "시맨틱 태그"],
  ["6", "2", "폼"],
  ["7", "3", "레이아웃"],
  ["8", "7", "Flexbox"],
  ["9", "7", "Grid"],
  ["10", "4", "변수와 타입"],
  ["11", "4", "비동기"],
  ["12", "11", "Promise"],
  ["13", "11", "async/await"],
];

export const NODE_ACTION_LAB_TREE: TreeNode[] = FIXTURE_ROWS.map(
  ([id, parentId, label], orderIndex) => ({
    id,
    parentId,
    label,
    orderIndex,
    memo: id === "4" ? "브라우저에서 동작을 만드는 언어" : null, // 메모가 있는 노드와 없는 노드를 함께 둔다
    version: 0,
    tagIds: [],
  }),
);
