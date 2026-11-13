import { act, fireEvent, render, screen } from "@testing-library/react";
import { type NodeProps, ReactFlowProvider } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useEditingStore } from "../model/sync/editingStore";
import { useTreeStore } from "../model/treeStore";
import { type CustomEditorNode } from "../model/types";
import { CustomNode } from "./CustomNode";

const NODES = [
  createEditorNode({
    clientId: "c1",
    serverId: "11",
    label: "첫 노드",
    orderIndex: 1,
    version: 1,
    x: 0,
    y: 0,
  }),
  createEditorNode({
    clientId: "c2",
    serverId: "12",
    label: "둘째 노드",
    orderIndex: 2,
    version: 1,
    x: 0,
    y: 0,
  }),
];

/*
React Flow 없이 노드 하나만 그리므로, 이 컴포넌트가 읽는 값만 채운다.
*/
const renderNodes = () => {
  const { wrapper: QueryWrapper } = createQueryWrapper();

  return render(
    <QueryWrapper>
      <ReactFlowProvider>
        {NODES.map((node) => (
          <CustomNode
            key={node.id}
            {...({
              id: node.id,
              data: node.data,
            } as NodeProps<CustomEditorNode>)}
          />
        ))}
      </ReactFlowProvider>
    </QueryWrapper>,
  );
};

const requestNodeNameEdit = (clientId: string) => {
  act(() => {
    useEditingStore.getState().requestNodeNameEdit(clientId);
  });
};

describe("CustomNode 이름 편집 요청", () => {
  beforeEach(() => {
    useTreeStore
      .getState()
      .initializeTree({ treeId: "5", nodes: NODES, edges: [] });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useEditingStore.setState({ nameEditRequest: null });
  });

  it("요청한 노드의 입력창만 열고 제목 전체를 선택한다", () => {
    renderNodes();

    requestNodeNameEdit("c2");

    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "노드 제목",
    });

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(input.value).toBe("둘째 노드");
    expect(input).toHaveFocus();
    expect(input.selectionEnd! - input.selectionStart!).toBe(
      "둘째 노드".length,
    );
    expect(
      screen.getByRole("button", { name: "노드 제목 첫 노드 편집" }),
    ).toBeInTheDocument();
  });

  /*
  요청은 store에 남아 있으므로, 받는 순간이 아니라 남은 값으로 열면 접혔다 펼친 노드가 지난 요청으로 다시 열린다.
  */
  it("그려지기 전에 온 요청으로는 열지 않는다", () => {
    useEditingStore.getState().requestNodeNameEdit("c1");

    renderNodes();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("입력 중에 같은 노드에 다시 요청해도 입력값을 되돌리지 않는다", () => {
    renderNodes();
    requestNodeNameEdit("c1");

    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "노드 제목",
    });

    fireEvent.change(input, { target: { value: "고친 제목" } });

    requestNodeNameEdit("c1");

    expect(input.value).toBe("고친 제목");
  });
});
