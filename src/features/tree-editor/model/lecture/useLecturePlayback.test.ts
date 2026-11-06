import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  type EditorLectureAnimation,
  type EditorLectureScript,
} from "../types";
import { useLectureStore } from "./lectureStore";
import { useLecturePlayback } from "./useLecturePlayback";

const NO_ANIMATION: EditorLectureAnimation = {
  type: "group",
  mode: "sequence",
  children: [],
};

const createBeat = (
  id: string,
  animation: EditorLectureAnimation = NO_ANIMATION,
) => ({
  id,
  narration: { text: id, fallbackDurationMs: 1000 },
  animation,
});

/*
jsdom에는 음성 합성 API가 없어 무음 재생으로 동작한다. 비트마다 1초씩 기다린다.
*/
const script: EditorLectureScript = {
  id: "test-script",
  title: "테스트 강의",
  scenes: [
    {
      id: "scene-1",
      clientId: "c1",
      beats: [createBeat("beat-1"), createBeat("beat-2")],
    },
    { id: "scene-2", clientId: "c2", beats: [createBeat("beat-3")] },
  ],
};

const revealNodes = vi.fn();
const resetCamera = vi.fn();

const renderPlayback = () =>
  renderHook(() => useLecturePlayback({ revealNodes, resetCamera }));

const lecture = () => useLectureStore.getState();

const getPosition = () => {
  const { status, sceneIndex, beatIndex } = lecture();

  return { status, sceneIndex, beatIndex };
};

/*
비트 완료는 Promise로 전달되므로 타이머와 함께 microtask까지 흘린다.
*/
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  revealNodes.mockReset();
  resetCamera.mockReset();
  lecture().resetLecture();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useLecturePlayback", () => {
  it("음성 합성이 없으면 무음 재생으로 알린다", () => {
    const { result } = renderPlayback();

    expect(result.current).toBe("silent");
  });

  it("비트 시간이 지날 때마다 다음 비트로 넘어가 마지막에 강의를 끝낸다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(1000);
    expect(getPosition()).toMatchObject({ sceneIndex: 0, beatIndex: 1 });

    await advance(1000);
    expect(getPosition()).toMatchObject({ sceneIndex: 1, beatIndex: 0 });

    await advance(1000);
    expect(getPosition().status).toBe("ended");
  });

  it("애니메이션이 내레이션보다 길면 애니메이션이 끝난 뒤 넘어간다", async () => {
    renderPlayback();
    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("long", {
                type: "focus",
                targetClientIds: ["c1"],
                maxZoom: 1,
                durationMs: 3000,
              }),
              createBeat("next"),
            ],
          },
        ],
      }),
    );

    await advance(2999);
    expect(getPosition().beatIndex).toBe(0);

    await advance(1);
    expect(getPosition().beatIndex).toBe(1);
  });

  it("일시정지하면 넘어가지 않고, 다시 재생하면 지금 비트를 처음부터 기다린다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(600);
    act(() => lecture().pauseLecture());
    await advance(5000);
    expect(getPosition()).toMatchObject({
      status: "paused",
      sceneIndex: 0,
      beatIndex: 0,
    });

    act(() => lecture().resumeLecture());
    await advance(999);
    expect(getPosition().beatIndex).toBe(0);

    await advance(1);
    expect(getPosition().beatIndex).toBe(1);
  });

  /*
  앞 비트의 타이머가 남아 있으면 장면을 옮긴 뒤 그 타이머가 한 칸 더 넘긴다.
  */
  it("다음 장면으로 옮기면 앞 비트의 남은 시간이 새 장면을 넘기지 않는다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(900);
    act(() => lecture().goToNextScene());
    await advance(100);

    expect(getPosition()).toEqual({
      status: "playing",
      sceneIndex: 1,
      beatIndex: 0,
    });
  });

  it("재생과 일시정지를 빠르게 반복해도 한 번에 한 비트만 진행한다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    act(() => {
      for (let count = 0; count < 5; count += 1) {
        lecture().pauseLecture();
        lecture().resumeLecture();
      }
    });
    await advance(1000);

    expect(getPosition()).toMatchObject({ sceneIndex: 0, beatIndex: 1 });
  });

  it("언마운트하면 남은 타이머가 위치를 바꾸지 않는다", async () => {
    const { unmount } = renderPlayback();
    act(() => lecture().startLecture(script));

    unmount();
    await advance(5000);

    expect(getPosition()).toMatchObject({ sceneIndex: 0, beatIndex: 0 });
  });

  it("끝난 강의를 다시 시작하면 처음부터 진행한다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(getPosition().status).toBe("ended");

    act(() => lecture().startLecture(script));
    await advance(1000);

    expect(getPosition()).toEqual({
      status: "playing",
      sceneIndex: 0,
      beatIndex: 1,
    });
  });

  it("음성 합성이 실패하면 무음 재생으로 바꿔 강의를 이어간다", async () => {
    let utterance: SpeechSynthesisUtterance | undefined;

    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        onend: (() => void) | null = null;
        onerror: ((event: { error: string }) => void) | null = null;
      },
    );
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ name: "유나", lang: "ko-KR", voiceURI: "yuna" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      cancel: vi.fn(),
      speak: (nextUtterance: SpeechSynthesisUtterance) => {
        utterance = nextUtterance;
      },
    });

    const { result, unmount } = renderPlayback();
    expect(result.current).toBe("speech");

    act(() => lecture().startLecture(script));
    act(() =>
      utterance?.onerror?.({
        error: "synthesis-failed",
      } as SpeechSynthesisErrorEvent),
    );
    expect(result.current).toBe("silent");

    await advance(1000);
    expect(getPosition().beatIndex).toBe(1);

    unmount(); // afterEach가 음성 합성 stub을 걷기 전에 구독을 푼다
  });
});
