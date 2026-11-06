import { type TreeNode } from "@/src/entities/tree";

/*
서버 조회 없이 편집기 store를 채우는 트리 ID. 숫자가 아니라서 노드 제목 수정 같은 요청이 실수로 나가도 실제 트리를 가리키지 않는다.
*/
export const ANIMATION_LAB_TREE_ID = "animation-lab";

type FixtureRow = [id: string, parentId: string | null, label: string];

/*
접기, 형제 사이 이동, 깊은 경로 추적을 모두 시험할 수 있도록 깊이와 자식 수를 섞었다.
*/
const FIXTURE_ROWS: FixtureRow[] = [
  ["1", null, "컴퓨터 사이언스"],
  ["2", "1", "자료구조"],
  ["3", "1", "알고리즘"],
  ["4", "1", "운영체제"],
  ["5", "2", "배열"],
  ["6", "2", "스택"],
  ["7", "2", "트리"],
  ["8", "7", "이진 탐색 트리"],
  ["9", "7", "힙"],
  ["10", "3", "정렬"],
  ["11", "3", "탐색"],
  ["12", "10", "퀵 정렬"],
  ["13", "4", "프로세스"],
  ["14", "4", "메모리"],
];

export const ANIMATION_LAB_TREE: TreeNode[] = FIXTURE_ROWS.map(
  ([id, parentId, label], orderIndex) => ({
    id,
    parentId,
    label,
    orderIndex,
    memo: null,
    tagIds: [],
  }),
);
