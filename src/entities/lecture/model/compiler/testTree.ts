import { createLectureCompilerTree } from "./createLectureCompilerTree";

/*
컴파일러 테스트용 트리. 1 → (2, 3, 4), 2 → (5, 6, 7), 3 → (8, 9, 10), 10 → (11, 12)
recipe registry 테스트의 트리와 같은 모양이다.
*/
const CHILD_IDS: Record<string, string[]> = {
  "1": ["2", "3", "4"],
  "2": ["5", "6", "7"],
  "3": ["8", "9", "10"],
  "10": ["11", "12"],
};

export const TEST_COMPILER_TREE = createLectureCompilerTree([
  { id: "1", parentId: null },
  ...Object.entries(CHILD_IDS).flatMap(([parentId, childIds]) =>
    childIds.map((id) => ({ id, parentId })),
  ),
]);
