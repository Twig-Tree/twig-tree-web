import { beforeEach, describe, expect, it } from "vitest";
import { type EditorLectureScript } from "../types";
import { getCurrentLectureScene, useLectureStore } from "./lectureStore";

const createBeat = (id: string) => ({
  id,
  narration: { text: id, fallbackDurationMs: 1000 },
  animation: { type: "reset", scope: "visual" } as const,
});

const script: EditorLectureScript = {
  id: "test-script",
  title: "테스트 강의",
  scenes: [
    {
      id: "scene-1",
      clientId: "node-1",
      beats: [createBeat("beat-1"), createBeat("beat-2")],
    },
    {
      id: "scene-2",
      clientId: "node-2",
      beats: [createBeat("beat-3")],
    },
  ],
};

const getPosition = () => {
  const { status, sceneIndex, beatIndex } = useLectureStore.getState();

  return { status, sceneIndex, beatIndex };
};

beforeEach(() => {
  useLectureStore.getState().resetLecture();
});

describe("lectureStore", () => {
  it("첫 장면의 첫 비트부터 시작한다", () => {
    useLectureStore.getState().startLecture(script);

    expect(getPosition()).toEqual({
      status: "playing",
      sceneIndex: 0,
      beatIndex: 0,
    });
  });

  it("비트를 마치면 같은 장면의 다음 비트와 다음 장면으로 이동한다", () => {
    useLectureStore.getState().startLecture(script);

    useLectureStore.getState().completeBeat(0, 0);
    expect(getPosition()).toMatchObject({ sceneIndex: 0, beatIndex: 1 });

    useLectureStore.getState().completeBeat(0, 1);
    expect(getPosition()).toMatchObject({ sceneIndex: 1, beatIndex: 0 });
  });

  it("일시정지 중에는 늦게 도착한 완료를 무시하고 재개하면 같은 비트를 재생한다", () => {
    useLectureStore.getState().startLecture(script);
    useLectureStore.getState().pauseLecture();
    useLectureStore.getState().completeBeat(0, 0);

    expect(getPosition()).toEqual({
      status: "paused",
      sceneIndex: 0,
      beatIndex: 0,
    });

    useLectureStore.getState().resumeLecture();
    expect(getPosition().status).toBe("playing");
  });

  it("다음 장면 버튼은 남은 비트를 건너뛴다", () => {
    useLectureStore.getState().startLecture(script);
    useLectureStore.getState().goToNextScene();

    expect(getPosition()).toMatchObject({ sceneIndex: 1, beatIndex: 0 });
  });

  it("마지막 비트를 마치면 강의를 끝낸다", () => {
    useLectureStore.setState({
      script,
      status: "playing",
      sceneIndex: 1,
      beatIndex: 0,
    });

    useLectureStore.getState().completeBeat(1, 0);
    expect(getPosition().status).toBe("ended");
  });

  it("재생 중과 일시정지 중에는 지금 장면을 현재 장면으로 고른다", () => {
    const getCurrentClientId = () =>
      getCurrentLectureScene(useLectureStore.getState())?.clientId;

    useLectureStore.getState().startLecture(script);
    expect(getCurrentClientId()).toBe("node-1");

    useLectureStore.getState().goToNextScene();
    useLectureStore.getState().pauseLecture();
    expect(getCurrentClientId()).toBe("node-2");
  });

  it("시작 전과 끝난 뒤에는 현재 장면이 없다", () => {
    const getCurrentScene = () =>
      getCurrentLectureScene(useLectureStore.getState());

    expect(getCurrentScene()).toBeNull();

    useLectureStore.getState().startLecture(script);
    useLectureStore.getState().goToNextScene();
    useLectureStore.getState().goToNextScene();
    expect(useLectureStore.getState().status).toBe("ended");
    expect(getCurrentScene()).toBeNull();
  });
});
