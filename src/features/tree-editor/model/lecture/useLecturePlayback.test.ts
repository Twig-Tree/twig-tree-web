import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { setLectureLogSink } from "@/src/entities/lecture";
import {
  type EditorLectureAnimation,
  type EditorLectureScript,
} from "../types";
import { useLectureAnimationStore } from "./lectureAnimationStore";
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
const onBeforeCollapseRestore = vi.fn();

const renderPlayback = () =>
  renderHook(() =>
    useLecturePlayback({
      revealNodes,
      resetCamera,
      onBeforeCollapseRestore,
      panelLayoutKey: "panels",
    }),
  );

const lecture = () => useLectureStore.getState();

const getPosition = () => {
  const { status, sceneIndex, beatIndex } = lecture();

  return { status, sceneIndex, beatIndex };
};

/*
음성 합성을 흉내 낸다. speak는 끝 이벤트를 내지 않으므로 끝나는 시점은 테스트가 정한다.
*/
const stubSpeech = () => {
  const speak = vi.fn();
  const cancel = vi.fn();

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
    cancel,
    speak,
  });

  return { speak, cancel };
};

const focusScript: EditorLectureScript = {
  ...script,
  scenes: [
    {
      id: "scene-1",
      clientId: "c1",
      beats: [
        createBeat("focus", {
          type: "focus",
          targetClientIds: ["c2"],
          maxZoom: 1,
          durationMs: 500,
        }),
        createBeat("next"),
      ],
    },
  ],
};

/*
비트 완료는 Promise로 전달되므로 타이머와 함께 microtask까지 흘린다.
*/
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

/*
끊긴 발화의 재시작 시각은 모듈에 남는다. 테스트마다 시계를 충분히 앞으로 맞춰 앞 테스트의 지연이 넘어오지 않게 한다.
*/
let testNow = Date.now();

beforeEach(() => {
  testNow += 60_000;
  vi.useFakeTimers({ now: testNow });
  revealNodes.mockReset();
  resetCamera.mockReset();
  lecture().resetLecture();
  useLectureAnimationStore.getState().resetVisual();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useLecturePlayback", () => {
  it("음성 합성이 없으면 무음 재생으로 알린다", () => {
    const { result } = renderPlayback();

    expect(result.current.audioMode).toBe("silent");
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

  it("→와 ←로 옮기면 그 비트를 처음부터 기다린다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(900);
    act(() => lecture().goToNextBeat());
    await advance(999);
    expect(getPosition().beatIndex).toBe(1);

    act(() => lecture().goToPreviousBeat());
    await advance(999);
    expect(getPosition().beatIndex).toBe(0);

    await advance(1);
    expect(getPosition().beatIndex).toBe(1);
  });

  it("다시 듣기는 같은 위치의 비트를 새로 시작하고, 일시정지 중이면 재생한다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(900);
    act(() => lecture().replayBeat());
    await advance(999);
    expect(getPosition()).toMatchObject({ beatIndex: 0 });

    act(() => lecture().pauseLecture());
    act(() => lecture().replayBeat());
    expect(getPosition().status).toBe("playing");
  });

  it("첫 비트에서 ←는 처음부터 다시, 마지막 비트에서 →는 강의를 끝낸다", async () => {
    renderPlayback();
    act(() => lecture().startLecture(script));

    await advance(900);
    act(() => lecture().goToPreviousBeat());
    await advance(999);
    expect(getPosition()).toMatchObject({ sceneIndex: 0, beatIndex: 0 });

    act(() => lecture().goToNextScene());
    act(() => lecture().goToNextBeat());
    expect(getPosition().status).toBe("ended");
  });

  it("일시정지 중에 옮기면 일시정지를 유지하고 그 비트의 카메라로 옮긴다", async () => {
    const focusBeat = createBeat("focus", {
      type: "focus",
      targetClientIds: ["c2"],
      maxZoom: 1,
      durationMs: 500,
    });

    renderPlayback();
    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [createBeat("first"), focusBeat],
          },
        ],
      }),
    );
    act(() => lecture().pauseLecture());
    act(() => lecture().goToNextBeat());
    await advance(20);

    expect(getPosition()).toMatchObject({ status: "paused", beatIndex: 1 });
    expect(revealNodes).toHaveBeenCalledWith(["c2"], {
      maxZoom: 1,
      duration: 500,
      keepCollapse: true,
    });
  });

  it("음성을 끄면 비트를 다시 시작하지 않고 자막의 남은 시간만 기다린다", async () => {
    const { speak } = stubSpeech();
    const { result, unmount } = renderPlayback();

    act(() => lecture().startLecture(focusScript));
    expect(speak).toHaveBeenCalledOnce();

    await advance(400);
    act(() => result.current.toggleMute());
    expect(result.current.audioMode).toBe("muted");

    await advance(599);
    expect(getPosition().beatIndex).toBe(0);

    await advance(1);
    expect(getPosition().beatIndex).toBe(1);
    expect(speak).toHaveBeenCalledOnce();
    expect(revealNodes).toHaveBeenCalledOnce();

    unmount();
  });

  it("음성을 켜면 화면 연출은 그대로 두고 지금 문장을 처음부터 읽는다", async () => {
    const { speak } = stubSpeech();
    const { result, unmount } = renderPlayback();

    act(() => result.current.toggleMute());
    act(() => lecture().startLecture(focusScript));
    expect(speak).not.toHaveBeenCalled();

    await advance(400);
    act(() => result.current.toggleMute());

    expect(result.current.audioMode).toBe("speech");
    expect(speak).toHaveBeenCalledOnce();
    expect(revealNodes).toHaveBeenCalledOnce();

    unmount();
  });

  it("읽을 음성이 없으면 음성을 켜고 끄지 않는다", () => {
    const { result } = renderPlayback();

    act(() => result.current.toggleMute());

    expect(result.current.audioMode).toBe("silent");
  });

  it("일시정지 중 옮긴 비트의 연출을 보여 주고, 재생하면 걷어 내고 다시 실행한다", async () => {
    renderPlayback();
    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("first"),
              createBeat("highlight", {
                type: "highlight",
                targetClientIds: ["c2"],
                style: "steady",
                durationMs: 500,
              }),
            ],
          },
        ],
      }),
    );
    act(() => lecture().pauseLecture());
    act(() => lecture().goToNextBeat());
    await advance(20);

    const previewLayerIds = [
      ...useLectureAnimationStore.getState().layers.keys(),
    ];

    expect(previewLayerIds).toHaveLength(1);

    act(() => lecture().resumeLecture());
    const { layers } = useLectureAnimationStore.getState();

    expect(layers.size).toBe(1);
    expect(layers.has(previewLayerIds[0])).toBe(false);
  });

  it("일시정지 중에 강의가 끝나면 유지되던 강조를 지운다", async () => {
    renderPlayback();
    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("persist", {
                type: "highlight",
                targetClientIds: ["c2"],
                style: "steady",
                durationMs: 500,
                persist: true,
              }),
            ],
          },
        ],
      }),
    );
    expect(useLectureAnimationStore.getState().layers.size).toBe(1);

    act(() => lecture().pauseLecture());
    act(() => lecture().goToNextScene());

    expect(getPosition().status).toBe("ended");
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("새 강의에서는 음성 합성을 다시 시도한다", async () => {
    const { speak } = stubSpeech();
    const { result, unmount } = renderPlayback();

    act(() => lecture().startLecture(script));

    const utterance: SpeechSynthesisUtterance = speak.mock.calls[0][0];

    act(() =>
      utterance.onerror?.({
        error: "synthesis-failed",
      } as SpeechSynthesisErrorEvent),
    );
    expect(result.current.audioMode).toBe("silent");

    act(() => lecture().resetLecture());
    expect(result.current.audioMode).toBe("speech");

    unmount();
  });

  it("카메라를 되돌리면 마지막 focus를 접힘을 바꾸지 않고 다시 실행한다", async () => {
    const { result } = renderPlayback();

    act(() => lecture().startLecture(focusScript));
    expect(revealNodes).toHaveBeenCalledOnce();

    act(() => lecture().pauseLecture());
    act(() => result.current.refocusCamera());

    expect(revealNodes).toHaveBeenCalledTimes(2);
    expect(revealNodes).toHaveBeenLastCalledWith(["c2"], {
      maxZoom: 1,
      duration: 500,
      keepCollapse: true,
    });
  });

  /*
  뒤에 있던 비트의 카메라가 남으면 아직 설명하지 않은 노드로 간다.
  */
  it("카메라 동작이 없는 위치로 돌아오면 되돌릴 카메라도 없다", async () => {
    const { result } = renderPlayback();

    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("first"),
              createBeat("focus", {
                type: "focus",
                targetClientIds: ["c2"],
                maxZoom: 1,
                durationMs: 500,
              }),
            ],
          },
        ],
      }),
    );
    act(() => lecture().goToNextBeat());
    await advance(20);
    expect(revealNodes).toHaveBeenCalledOnce();

    act(() => lecture().pauseLecture());
    act(() => lecture().goToPreviousBeat());
    await advance(20);
    act(() => result.current.refocusCamera());

    expect(revealNodes).toHaveBeenCalledOnce();
  });

  /*
  병렬 그룹의 한 동작이 실패해도 다른 동작의 강조가 화면에 남지 않아야 하고, 강의는 멈추지 않아야 한다.
  */
  it("비트 애니메이션이 실패하면 화면을 정리하고 내레이션 뒤 다음 비트로 넘어간다", async () => {
    const logSink = vi.fn();
    setLectureLogSink(logSink);
    revealNodes.mockImplementationOnce(() => {
      throw new Error("카메라 실패");
    });
    const { result } = renderPlayback();

    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("broken", {
                type: "group",
                mode: "parallel",
                children: [
                  {
                    type: "highlight",
                    targetClientIds: ["c1"],
                    style: "steady",
                    durationMs: 3000,
                  },
                  {
                    type: "focus",
                    targetClientIds: ["c2"],
                    maxZoom: 1,
                    durationMs: 500,
                  },
                ],
              }),
              createBeat("next"),
            ],
          },
        ],
      }),
    );
    await advance(0);

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
    expect(logSink).toHaveBeenCalledExactlyOnceWith({
      type: "lecture-playback-failure",
      level: "error",
      scriptId: "test-script",
      sceneIndex: 0,
      beatIndex: 0,
      sceneId: "scene-1",
      beatId: "broken",
      message: "카메라 실패",
    });

    act(() => result.current.refocusCamera());
    expect(revealNodes).toHaveBeenCalledOnce();

    await advance(999);
    expect(getPosition().beatIndex).toBe(0);

    await advance(1);
    expect(getPosition().beatIndex).toBe(1);
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);

    setLectureLogSink(null);
  });

  it("동작 줄이기 설정을 비트마다 읽어 그 비트의 애니메이션을 줄인다", async () => {
    let isReducedMotion = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && isReducedMotion,
    }));
    const pulse = (id: string): EditorLectureAnimation => ({
      type: "highlight",
      targetClientIds: [id],
      style: "pulse",
      durationMs: 500,
      persist: true,
    });
    const getHighlightStyles = () =>
      [...useLectureAnimationStore.getState().layers.values()].map((layer) =>
        layer.type === "highlight" ? layer.style : null,
      );
    renderPlayback();

    act(() =>
      lecture().startLecture({
        ...script,
        scenes: [
          {
            id: "scene-1",
            clientId: "c1",
            beats: [
              createBeat("first", pulse("c1")),
              createBeat("second", pulse("c2")),
            ],
          },
        ],
      }),
    );
    await advance(0);
    expect(getHighlightStyles()).toEqual(["pulse"]);

    isReducedMotion = true;
    await advance(1000);
    expect(getHighlightStyles()).toEqual(["pulse", "steady"]);
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
    const { speak } = stubSpeech();

    const { result, unmount } = renderPlayback();
    expect(result.current.audioMode).toBe("speech");

    act(() => lecture().startLecture(script));

    const utterance: SpeechSynthesisUtterance = speak.mock.calls[0][0];

    act(() =>
      utterance.onerror?.({
        error: "synthesis-failed",
      } as SpeechSynthesisErrorEvent),
    );
    expect(result.current.audioMode).toBe("silent");

    await advance(1000);
    expect(getPosition().beatIndex).toBe(1);

    unmount(); // afterEach가 음성 합성 stub을 걷기 전에 구독을 푼다
  });
});
