import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useLectureStore } from "../lecture/lectureStore";
import { useTreeStore } from "../treeStore";
import { useNodeActionShortcuts } from "./useNodeActionShortcuts";

/*
jsdom의 navigator.platform은 빈 문자열이라 Windows 표로 판단한다.
노드 제목 버튼과 노드 아래 버튼은 React Flow가 그리는 구조를 흉내 낸다.
*/
const CANVAS_HTML = `
  <div class="react-flow__node" data-id="c1">
    <button class="custom-node__content">첫 노드</button>
  </div>
  <div class="react-flow__node-toolbar" data-id="c1">
    <button aria-label="메모 열기"></button>
    <button aria-label="자식 노드 추가"></button>
  </div>
`;

const createNode = (clientId: string, selected: boolean) => ({
  ...createEditorNode({
    clientId,
    serverId: clientId,
    label: clientId,
    orderIndex: 1,
    version: 1,
    x: 0,
    y: 0,
  }),
  selected,
});

const press = (
  target: Element,
  key: string,
  options: KeyboardEventInit = {},
) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);

  return event;
};

describe("useNodeActionShortcuts", () => {
  let canvas: HTMLDivElement;
  let outside: HTMLButtonElement;

  const getNodeTitle = () =>
    canvas.querySelector<HTMLButtonElement>(".custom-node__content")!;

  const onToggleGuide = vi.fn();

  const renderShortcuts = (targetClientId: string | null = "c1") => {
    const onRunAction = vi.fn();
    renderHook(() =>
      useNodeActionShortcuts({
        canvasRef: { current: canvas },
        targetClientId,
        onRunAction,
        onToggleGuide,
      }),
    );

    return onRunAction;
  };

  beforeEach(() => {
    canvas = document.createElement("div");
    canvas.innerHTML = CANVAS_HTML;
    outside = document.createElement("button");
    document.body.append(canvas, outside);

    useTreeStore.getState().initializeTree({
      treeId: "5",
      nodes: [createNode("c1", true), createNode("c2", false)],
      edges: [],
    });
  });

  afterEach(() => {
    onToggleGuide.mockClear();
    document.body.innerHTML = "";
    useTreeStore.getState().resetTree();
    useLectureStore.setState({ status: "idle" });
  });

  /*
  CustomNode는 제목 버튼의 Enter로 이름 편집을 시작하고 전파를 막으므로, 그보다 먼저 받아 메모 열기로 실행해야 한다.
  */
  it("노드 제목 버튼에서 누른 단축키를 제목 버튼보다 먼저 받아 실행한다", () => {
    const onRunAction = renderShortcuts();
    const titleKeyDown = vi.fn();
    getNodeTitle().addEventListener("keydown", titleKeyDown);

    press(getNodeTitle(), "Enter");
    press(getNodeTitle(), "ArrowRight");
    press(getNodeTitle(), "F2");
    press(getNodeTitle(), "Delete");

    expect(onRunAction.mock.calls).toEqual([
      ["openMemo"],
      ["addChild"],
      ["rename"],
      ["delete"],
    ]);
    expect(titleKeyDown).not.toHaveBeenCalled();
  });

  it("페이지 바탕에서 누른 단축키도 받는다", () => {
    const onRunAction = renderShortcuts();

    press(document.body, "Backspace");

    expect(onRunAction).toHaveBeenCalledWith("delete");
  });

  /*
  검색 패널이나 메모 패널에서 누른 키가 선택한 노드를 바꾸면 안 된다.
  */
  it("캔버스 밖에서 누른 키는 받지 않는다", () => {
    const onRunAction = renderShortcuts();

    const event = press(outside, "Delete");

    expect(onRunAction).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("입력 중이거나 메뉴가 열려 있으면 받지 않는다", () => {
    const onRunAction = renderShortcuts();
    const input = document.createElement("input");
    canvas.append(input);

    press(input, "Delete");

    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    document.body.append(menu);

    press(getNodeTitle(), "Delete");

    expect(onRunAction).not.toHaveBeenCalled();
  });

  it("단축키를 막지 않는다고 표시한 대화상자가 열려 있으면 받는다", () => {
    const onRunAction = renderShortcuts();
    const guide = document.createElement("div");
    guide.setAttribute("role", "dialog");
    guide.dataset.nonBlocking = "";
    document.body.append(guide);

    press(getNodeTitle(), "Delete");

    expect(onRunAction).toHaveBeenCalledWith("delete");
  });

  /*
  강의 중에는 →가 다음 비트, Escape가 강의 종료다.
  */
  it("강의 중에는 아무 키도 받지 않는다", () => {
    useLectureStore.setState({ status: "playing" });
    const onRunAction = renderShortcuts();

    const arrowEvent = press(getNodeTitle(), "ArrowRight");
    press(getNodeTitle(), "Escape");

    expect(onRunAction).not.toHaveBeenCalled();
    expect(arrowEvent.defaultPrevented).toBe(false);
    expect(useTreeStore.getState().nodes[0].selected).toBe(true);
  });

  it("수정키를 함께 누르거나 키를 누르고 있으면 받지 않는다", () => {
    const onRunAction = renderShortcuts();

    press(getNodeTitle(), "ArrowRight", { shiftKey: true });
    press(getNodeTitle(), "ArrowRight", { repeat: true });

    expect(onRunAction).not.toHaveBeenCalled();
  });

  it("동작 대상이 없으면 동작을 실행하지 않고 키를 넘긴다", () => {
    const onRunAction = renderShortcuts(null);

    const event = press(getNodeTitle(), "ArrowRight");

    expect(onRunAction).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("Escape로 선택을 풀고 React Flow까지 전파하지 않는다", () => {
    renderShortcuts();
    const bubbled = vi.fn();
    canvas.addEventListener("keydown", bubbled);

    press(getNodeTitle(), "Escape");

    expect(useTreeStore.getState().nodes.some((node) => node.selected)).toBe(
      false,
    );
    expect(bubbled).not.toHaveBeenCalled();
  });

  it("동작 대상 노드에서 Tab을 누르면 노드 아래 첫 버튼으로 focus를 옮긴다", () => {
    renderShortcuts();

    const event = press(getNodeTitle(), "Tab");

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(
      canvas.querySelector('[aria-label="메모 열기"]'),
    );
  });

  /*
  노드 아래 버튼 안의 Escape는 노드로 돌아가는 키, Enter는 버튼을 누르는 키다.
  */
  it("노드 아래 버튼에서 누른 키는 받지 않는다", () => {
    const onRunAction = renderShortcuts();
    const toolbarButton = canvas.querySelector("[aria-label='메모 열기']")!;

    press(toolbarButton, "Enter");
    press(toolbarButton, "Escape");

    expect(onRunAction).not.toHaveBeenCalled();
    expect(useTreeStore.getState().nodes[0].selected).toBe(true);
  });

  /*
  안내는 무엇을 누를지 모를 때 여는 것이라, 단축키를 받지 않는 곳에서도 연다.
  */
  it("?는 캔버스 밖과 강의 중에도 안내를 열고 닫는다", () => {
    useLectureStore.setState({ status: "playing" });
    renderShortcuts(null);

    press(outside, "?", { shiftKey: true });
    press(getNodeTitle(), "?", { shiftKey: true });

    expect(onToggleGuide).toHaveBeenCalledTimes(2);
  });

  it("입력 중에 누른 ?는 글자로 넘긴다", () => {
    renderShortcuts();
    const input = document.createElement("input");
    canvas.append(input);

    const event = press(input, "?", { shiftKey: true });

    expect(onToggleGuide).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
