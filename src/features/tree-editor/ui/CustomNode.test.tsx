import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { type NodeProps, ReactFlowProvider } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NODE_ERROR_CODE, nodeApi, type TreeNode } from "@/src/entities/tree";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
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
    useEditingStore.setState({ nameEditRequest: null, nameEditors: new Map() });
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

  /*
  두 곳에서 열면 검증 실패나 충돌 안내로 남은 입력창이 서로 focus를 가져가며 blur 저장을 일으킨다.
  */
  it("메모 패널에서 같은 노드를 편집 중이면 요청·더블클릭·키보드로 열지 않는다", () => {
    useEditingStore.getState().startNodeNameEditing("c1", "panel");
    renderNodes();

    requestNodeNameEdit("c1");

    const title = screen.getByRole("button", {
      name: "노드 제목 첫 노드 편집",
    });

    fireEvent.doubleClick(title);
    fireEvent.keyDown(title, { key: "Enter" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(useEditingStore.getState().nameEditors.get("c1")).toBe("panel");
  });

  it("메모 패널이 편집 중인 노드가 아니면 연다", () => {
    useEditingStore.getState().startNodeNameEditing("c2", "panel");
    renderNodes();

    requestNodeNameEdit("c1");

    expect(
      screen.getByRole("textbox", { name: "노드 제목" }),
    ).toBeInTheDocument();
  });
});

describe("CustomNode 이름 저장", () => {
  const SAVED_NODE: TreeNode = {
    id: "11",
    parentId: null,
    label: "새 제목",
    orderIndex: 1,
    memo: null,
    version: 2,
    tagIds: [],
  };

  const openNameInput = () => {
    renderNodes();
    requestNodeNameEdit("c1");

    return screen.getByRole<HTMLInputElement>("textbox", {
      name: "노드 제목",
    });
  };

  const typeName = (input: HTMLInputElement, name: string) => {
    fireEvent.change(input, { target: { value: name } });
  };

  const pressKey = (input: HTMLInputElement, key: string) => {
    fireEvent.keyDown(input, { key });
  };

  beforeEach(() => {
    useTreeStore
      .getState()
      .initializeTree({ treeId: "5", nodes: NODES, edges: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditingStore.setState({
      nameEditRequest: null,
      nameEditors: new Map(),
    });
  });

  it("입력창이 열려 있는 동안만 입력 중으로 알린다", async () => {
    vi.spyOn(nodeApi, "editNodeName").mockResolvedValue(SAVED_NODE);
    const input = openNameInput();

    expect(useEditingStore.getState().nameEditors.get("c1")).toBe("canvas");

    typeName(input, "새 제목");
    pressKey(input, "Enter");

    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
    expect(useEditingStore.getState().nameEditors.size).toBe(0);
  });

  /*
  이 테스트는 노드를 고정된 props로 그리므로, 바뀐 제목은 화면이 아니라 store에서 확인한다.
  */
  it("Enter로 저장하면 입력창을 닫고 store의 제목을 바꾼다", async () => {
    const editNodeNameSpy = vi
      .spyOn(nodeApi, "editNodeName")
      .mockResolvedValue(SAVED_NODE);
    const input = openNameInput();

    typeName(input, "새 제목");
    pressKey(input, "Enter");

    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
    expect(useTreeStore.getState().nodes[0].data.label).toBe("새 제목");
    expect(editNodeNameSpy).toHaveBeenCalledExactlyOnceWith(5, 11, {
      name: "새 제목",
      version: 1,
    });
  });

  it("Escape는 요청 없이 원래 제목으로 닫는다", () => {
    const editNodeNameSpy = vi.spyOn(nodeApi, "editNodeName");
    const input = openNameInput();

    typeName(input, "고친 제목");
    pressKey(input, "Escape");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "노드 제목 첫 노드 편집" }),
    ).toBeInTheDocument();
    expect(editNodeNameSpy).not.toHaveBeenCalled();
  });

  it("검증에 실패하면 요청 없이 입력창에 안내를 남긴다", () => {
    const editNodeNameSpy = vi.spyOn(nodeApi, "editNodeName");
    const input = openNameInput();

    typeName(input, "   ");
    pressKey(input, "Enter");

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(editNodeNameSpy).not.toHaveBeenCalled();
  });

  it("저장에 실패하면 입력창을 남기고 다시 시도하라고 안내한다", async () => {
    vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(new Error("failed"));
    const input = openNameInput();

    typeName(input, "새 제목");
    pressKey(input, "Enter");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "제목을 저장하지 못했습니다. 다시 시도해 주세요.",
    );
    expect(input).toBeInTheDocument();
  });

  it("노드가 다른 곳에서 지워졌으면 알리고 입력창을 닫는다", async () => {
    vi.spyOn(nodeApi, "editNodeName").mockRejectedValue(
      createNodeApiError(404, NODE_ERROR_CODE.NODE_NOT_FOUND),
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const input = openNameInput();

    typeName(input, "새 제목");
    pressKey(input, "Enter");

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("다른 곳에서 삭제된 노드입니다."),
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  describe("다른 곳의 수정과 충돌하면", () => {
    const openConflictedInput = async () => {
      const editNodeNameSpy = vi
        .spyOn(nodeApi, "editNodeName")
        .mockRejectedValueOnce(
          createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
        )
        .mockResolvedValueOnce({ ...SAVED_NODE, version: 10 });
      vi.spyOn(nodeApi, "getNode").mockResolvedValue({
        ...SAVED_NODE,
        label: "다른 곳의 제목",
        version: 9,
      });
      const input = openNameInput();

      typeName(input, "새 제목");
      pressKey(input, "Enter");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "다른 곳에서 수정되었습니다. Enter로 덮어쓰거나 Esc로 취소할 수 있습니다.",
      );

      return { input, editNodeNameSpy };
    };

    it("입력값을 남기고, 입력을 고쳐도 안내를 지우지 않는다", async () => {
      const { input } = await openConflictedInput();

      expect(input.value).toBe("새 제목");

      typeName(input, "새 제목!");

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("blur로는 저장하지 않는다", async () => {
      const { input, editNodeNameSpy } = await openConflictedInput();

      fireEvent.blur(input);

      expect(editNodeNameSpy).toHaveBeenCalledTimes(1);
      expect(input).toBeInTheDocument();
    });

    it("Enter로 최신 version에 덮어쓴다", async () => {
      const { input, editNodeNameSpy } = await openConflictedInput();

      pressKey(input, "Enter");

      await waitFor(() =>
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
      );
      expect(editNodeNameSpy).toHaveBeenLastCalledWith(5, 11, {
        name: "새 제목",
        version: 9,
      });
    });
  });
});

describe("CustomNode 강의 sparkle", () => {
  beforeEach(() => {
    useTreeStore
      .getState()
      .initializeTree({ treeId: "5", nodes: NODES, edges: [] });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useLectureAnimationStore.getState().resetVisual();
  });

  it("sparkle로 강조한 노드에만 반짝이를 그린다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "sparkle",
      type: "highlight",
      clientIds: new Set(["c1"]),
      style: "sparkle",
      tone: "success",
    });

    renderNodes();

    const sparkles = screen.getAllByTestId("lecture-sparkles");
    expect(sparkles).toHaveLength(1);
    expect(sparkles[0].closest(".custom-node")).toHaveAttribute(
      "data-lecture-highlight-style",
      "sparkle",
    );
  });

  it("다른 모양의 강조에는 반짝이를 그리지 않는다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "pop",
      type: "highlight",
      clientIds: new Set(["c1"]),
      style: "pop",
    });

    renderNodes();

    expect(screen.queryByTestId("lecture-sparkles")).toBeNull();
  });
});

describe("CustomNode 강의 grow", () => {
  beforeEach(() => {
    useTreeStore
      .getState()
      .initializeTree({ treeId: "5", nodes: NODES, edges: [] });
  });

  afterEach(() => {
    useTreeStore.getState().resetTree();
    useLectureAnimationStore.getState().resetVisual();
  });

  it("숨긴 노드의 입력·출력 연결점을 함께 숨긴다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "grow",
      type: "grow",
      hiddenClientIds: new Set(["c2"]),
      enteringClientIds: new Set(),
    });

    renderNodes();

    const node = screen
      .getByRole("button", { name: "노드 제목 둘째 노드 편집" })
      .closest(".custom-node");
    const handles = node?.querySelectorAll<HTMLElement>(".react-flow__handle");

    expect(handles).toHaveLength(2);
    handles?.forEach((handle) => {
      expect(handle.style.visibility).toBe("hidden");
    });
  });
});
