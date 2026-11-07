import { describe, expect, it } from "vitest";
import { LECTURE_SCENARIO_FIXTURES } from "../scenario/fixtures";
import { getLectureTreeOutline } from "./treeOutline";

describe("getLectureTreeOutline", () => {
  it("깊이마다 두 칸씩 들여 쓰고 형제는 목록 순서를 따른다", () => {
    expect(
      getLectureTreeOutline([
        { id: "1", parentId: null, name: "루트" },
        { id: "3", parentId: "1", name: "둘째" },
        { id: "2", parentId: "1", name: "첫째" },
        { id: "4", parentId: "2", name: "손자" },
      ]),
    ).toBe(
      ["- [1] 루트", "  - [3] 둘째", "  - [2] 첫째", "    - [4] 손자"].join(
        "\n",
      ),
    );
  });

  it("제목의 줄바꿈과 빈 제목이 트리 모양을 깨지 않는다", () => {
    expect(
      getLectureTreeOutline([
        { id: "1", parentId: null, name: "  여러\n줄  제목 " },
        { id: "2", parentId: "1", name: "   " },
      ]),
    ).toBe(["- [1] 여러 줄 제목", "  - [2] (제목 없음)"].join("\n"));
  });

  it("목록에 없는 부모를 가리키는 노드는 루트로 보인다", () => {
    expect(
      getLectureTreeOutline([
        { id: "1", parentId: null, name: "루트" },
        { id: "5", parentId: "99", name: "떨어진 노드" },
      ]),
    ).toBe(["- [1] 루트", "- [5] 떨어진 노드"].join("\n"));
  });

  it("순환이 있어도 멈춘다", () => {
    expect(
      getLectureTreeOutline([
        { id: "1", parentId: null, name: "루트" },
        { id: "2", parentId: "3", name: "가" },
        { id: "3", parentId: "2", name: "나" },
      ]),
    ).toBe("- [1] 루트");
  });

  it("fixture 트리의 모든 노드를 한 번씩 담는다", () => {
    for (const { tree } of LECTURE_SCENARIO_FIXTURES) {
      const lines = getLectureTreeOutline(tree).split("\n");

      expect(lines).toHaveLength(tree.length);
      expect(lines.map((line) => line.match(/\[(\d+)\]/)?.[1]).sort()).toEqual(
        tree.map(({ id }) => id).sort(),
      );
    }
  });
});
