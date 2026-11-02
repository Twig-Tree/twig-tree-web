import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_GEOGRAPHY_LECTURE_SCRIPT } from "@/src/entities/lecture";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
import { useLectureScriptStore } from "../model/lecture/lectureScriptStore";
import { useTreeStore } from "../model/treeStore";
import { LectureScriptPlayer } from "./LectureScriptPlayer";

const treeRows = [
  ["world", null, "세계"],
  ["europe", "world", "유럽"],
  ["asia", "world", "아시아"],
  ["france", "europe", "프랑스"],
  ["germany", "europe", "독일"],
  ["euro", "europe", "유로"],
  ["paris", "france", "파리"],
  ["berlin", "germany", "베를린"],
  ["korea", "asia", "대한민국"],
  ["japan", "asia", "일본"],
  ["seoul", "korea", "서울"],
  ["won", "korea", "원"],
  ["tokyo", "japan", "도쿄"],
  ["yen", "japan", "엔"],
] as const;

const setWorldGeographyTree = () => {
  const nodes = treeRows.map(([clientId, , label], orderIndex) =>
    createEditorNode({
      clientId,
      serverId: String(orderIndex + 201),
      label,
      orderIndex,
      x: 0,
      y: 0,
    }),
  );
  const edges = treeRows.flatMap(([clientId, parentClientId]) =>
    parentClientId === null
      ? []
      : [
          createEditorEdge({
            sourceClientId: parentClientId,
            targetClientId: clientId,
          }),
        ],
  );

  useTreeStore.setState({ nodes, edges });
};

const onRevealNodes = vi.fn();
const onResetCamera = vi.fn();

const renderPlayer = () =>
  render(
    <LectureScriptPlayer
      script={WORLD_GEOGRAPHY_LECTURE_SCRIPT}
      onRevealNodes={onRevealNodes}
      onResetCamera={onResetCamera}
    />,
  );

beforeEach(() => {
  onRevealNodes.mockReset();
  onResetCamera.mockReset();
  useTreeStore.getState().resetTree();
  useLectureScriptStore.getState().resetScript();
  useLectureAnimationStore.getState().resetVisual();
});

afterEach(() => {
  act(() => {
    useLectureScriptStore.getState().resetScript();
    useLectureAnimationStore.getState().resetVisual();
  });
});

describe("LectureScriptPlayer", () => {
  it("대본의 경로와 현재 트리가 다르면 시작을 막고 이유를 알린다", () => {
    useTreeStore.setState({
      nodes: [
        createEditorNode({
          clientId: "other",
          serverId: "1",
          label: "운영체제",
          orderIndex: 0,
          x: 0,
          y: 0,
        }),
      ],
      edges: [],
    });
    renderPlayer();

    const startButton = screen.getByRole("button", { name: "강의 시작" });

    expect(startButton).toBeDisabled();
    expect(startButton).toHaveAccessibleDescription(
      /현재 트리 구조와 대본의 노드 경로가 일치하지 않습니다/,
    );
  });

  it("시작하면 첫 비트의 자막과 애니메이션을 함께 재생한다", async () => {
    setWorldGeographyTree();
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    expect(
      screen.getByText(
        WORLD_GEOGRAPHY_LECTURE_SCRIPT.scenes[0].beats[0].narration.text,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("장면 1 / 4 · 비트 1 / 2")).toBeInTheDocument();
    expect(screen.getByText("음성 없음 · 자막만 재생")).toBeInTheDocument();
    expect(onRevealNodes).toHaveBeenCalledWith(["world", "europe", "asia"], {
      maxZoom: 1,
      duration: 700,
    });
  });

  it("다음 장면을 누르면 남은 비트를 건너뛰고 새 장면의 첫 동작을 실행한다", async () => {
    setWorldGeographyTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));

    await userEvent.click(screen.getByRole("button", { name: "다음 장면" }));

    expect(
      screen.getByText(
        WORLD_GEOGRAPHY_LECTURE_SCRIPT.scenes[1].beats[0].narration.text,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("장면 2 / 4 · 비트 1 / 4")).toBeInTheDocument();
    expect(onRevealNodes).toHaveBeenLastCalledWith(
      ["europe", "france", "germany", "euro"],
      { maxZoom: 1.1, duration: 700 },
    );
  });
});
