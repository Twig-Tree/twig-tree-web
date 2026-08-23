import { describe, it, expect } from "vitest";
import { getLayoutStructureSignature, mergeLayoutResult } from "./layout";
import { Position } from "@xyflow/react";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

const createNode = (
  id: string,
  position: { x: number; y: number },
  label = `node ${id}`,
): CustomEditorNode => ({
  id,
  type: "custom",
  // 레이아웃은 serverId를 읽지 않으므로 저장 여부를 구분하지 않는다.
  data: { serverId: null, label, orderIndex: 0, memo: null },
  position,
});

/*
ELK 계산 결과의 노드는 좌표뿐 아니라 배치 상자 크기와 핸들 위치를 함께 들고 온다.
*/
const createLayoutedNode = (
  id: string,
  position: { x: number; y: number },
  label = `node ${id}`,
): CustomEditorNode => ({
  ...createNode(id, position, label),
  width: 150,
  height: 50,
  targetPosition: Position.Left,
  sourcePosition: Position.Right,
});

describe("mergeLayoutResult", () => {
  it("ID가 일치하는 노드에 계산된 좌표를 반영한다", () => {
    const currentNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("2", { x: 0, y: 0 }),
    ];
    const layoutedNodes = [
      createNode("1", { x: 10, y: 20 }),
      createNode("2", { x: 30, y: 40 }),
    ];

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

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

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("42");
    expect(merged[0].position).toEqual({ x: 150, y: 0 }); // 좌표는 다음 레이아웃 실행이 잡는다.
  });

  it("계산 중 수정된 label을 계산 시작 시점의 값으로 덮지 않는다", () => {
    const currentNodes = [createNode("1", { x: 0, y: 0 }, "수정한 제목")];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 }, "이전 제목")];

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged[0].data.label).toBe("수정한 제목");
    expect(merged[0].position).toEqual({ x: 10, y: 20 });
  });

  it("계산 이후 추가된 노드는 현재 위치를 유지한 채 남는다", () => {
    const currentNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("temp_new", { x: 150, y: 0 }),
    ];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 })];

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

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

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.id)).toEqual(["1"]);
  });

  it("좌표가 그대로인 노드는 같은 객체로 남긴다", () => {
    const unchangedNode = createNode("1", { x: 10, y: 20 });
    const currentNodes = [unchangedNode];
    const layoutedNodes = [createNode("1", { x: 10, y: 20 })];

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged[0]).toBe(unchangedNode);
  });

  /*
  레이아웃이 소유하는 값은 좌표만이 아니다. 노드 너비·높이와 핸들 위치도 계산 결과가 정하므로
  함께 얹지 않으면 노드가 내용 크기로 줄고 연결점이 기본값(상·하)으로 떨어진다.
  */
  it("계산된 크기와 핸들 위치를 함께 반영한다", () => {
    const currentNodes = [createNode("1", { x: 0, y: 0 })];
    const layoutedNodes = [createLayoutedNode("1", { x: 10, y: 20 })];

    const [merged] = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged.width).toBe(150);
    expect(merged.height).toBe(50);
    expect(merged.targetPosition).toBe(Position.Left);
    expect(merged.sourcePosition).toBe(Position.Right);
  });

  it("store와 React Flow가 소유하는 값은 유지한다", () => {
    const currentNodes: CustomEditorNode[] = [
      {
        ...createNode("1", { x: 0, y: 0 }, "수정한 제목"),
        selected: true,
        measured: { width: 94, height: 40 },
      },
    ];
    const layoutedNodes = [
      createLayoutedNode("1", { x: 10, y: 20 }, "이전 제목"),
    ];

    const [merged] = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged.data.label).toBe("수정한 제목");
    expect(merged.selected).toBe(true);
    expect(merged.measured).toEqual({ width: 94, height: 40 });
  });

  it("배치가 그대로면 같은 객체로 남긴다", () => {
    const unchangedNode = createLayoutedNode("1", { x: 10, y: 20 });
    const layoutedNodes = [createLayoutedNode("1", { x: 10, y: 20 })];

    const [merged] = mergeLayoutResult([unchangedNode], layoutedNodes);

    expect(merged).toBe(unchangedNode);
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

    const merged = mergeLayoutResult(currentNodes, layoutedNodes);

    expect(merged.map((node) => node.id)).toEqual(["1", "2", "3"]);
    expect(merged.map((node) => node.position.x)).toEqual([10, 20, 30]);
  });
});

describe("getLayoutStructureSignature", () => {
  const nodes = [
    createNode("1", { x: 0, y: 0 }),
    createNode("2", { x: 0, y: 0 }),
  ];
  const edges = [{ id: "e-1-2", source: "1", target: "2" }];

  it("좌표만 달라지면 같은 시그니처를 낸다", () => {
    const layoutedNodes = [
      createNode("1", { x: 10, y: 20 }),
      createNode("2", { x: 30, y: 40 }),
    ];

    expect(getLayoutStructureSignature(layoutedNodes, edges)).toBe(
      getLayoutStructureSignature(nodes, edges),
    );
  });

  it("제목만 달라지면 같은 시그니처를 낸다", () => {
    const renamedNodes = [
      createNode("1", { x: 0, y: 0 }, "수정한 제목"),
      createNode("2", { x: 0, y: 0 }),
    ];

    expect(getLayoutStructureSignature(renamedNodes, edges)).toBe(
      getLayoutStructureSignature(nodes, edges),
    );
  });

  /*
  노드 추가에 레이아웃이 두 번 도는 것을 막는 조건이다. 서버 응답은 노드에 serverId를 채울 뿐
  배치를 바꾸지 않으므로, 이 변화로 레이아웃이 다시 돌면 계산 한 번이 통째로 낭비된다.
  */
  it("서버 ID만 채워지면 같은 시그니처를 낸다", () => {
    const savedNodes = nodes.map((node) => ({
      ...node,
      data: { ...node.data, serverId: "42" },
    }));

    expect(getLayoutStructureSignature(savedNodes, edges)).toBe(
      getLayoutStructureSignature(nodes, edges),
    );
  });

  /*
  이슈 #51의 남은 구멍이다. 임시 ID가 실제 ID로 교체되면 개수는 그대로지만
  새 노드의 좌표를 잡아 줄 레이아웃이 다시 돌아야 한다.
  */
  it("임시 ID가 실제 ID로 교체되면 다른 시그니처를 낸다", () => {
    const beforeNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("temp_abc", { x: 150, y: 0 }),
    ];
    const beforeEdges = [
      { id: "e-1-temp_abc", source: "1", target: "temp_abc" },
    ];

    const afterNodes = [
      createNode("1", { x: 0, y: 0 }),
      createNode("42", { x: 150, y: 0 }),
    ];
    const afterEdges = [{ id: "e-1-42", source: "1", target: "42" }];

    expect(getLayoutStructureSignature(afterNodes, afterEdges)).not.toBe(
      getLayoutStructureSignature(beforeNodes, beforeEdges),
    );
  });

  /*
  이슈 #50의 경로다. 두 트리의 노드 개수가 우연히 같아도 레이아웃이 실행되어야 한다.
  */
  it("노드 개수가 같아도 ID가 다르면 다른 시그니처를 낸다", () => {
    const otherTreeNodes = [
      createNode("7", { x: 0, y: 0 }),
      createNode("8", { x: 0, y: 0 }),
    ];
    const otherTreeEdges = [{ id: "e-7-8", source: "7", target: "8" }];

    expect(
      getLayoutStructureSignature(otherTreeNodes, otherTreeEdges),
    ).not.toBe(getLayoutStructureSignature(nodes, edges));
  });

  /*
  ELK의 considerModelOrder가 배열 순서로 형제 배치를 정하므로, 순서 변경도 재계산 대상이다.
  */
  it("노드 배열 순서가 바뀌면 다른 시그니처를 낸다", () => {
    const reorderedNodes = [nodes[1], nodes[0]];

    expect(getLayoutStructureSignature(reorderedNodes, edges)).not.toBe(
      getLayoutStructureSignature(nodes, edges),
    );
  });

  /*
  시그니처는 ID 문자열의 형태에 기대지 않는다. 지금은 ID가 숫자 문자열이거나 temp_ 접두사를
  가진 UUID뿐이지만, 구분자로 이어 붙이면 그 전제가 깨졌을 때 서로 다른 구조가 같은 문자열이
  되어 레이아웃이 조용히 실행되지 않는다. 어떤 문자가 들어와도 구분되는지 고정한다.
  */
  it("ID에 구분자로 쓰일 만한 문자가 있어도 서로 다른 구조를 구분한다", () => {
    const splitLeft = [
      createNode("a,b", { x: 0, y: 0 }),
      createNode("c", { x: 0, y: 0 }),
    ];
    const splitRight = [
      createNode("a", { x: 0, y: 0 }),
      createNode("b,c", { x: 0, y: 0 }),
    ];

    expect(getLayoutStructureSignature(splitLeft, [])).not.toBe(
      getLayoutStructureSignature(splitRight, []),
    );

    const edgesLeft = [{ id: "e1", source: "x>y", target: "z" }];
    const edgesRight = [{ id: "e1", source: "x", target: "y>z" }];

    expect(getLayoutStructureSignature([], edgesLeft)).not.toBe(
      getLayoutStructureSignature([], edgesRight),
    );
  });

  /*
  reconnect는 엣지 ID를 유지한 채 연결만 바꾸므로 ID 비교로는 감지되지 않는다.
  */
  it("엣지 ID가 같아도 연결이 바뀌면 다른 시그니처를 낸다", () => {
    const threeNodes = [...nodes, createNode("3", { x: 0, y: 0 })];
    const reconnectedEdges = [{ id: "e-1-2", source: "3", target: "2" }];

    expect(getLayoutStructureSignature(threeNodes, reconnectedEdges)).not.toBe(
      getLayoutStructureSignature(threeNodes, edges),
    );
  });
});
