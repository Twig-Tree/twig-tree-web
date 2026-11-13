import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NODE_ERROR_CODE, nodeApi, type TreeNode } from "@/src/entities/tree";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useLectureStore } from "../model/lecture/lectureStore";
import { useEditingStore } from "../model/sync/editingStore";
import { useTreeStore } from "../model/treeStore";
import { MemoPanelNodeName } from "./MemoPanelNodeName";

const SAVED_NODE = createEditorNode({
  clientId: "c1",
  serverId: "11",
  label: "첫 노드",
  orderIndex: 1,
  version: 1,
  x: 0,
  y: 0,
});

const SERVER_NODE: TreeNode = {
  id: "11",
  parentId: null,
  label: "새 이름",
  orderIndex: 1,
  memo: null,
  version: 2,
  tagIds: [],
};

const renderNodeName = (node = SAVED_NODE) => {
  const { wrapper } = createQueryWrapper();

  return render(<MemoPanelNodeName treeId="5" node={node} />, { wrapper });
};

const getTitleButton = () => screen.getByRole("button", { name: "첫 노드" });

const openNameInput = () => {
  renderNodeName();
  fireEvent.click(getTitleButton());

  return screen.getByRole<HTMLInputElement>("textbox", { name: "노드 이름" });
};

const typeName = (input: HTMLInputElement, name: string) => {
  fireEvent.change(input, { target: { value: name } });
};

describe("MemoPanelNodeName", () => {
  beforeEach(() => {
    useTreeStore
      .getState()
      .initializeTree({ treeId: "5", nodes: [SAVED_NODE], edges: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useTreeStore.getState().resetTree();
    useEditingStore.setState({ nameEditors: new Map(), nameEditRequest: null });
    useLectureStore.setState({ status: "idle" });
  });

  it("제목을 누르면 이름 전체를 고른 입력창으로 바뀌고, 패널에서 편집 중이라고 알린다", () => {
    const input = openNameInput();

    expect(input.value).toBe("첫 노드");
    expect(input).toHaveFocus();
    expect(input.selectionEnd! - input.selectionStart!).toBe("첫 노드".length);
    expect(
      screen.getByRole("heading", { name: "첫 노드" }),
    ).toBeInTheDocument();
    expect(useEditingStore.getState().nameEditors.get("c1")).toBe("panel");
  });

  /*
  바꿀 수 있다는 안내나 막힌 이유가 제목에 붙으면 화면 읽기 프로그램이 제목을 안내까지 이어 읽는다.
  */
  it("제목은 노드 이름만으로 읽히고, 바꿀 수 있다는 안내는 설명으로 붙는다", () => {
    renderNodeName();

    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName(
      "첫 노드",
    );
    expect(getTitleButton()).toHaveAccessibleDescription(
      "눌러서 이름을 바꿉니다.",
    );
  });

  it("Enter로 저장하면 입력창을 닫고 제목 버튼으로 focus를 돌려준다", async () => {
    const editNodeNameSpy = vi
      .spyOn(nodeApi, "editNodeName")
      .mockResolvedValue(SERVER_NODE);
    const input = openNameInput();

    typeName(input, "새 이름");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(getTitleButton()).toHaveFocus());
    expect(editNodeNameSpy).toHaveBeenCalledExactlyOnceWith(5, 11, {
      name: "새 이름",
      version: 1,
    });
    expect(useTreeStore.getState().nodes[0].data.label).toBe("새 이름");
    expect(useEditingStore.getState().nameEditors.size).toBe(0);
  });

  it("Escape는 요청 없이 닫고 제목 버튼으로 focus를 돌려준다", async () => {
    const editNodeNameSpy = vi.spyOn(nodeApi, "editNodeName");
    const input = openNameInput();

    typeName(input, "고친 이름");
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => expect(getTitleButton()).toHaveFocus());
    expect(editNodeNameSpy).not.toHaveBeenCalled();
  });

  /*
  blur는 사용자가 다른 곳으로 옮긴 것이므로, 저장한 뒤에도 그곳의 focus를 빼앗지 않는다.
  */
  it("다른 곳으로 옮기면 저장하고 focus는 가져오지 않는다", async () => {
    const editNodeNameSpy = vi
      .spyOn(nodeApi, "editNodeName")
      .mockResolvedValue(SERVER_NODE);
    const input = openNameInput();

    typeName(input, "새 이름");
    fireEvent.blur(input);

    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
    await act(
      () =>
        new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
    );

    expect(editNodeNameSpy).toHaveBeenCalledOnce();
    expect(getTitleButton()).not.toHaveFocus();
  });

  it("검증에 실패하면 요청 없이 입력창 아래에 안내를 띄운다", () => {
    const editNodeNameSpy = vi.spyOn(nodeApi, "editNodeName");
    const input = openNameInput();

    typeName(input, "   ");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveAccessibleDescription(
      screen.getByRole("alert").textContent ?? "",
    );
    expect(editNodeNameSpy).not.toHaveBeenCalled();
  });

  it("다른 곳의 수정과 충돌하면 안내하고, Enter로 덮어쓴다", async () => {
    const editNodeNameSpy = vi
      .spyOn(nodeApi, "editNodeName")
      .mockRejectedValueOnce(
        createNodeApiError(409, NODE_ERROR_CODE.VERSION_CONFLICT),
      )
      .mockResolvedValueOnce({ ...SERVER_NODE, version: 10 });
    vi.spyOn(nodeApi, "getNode").mockResolvedValue({
      ...SERVER_NODE,
      label: "다른 곳의 이름",
      version: 9,
    });
    const input = openNameInput();

    typeName(input, "새 이름");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "다른 곳에서 수정되었습니다. Enter로 덮어쓰거나 Esc로 취소하세요.",
    );

    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
    );
    expect(editNodeNameSpy).toHaveBeenLastCalledWith(5, 11, {
      name: "새 이름",
      version: 9,
    });
  });

  describe("이름을 바꿀 수 없을 때", () => {
    /*
    노드 아래 버튼과 같은 이유 문구를 쓴다. 누르기 전에 이유가 읽혀야 저장할 때 alert을 만나지 않는다.
    */
    it.each([
      {
        situation: "저장 전 노드",
        setUp: () =>
          renderNodeName({
            ...SAVED_NODE,
            data: { ...SAVED_NODE.data, serverId: null },
          }),
        reason: "아직 서버에 저장되지 않은 노드입니다.",
      },
      {
        situation: "강의 중",
        setUp: () => {
          useLectureStore.setState({ status: "playing" });
          renderNodeName();
        },
        reason: "강의 중에는 이름을 바꿀 수 없습니다.",
      },
      {
        situation: "캔버스에서 같은 노드를 편집 중",
        setUp: () => {
          useEditingStore.getState().startNodeNameEditing("c1", "canvas");
          renderNodeName();
        },
        reason: "캔버스에서 이름을 편집하는 중입니다.",
      },
    ])("$situation이면 누를 수 없고 이유를 알려 준다", ({ setUp, reason }) => {
      setUp();

      const title = getTitleButton();

      expect(title).toHaveAttribute("aria-disabled", "true");
      expect(title).toHaveAccessibleDescription(reason);

      fireEvent.click(title);

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("캔버스에서 다른 노드를 편집 중이면 누를 수 있다", () => {
      useEditingStore.getState().startNodeNameEditing("c2", "canvas");
      renderNodeName();

      expect(getTitleButton()).not.toHaveAttribute("aria-disabled");
      expect(getTitleButton()).toHaveAccessibleDescription(
        "눌러서 이름을 바꿉니다.",
      );
    });
  });
});
