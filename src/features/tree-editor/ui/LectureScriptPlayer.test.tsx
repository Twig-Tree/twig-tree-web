import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WORLD_GEOGRAPHY_LECTURE_SCRIPT,
  WORLD_GEOGRAPHY_NODE_IDS,
} from "@/src/entities/lecture";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
import { useLectureScriptStore } from "../model/lecture/lectureScriptStore";
import { useTreeStore } from "../model/treeStore";
import { LectureScriptPlayer } from "./LectureScriptPlayer";

const treeRows = [
  ["world", null, "세계", WORLD_GEOGRAPHY_NODE_IDS.world],
  ["europe", "world", "유럽", WORLD_GEOGRAPHY_NODE_IDS.europe],
  ["asia", "world", "아시아", WORLD_GEOGRAPHY_NODE_IDS.asia],
  ["france", "europe", "프랑스", WORLD_GEOGRAPHY_NODE_IDS.france],
  ["germany", "europe", "독일", WORLD_GEOGRAPHY_NODE_IDS.germany],
  ["euro", "europe", "유로", WORLD_GEOGRAPHY_NODE_IDS.euro],
  ["paris", "france", "파리", WORLD_GEOGRAPHY_NODE_IDS.paris],
  ["berlin", "germany", "베를린", WORLD_GEOGRAPHY_NODE_IDS.berlin],
  ["korea", "asia", "대한민국", WORLD_GEOGRAPHY_NODE_IDS.korea],
  ["japan", "asia", "일본", WORLD_GEOGRAPHY_NODE_IDS.japan],
  ["seoul", "korea", "서울", WORLD_GEOGRAPHY_NODE_IDS.seoul],
  ["won", "korea", "원", WORLD_GEOGRAPHY_NODE_IDS.won],
  ["tokyo", "japan", "도쿄", WORLD_GEOGRAPHY_NODE_IDS.tokyo],
  ["yen", "japan", "엔", WORLD_GEOGRAPHY_NODE_IDS.yen],
] as const;

const setWorldGeographyTree = () => {
  const nodes = treeRows.map(([clientId, , label, serverId], orderIndex) =>
    createEditorNode({
      clientId,
      serverId,
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
  it("대본의 서버 노드 ID가 현재 트리에 없으면 시작을 막고 이유를 알린다", () => {
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
      /현재 트리에 대본이 가리키는 노드가 없습니다/,
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

  it("장면을 건너뛰면 이전 장면의 persist 레이어를 정리한다", async () => {
    setWorldGeographyTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));
    act(() => {
      useLectureAnimationStore.getState().setLayer({
        id: "persisted",
        type: "highlight",
        clientIds: new Set(["world"]),
        style: "steady",
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "다음 장면" }));

    await waitFor(() =>
      expect(useLectureAnimationStore.getState().layers.size).toBe(0),
    );
  });

  it("일시정지 중에는 persist 레이어를 유지한다", async () => {
    setWorldGeographyTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));
    act(() => {
      useLectureAnimationStore.getState().setLayer({
        id: "persisted",
        type: "highlight",
        clientIds: new Set(["world"]),
        style: "steady",
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "일시정지" }));

    expect(useLectureAnimationStore.getState().layers.has("persisted")).toBe(
      true,
    );
  });

  it("강의가 끝나면 persist 레이어를 정리한다", async () => {
    setWorldGeographyTree();
    renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));
    act(() => {
      useLectureAnimationStore.getState().setLayer({
        id: "persisted",
        type: "highlight",
        clientIds: new Set(["world"]),
        style: "steady",
      });
      useLectureScriptStore.setState({ sceneIndex: 3, beatIndex: 2 });
      useLectureScriptStore.getState().completeBeat(3, 2);
    });

    expect(await screen.findByText("동적 강의를 마쳤습니다.")).toBeVisible();
    await waitFor(() =>
      expect(useLectureAnimationStore.getState().layers.size).toBe(0),
    );
  });

  it("플레이어가 사라지면 persist 레이어를 정리한다", async () => {
    setWorldGeographyTree();
    const { unmount } = renderPlayer();
    await userEvent.click(screen.getByRole("button", { name: "강의 시작" }));
    act(() => {
      useLectureAnimationStore.getState().setLayer({
        id: "persisted",
        type: "highlight",
        clientIds: new Set(["world"]),
        style: "steady",
      });
    });

    unmount();

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });
});
