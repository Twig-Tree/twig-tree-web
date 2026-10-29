import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import {
  isLectureEdgeTraced,
  isLectureNodeDimmed,
  isLectureNodeHighlighted,
  useLectureAnimationStore,
} from "../model/lecture/lectureAnimationStore";
import { useTreeStore } from "../model/treeStore";
import { LectureAnimationDevPanel } from "./LectureAnimationDevPanel";

const parentNode = createEditorNode({
  clientId: "parent",
  serverId: "1",
  label: "자료구조",
  orderIndex: 0,
  x: 0,
  y: 0,
});
const childNode = createEditorNode({
  clientId: "child",
  serverId: "2",
  label: "배열",
  orderIndex: 0,
  x: 0,
  y: 0,
});
const onRevealNodes = vi.fn();
const onResetCamera = vi.fn();

const renderPanel = (selectedNode: typeof parentNode | null = parentNode) =>
  render(
    <LectureAnimationDevPanel
      selectedNode={selectedNode ?? undefined}
      onRevealNodes={onRevealNodes}
      onResetCamera={onResetCamera}
    />,
  );

beforeEach(() => {
  vi.useFakeTimers();
  onRevealNodes.mockReset();
  onResetCamera.mockReset();
  useTreeStore.getState().resetTree();
  useLectureAnimationStore.getState().resetVisual();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LectureAnimationDevPanel", () => {
  it("선택 노드가 없으면 안내하고 단위 동작을 잠근다", () => {
    renderPanel(null);

    expect(
      screen.getByText("트리에서 노드를 먼저 선택하세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Highlight" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sequence" })).toBeDisabled();
  });

  it("선택 노드를 일정 시간 강조하고 실행 중에는 다른 동작을 잠근다", async () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));

    expect(
      isLectureNodeHighlighted(
        useLectureAnimationStore.getState(),
        parentNode.id,
      ),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Pulse" })).toBeDisabled();

    await act(() => vi.advanceTimersByTimeAsync(900));

    expect(
      isLectureNodeHighlighted(
        useLectureAnimationStore.getState(),
        parentNode.id,
      ),
    ).toBe(false);
    expect(screen.getByRole("button", { name: "Pulse" })).toBeEnabled();
  });

  it("Dim Others는 900ms 동안 선택 노드 외의 노드를 흐리게 한다", async () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Dim Others" }));

    const state = useLectureAnimationStore.getState();
    expect(isLectureNodeDimmed(state, parentNode.id)).toBe(false);
    expect(isLectureNodeDimmed(state, childNode.id)).toBe(true);

    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: Dim Others · 주변 흐림",
    );

    await act(() => vi.advanceTimersByTimeAsync(900));

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent("대기 중");
  });

  it("선택 노드의 첫 자식 연결선을 추적한다", async () => {
    useTreeStore.setState({
      nodes: [parentNode, childNode],
      edges: [
        createEditorEdge({
          sourceClientId: parentNode.id,
          targetClientId: childNode.id,
        }),
      ],
    });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Trace Child" }));

    expect(
      isLectureEdgeTraced(
        useLectureAnimationStore.getState(),
        parentNode.id,
        childNode.id,
      ),
    ).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(900));
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("실행 중 중단하면 시각 효과를 즉시 제거한다", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Pulse" }));

    fireEvent.click(screen.getByRole("button", { name: "중단" }));

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
    expect(screen.getByRole("button", { name: "Pulse" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("대기 중");

    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("대기 중");
  });

  it("Sequence는 현재 동작과 단계 사이 전환을 차례로 표시한다", async () => {
    useTreeStore.setState({
      nodes: [parentNode, childNode],
      edges: [
        createEditorEdge({
          sourceClientId: parentNode.id,
          targetClientId: childNode.id,
        }),
      ],
    });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Sequence" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: Focus · 화면 이동",
    );

    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: 다음 단계 준비",
    );

    await act(() => vi.advanceTimersByTimeAsync(160));
    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: Highlight · 노드 강조",
    );

    await act(() => vi.advanceTimersByTimeAsync(500 + 160));
    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: Trace Child · 연결 추적",
    );

    await act(() => vi.advanceTimersByTimeAsync(1200 + 160));
    expect(screen.getByRole("status")).toHaveTextContent(
      "실행 중: Pulse · 노드 강조",
    );

    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(screen.getByRole("status")).toHaveTextContent("대기 중");
  });
});
