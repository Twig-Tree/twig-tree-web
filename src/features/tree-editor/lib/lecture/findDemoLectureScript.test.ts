import { describe, expect, it } from "vitest";
import { type DemoTreeNode, GOGURYEO_DEMO_TREE } from "@/src/entities/lecture";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { findDemoLectureScript } from "./findDemoLectureScript";
import { getEditorLectureScript } from "./getEditorLectureScript";

type TreeRow = [
  clientId: string,
  parentClientId: string | null,
  label: string,
  serverId: string | null,
];

const createTree = (rows: TreeRow[]) => ({
  nodes: rows.map(([clientId, , label, serverId], orderIndex) =>
    createEditorNode({ clientId, serverId, label, orderIndex, x: 0, y: 0 }),
  ),
  edges: rows.flatMap(([clientId, parentClientId]) =>
    parentClientId === null
      ? []
      : [
          createEditorEdge({
            sourceClientId: parentClientId,
            targetClientId: clientId,
          }),
        ],
  ),
});

const COMPUTER_SCIENCE_ROWS: TreeRow[] = [
  ["root", null, "컴퓨터 사이언스", "501"],
  ["ds", "root", "자료구조", "502"],
  ["array", "ds", "배열", "503"],
  ["stack", "ds", "스택", "504"],
  ["algo", "root", "알고리즘", "505"],
  ["sort", "algo", "정렬", "506"],
];

const WORLD_GEOGRAPHY_ROWS: TreeRow[] = [
  ["world", null, "세계", "601"],
  ["europe", "world", "유럽", "602"],
  ["asia", "world", "아시아", "603"],
  ["france", "europe", "프랑스", "604"],
  ["germany", "europe", "독일", "605"],
  ["euro", "europe", "유로", "606"],
  ["paris", "france", "파리", "607"],
  ["berlin", "germany", "베를린", "608"],
  ["korea", "asia", "대한민국", "609"],
  ["japan", "asia", "일본", "610"],
  ["seoul", "korea", "서울", "611"],
  ["won", "korea", "원", "612"],
  ["tokyo", "japan", "도쿄", "613"],
  ["yen", "japan", "엔", "614"],
];

/*
DB에 만들 트리 원본이 대본의 이름 경로와 맞는지 보려고 원본을 그대로 행으로 편다.
*/
const createRowsFromDemoTree = (root: DemoTreeNode): TreeRow[] => {
  const rows: TreeRow[] = [];

  const visit = (node: DemoTreeNode, parentClientId: string | null) => {
    const clientId = `c${rows.length}`;

    rows.push([clientId, parentClientId, node.name, String(rows.length + 1)]);
    node.children?.forEach((child) => visit(child, clientId));
  };

  visit(root, null);

  return rows;
};

describe("findDemoLectureScript", () => {
  it("이름 구조가 맞는 트리의 서버 노드 ID로 세계 지리 대본을 만든다", () => {
    const { nodes, edges } = createTree(WORLD_GEOGRAPHY_ROWS);

    const script = findDemoLectureScript(nodes, edges);

    expect(script?.id).toBe("world-geography-capitals-and-currencies");
    expect(script?.scenes[0].nodeId).toBe("601");
    expect(script?.scenes).toHaveLength(4);
    expect(script?.scenes.flatMap((scene) => scene.beats)).toHaveLength(12);
    expect(script && getEditorLectureScript(script, nodes)).not.toBeNull();
  });

  it("이름 구조가 맞는 트리의 서버 노드 ID로 컴퓨터 사이언스 대본을 만든다", () => {
    const { nodes, edges } = createTree(COMPUTER_SCIENCE_ROWS);

    const script = findDemoLectureScript(nodes, edges);

    expect(script?.id).toBe("demo-computer-science");
    expect(script?.scenes.map((scene) => scene.nodeId)).toEqual([
      "501",
      "502",
      "503",
      "504",
      "505",
    ]);
    expect(script?.scenes.flatMap((scene) => scene.beats)).toHaveLength(13);
    expect(script && getEditorLectureScript(script, nodes)).not.toBeNull();
  });

  it("고구려 트리 원본으로 만든 트리에서 고구려 대본을 만든다", () => {
    const { nodes, edges } = createTree(
      createRowsFromDemoTree(GOGURYEO_DEMO_TREE),
    );

    const script = findDemoLectureScript(nodes, edges);

    expect(script?.id).toBe("korean-history-goguryeo");
    expect(script?.scenes).toHaveLength(6);
    expect(script?.scenes.flatMap((scene) => scene.beats)).toHaveLength(18);
    expect(script && getEditorLectureScript(script, nodes)).not.toBeNull();
  });

  it("데모 구조 밖의 노드가 더 있어도 대본을 만든다", () => {
    const { nodes, edges } = createTree([
      ...COMPUTER_SCIENCE_ROWS,
      ["extra", "root", "운영체제", "507"],
    ]);

    expect(findDemoLectureScript(nodes, edges)?.id).toBe(
      "demo-computer-science",
    );
  });

  it("노드 하나라도 이름이 다르면 null을 돌려준다", () => {
    const { nodes, edges } = createTree(
      COMPUTER_SCIENCE_ROWS.map((row) =>
        row[0] === "sort" ? ["sort", "algo", "탐색", "506"] : row,
      ),
    );

    expect(findDemoLectureScript(nodes, edges)).toBeNull();
  });

  it("대상 노드가 아직 저장되지 않아 서버 ID가 없으면 null을 돌려준다", () => {
    const { nodes, edges } = createTree(
      COMPUTER_SCIENCE_ROWS.map((row) =>
        row[0] === "sort" ? ["sort", "algo", "정렬", null] : row,
      ),
    );

    expect(findDemoLectureScript(nodes, edges)).toBeNull();
  });
});
