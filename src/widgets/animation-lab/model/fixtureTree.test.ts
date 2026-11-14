import { describe, expect, it } from "vitest";
import { type DemoTreeNode, SHOWCASE_DEMO_TREE } from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "./fixtureTree";

/*
함수 이름 : getDemoTreeFromFixture
기능 : 랩 고정 트리를 데모 트리 원본과 같은 모양으로 바꾼다.
인자 : string | null parentId -> 자식을 모을 부모 노드 ID. 루트를 찾을 때는 null
반환값 : 이름과 자식만 남긴 트리 목록
*/
const getDemoTreeFromFixture = (parentId: string | null): DemoTreeNode[] =>
  ANIMATION_LAB_TREE.filter((node) => node.parentId === parentId).map(
    (node) => {
      const children = getDemoTreeFromFixture(node.id);

      return children.length > 0
        ? { name: node.label, children }
        : { name: node.label };
    },
  );

describe("ANIMATION_LAB_TREE", () => {
  it("발표 시연 트리 원본과 구조가 같아 랩과 편집기에서 같은 화면을 녹화할 수 있다", () => {
    expect(getDemoTreeFromFixture(null)).toEqual([SHOWCASE_DEMO_TREE]);
  });
});
