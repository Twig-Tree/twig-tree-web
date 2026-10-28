import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEMO_LECTURE } from "@/src/entities/lecture";
import { LecturePlayer } from "./LecturePlayer";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useLectureStore } from "../model/lecture/lectureStore";
import { useTreeStore } from "../model/treeStore";

const createNode = (clientId: string, label: string) =>
  createEditorNode({
    clientId,
    serverId: clientId.replace("c", "s"),
    label,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

/*
데모 강의(DEMO_LECTURE)가 가리키는 트리와 같은 모양이다.
*/
const setDemoTree = () =>
  useTreeStore.setState({
    nodes: [
      createNode("c1", "컴퓨터 사이언스"),
      createNode("c2", "자료구조"),
      createNode("c3", "알고리즘"),
      createNode("c4", "배열"),
      createNode("c5", "스택"),
      createNode("c6", "정렬"),
    ],
    edges: [
      createEdge("c1", "c2"),
      createEdge("c1", "c3"),
      createEdge("c2", "c4"),
      createEdge("c2", "c5"),
      createEdge("c3", "c6"),
    ],
  });

const onRevealNodes = vi.fn();

const renderPlayer = () =>
  render(
    <LecturePlayer lecture={DEMO_LECTURE} onRevealNodes={onRevealNodes} />,
  );

/*
jsdom에는 음성 합성 API가 없어 무음 재생으로 동작한다. 타이머가 넘기지 않도록 시간은 흘리지 않는다.
*/
beforeEach(() => {
  onRevealNodes.mockClear();
  useTreeStore.getState().resetTree();
  useLectureStore.getState().resetLecture();
});

afterEach(() => {
  act(() => useLectureStore.getState().resetLecture());
});

describe("LecturePlayer", () => {
  it("강의를 연결할 수 없는 트리면 시작 버튼을 잠그고 이유를 알린다", () => {
    useTreeStore.setState({ nodes: [createNode("c1", "운영체제")], edges: [] });
    renderPlayer();

    const startButton = screen.getByRole("button", { name: "강의 시작" });

    expect(startButton).toBeDisabled();
    expect(startButton).toHaveAccessibleDescription(
      /이 트리에는 데모 강의가 없습니다/,
    );
  });

  it("시작하면 첫 문장 자막과 무음 재생 안내를 보여 주고 첫 구간의 노드로 화면을 옮긴다", async () => {
    setDemoTree();
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    expect(
      screen.getByText(DEMO_LECTURE.segments[0].subtitles[0].text),
    ).toBeInTheDocument();
    expect(screen.getByText("음성 없음 · 자막만 재생")).toBeInTheDocument();
    expect(screen.getByText("구간 1 / 5")).toBeInTheDocument();
    expect(onRevealNodes).toHaveBeenCalledWith(["c1", "c2", "c3"], {
      maxZoom: 1,
      duration: 800,
    });
  });

  it("일시정지하면 재생 버튼으로 바뀌고 일시정지 상태를 알린다", async () => {
    setDemoTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    await userEvent.click(screen.getByRole("button", { name: "일시정지" }));

    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument();
    expect(screen.getByText("구간 1 / 5 · 일시정지됨")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "재생" }));

    expect(
      screen.getByRole("button", { name: "일시정지" }),
    ).toBeInTheDocument();
  });

  it("다음 구간을 누르면 그 구간의 첫 자막과 진행 위치를 보여 준다", async () => {
    setDemoTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    await userEvent.click(screen.getByRole("button", { name: "다음 구간" }));

    expect(
      screen.getByText(DEMO_LECTURE.segments[1].subtitles[0].text),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "강의 진행" }),
    ).toHaveAttribute("aria-valuenow", "2");
  });

  it("마지막 구간에서 넘기면 완료를 알리고, 처음부터 다시 재생할 수 있다", async () => {
    setDemoTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    for (let count = 0; count < DEMO_LECTURE.segments.length; count += 1) {
      await userEvent.click(screen.getByRole("button", { name: "다음 구간" }));
    }

    expect(screen.getByRole("status")).toHaveTextContent("강의를 마쳤습니다.");

    await userEvent.click(
      screen.getByRole("button", { name: "처음부터 다시" }),
    );

    expect(screen.getByText("구간 1 / 5")).toBeInTheDocument();
  });

  it("강의를 종료하면 시작 전 화면으로 돌아간다", async () => {
    setDemoTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    await userEvent.click(screen.getByRole("button", { name: "강의 종료" }));

    expect(
      screen.getByRole("button", { name: "강의 시작" }),
    ).toBeInTheDocument();
  });
});
