import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setLectureLogSink } from "@/src/entities/lecture";
import { server } from "@/src/tests/mocks/server";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { useGeneratedLectureStore } from "../model/lecture/generatedLectureStore";
import { useLectureStore } from "../model/lecture/lectureStore";
import { useLectureScript } from "../model/lecture/useLectureScript";
import { useTreeStore } from "../model/treeStore";
import { LecturePlayer } from "./LecturePlayer";

const createNode = (clientId: string, serverId: string) =>
  createEditorNode({
    clientId,
    serverId,
    label: clientId,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

const VALID_RESPONSE = JSON.stringify({
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "만든 강의",
  scenes: [
    {
      id: "scene-1",
      nodeId: "1",
      beats: [
        {
          id: "beat-1",
          narration: { text: "자식 노드를 소개합니다." },
          cues: [{ intent: "introduce", roles: { subject: "2" } }],
        },
      ],
    },
  ],
});

/*
화면처럼 useLectureScript가 고른 대본을 플레이어에 넘긴다. 생성한 대본이 보관되어 플레이어에 닿는지 함께 본다.
*/
function PlayerWithLectureScript() {
  const { script, isGenerated } = useLectureScript();

  return (
    <LecturePlayer
      script={script}
      isGeneratedScript={isGenerated}
      onRevealNodes={() => {}}
      onResetCamera={() => {}}
      onBeforeCollapseRestore={() => {}}
      panelLayoutKey="panels"
    />
  );
}

const renderPlayer = () => {
  const { wrapper } = createQueryWrapper();

  return render(<PlayerWithLectureScript />, { wrapper });
};

const mockResponse = (createResponse: () => Response) => {
  server.use(http.post("*/api/lecture-request", createResponse));
};

const createSuccessResponse = (responseText: string) =>
  HttpResponse.json({
    isSuccess: true,
    code: "COMMON200",
    message: "성공입니다.",
    data: {
      responseText,
      model: "gpt-4o-mini-2024-07-18",
      promptVersion: "lecture-v1",
      usage: { inputTokens: 1200, outputTokens: 340 },
      attemptCount: 1,
    },
  });

beforeEach(() => {
  useTreeStore.setState({
    treeId: "12",
    nodes: [createNode("c1", "1"), createNode("c2", "2")],
    edges: [{ id: "c1-c2", source: "c1", target: "c2" }],
  });
  useGeneratedLectureStore.setState({ scriptByTreeId: {} });
  setLectureLogSink(() => {});
});

afterEach(() => {
  useTreeStore.getState().resetTree();
  useLectureStore.getState().resetLecture();
  setLectureLogSink(null);
});

describe("LectureGenerator", () => {
  it("요청 문장으로 강의를 만들면 시작 화면에 만든 강의가 보인다", async () => {
    mockResponse(() => createSuccessResponse(VALID_RESPONSE));
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));
    await userEvent.type(screen.getByRole("textbox"), "자식 노드를 소개해 줘");
    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));

    expect(await screen.findByText("만든 강의")).toBeVisible();
    expect(screen.getByRole("button", { name: "강의 시작" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "강의 새로 만들기" }),
    ).toBeVisible();
    expect(
      useGeneratedLectureStore.getState().scriptByTreeId["12"],
    ).toBeDefined();
  });

  it("만드는 동안 생성 중 안내를 보여 주고 입력을 닫지 못하게 한다", async () => {
    let respond: () => void = () => {};
    server.use(
      http.post(
        "*/api/lecture-request",
        () =>
          new Promise<Response>((resolve) => {
            respond = () => resolve(createSuccessResponse(VALID_RESPONSE));
          }),
      ),
    );
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));
    await userEvent.type(screen.getByRole("textbox"), "자식 노드를 소개해 줘");
    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "강의를 만드는 중입니다",
    );
    expect(
      screen.getByRole("button", { name: "강의 만들기 닫기" }),
    ).toBeDisabled();

    respond();
    expect(await screen.findByText("만든 강의")).toBeVisible();
  });

  it("백엔드 오류 코드에 맞는 안내를 보여 주고 입력을 유지한다", async () => {
    mockResponse(() =>
      HttpResponse.json(
        {
          isSuccess: false,
          code: "LECTURE502-1",
          message: "AI 모델 응답이 길이 상한에 걸려 잘렸습니다.",
          data: null,
        },
        { status: 502 },
      ),
    );
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));
    await userEvent.type(screen.getByRole("textbox"), "자식 노드를 소개해 줘");
    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "범위를 좁혀 다시 요청해 주세요",
    );
    expect(screen.getByRole("textbox")).toHaveValue("자식 노드를 소개해 줘");
  });

  it("repair 뒤에도 트리와 맞지 않으면 요청을 바꾸라고 안내한다", async () => {
    mockResponse(() =>
      createSuccessResponse(
        VALID_RESPONSE.replace('"subject":"2"', '"subject":"999"'),
      ),
    );
    renderPlayer();

    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));
    await userEvent.type(screen.getByRole("textbox"), "자식 노드를 소개해 줘");
    await userEvent.click(screen.getByRole("button", { name: "강의 만들기" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "만든 강의가 이 트리와 맞지 않습니다",
      ),
    );
  });
});
