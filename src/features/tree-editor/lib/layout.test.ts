import { describe, it, expect } from "vitest";
import { mergeLayoutPositions } from "./layout";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

const createNode = (
  id: string,
  position: { x: number; y: number },
  label = `node ${id}`,
): CustomEditorNode => ({
  id,
  type: "custom",
  data: { label, orderIndex: 0, memo: null },
  position,
});

describe("mergeLayoutPositions", () => {
  it("ID가 일치하는 노드에 계산된 좌표를 반영한다", () => {
    const currentNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("2", { x: 0, y: 0 }),
    ];
    const layoutedNodes = [
      createNode("1", { x: 10, y: 20 }),
      createNode("2", { x: 30, y: 40 }),
    ];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.position)).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  /*
  이슈 #51의 회귀 케이스다. 계산이 도는 사이에 서버 응답이 도착해 임시 ID가 실제 ID로
  바뀌면, 계산 결과에는 임시 ID만 남아 있다. 이때 실제 ID가 임시 ID로 되돌아가면 안 된다.
  */
  it("계산 중 임시 ID가 실제 ID로 교체된 노드를 되돌리지 않는다", () => {
    const currentNodes = [createNode("42", { x: 150, y: 0 }, "Added node 1")];
    const layoutedNodes = [
      createNode("temp_abc", { x: 300, y: 80 }, "Added node 1"),
    ];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("42");
    expect(merged[0].position).toEqual({ x: 150, y: 0 }); // 좌표는 다음 레이아웃 실행이 잡는다.
  });

  it("계산 중 수정된 label을 계산 시작 시점의 값으로 덮지 않는다", () => {
    const currentNodes = [createNode("1", { x: 0, y: 0 }, "수정한 제목")];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 }, "이전 제목")];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged[0].data.label).toBe("수정한 제목");
    expect(merged[0].position).toEqual({ x: 10, y: 20 });
  });

  it("계산 이후 추가된 노드는 현재 위치를 유지한 채 남는다", () => {
    const currentNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("temp_new", { x: 150, y: 0 }),
    ];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 })];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.id)).toEqual(["1", "temp_new"]);
    expect(merged[1].position).toEqual({ x: 150, y: 0 });
  });

  /*
  삭제와 rollback도 같은 경합에 놓인다. 병합은 현재 store 노드만 결과에 담으므로
  계산 시작 시점에만 존재하던 노드가 되살아나지 않는다.
  */
  it("계산 이후 삭제된 노드를 되살리지 않는다", () => {
    const currentNodes = [createNode("1", { x: 0, y: 0 })];
    const layoutedNodes = [
      createNode("1", { x: 10, y: 20 }),
      createNode("2", { x: 30, y: 40 }),
    ];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.id)).toEqual(["1"]);
  });

  it("좌표가 그대로인 노드는 같은 객체로 남긴다", () => {
    const unchangedNode = createNode("1", { x: 10, y: 20 });
    const currentNodes = [unchangedNode];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 })];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged[0]).toBe(unchangedNode);
  });

  it("노드 배열의 순서를 바꾸지 않는다", () => {
    const currentNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("2", { x: 0, y: 0 }),
      createNode("3", { x: 0, y: 0 }),
    ];
    const layoutedNodes = [
      createNode("3", { x: 30, y: 0 }),
      createNode("1", { x: 10, y: 0 }),
      createNode("2", { x: 20, y: 0 }),
    ];

    const merged = mergeLayoutPositions(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.id)).toEqual(["1", "2", "3"]);
    expect(merged.map((node) => node.position.x)).toEqual([10, 20, 30]);
  });
});
