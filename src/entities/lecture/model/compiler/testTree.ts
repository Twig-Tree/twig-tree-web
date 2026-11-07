import { type LectureCompilerTree } from "./types";

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

const NODE_IDS = new Set(["1", ...Object.values(CHILD_IDS).flat()]);

const getParentId = (nodeId: string): string | undefined =>
  Object.keys(CHILD_IDS).find((parentId) =>
    CHILD_IDS[parentId].includes(nodeId),
  );

export const TEST_COMPILER_TREE: LectureCompilerTree = {
  hasNode: (nodeId) => NODE_IDS.has(nodeId),
  getChildIds: (nodeId) => CHILD_IDS[nodeId] ?? [],
  getPathNodeIds: (ancestorNodeId, descendantNodeId) => {
    if (!NODE_IDS.has(descendantNodeId)) return null;

    const path = [descendantNodeId];

    while (path[0] !== ancestorNodeId) {
      const parentId = getParentId(path[0]);
      if (parentId === undefined) return null;
      path.unshift(parentId);
    }

    return path;
  },
};
