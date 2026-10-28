import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLectureStore } from "./lectureStore";
import { useLecturePlayback } from "./useLecturePlayback";
import { EditorLectureSegment } from "../types";

/*
jsdom에는 음성 합성 API가 없어 무음 재생으로 동작한다. 문장마다 1초씩 기다린다.
c1: 문장 2개, c2: 문장 1개
*/
const createSegment = (
  clientId: string,
  subtitleCount: number,
): EditorLectureSegment => ({
  id: clientId,
  clientId,
  subtitles: Array.from({ length: subtitleCount }, (_, index) => ({
    startMs: index * 1000,
    endMs: (index + 1) * 1000,
    text: `${clientId} 문장 ${index}`,
  })),
  camera: { targetClientIds: [clientId], maxZoom: 1, durationMs: 500 },
});

const segments = [createSegment("c1", 2), createSegment("c2", 1)];

const getPosition = () => {
  const { status, segmentIndex, subtitleIndex } = useLectureStore.getState();

  return { status, segmentIndex, subtitleIndex };
};

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  useLectureStore.getState().resetLecture();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useLecturePlayback", () => {
  it("음성 합성이 없으면 무음 재생으로 알린다", () => {
    const { result } = renderHook(() => useLecturePlayback());

    expect(result.current).toBe("silent");
  });

  it("문장 시간이 지날 때마다 다음 문장으로 넘어가 마지막에 강의를 끝낸다", () => {
    renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    advance(1000);
    expect(getPosition()).toMatchObject({ segmentIndex: 0, subtitleIndex: 1 });

    advance(1000);
    expect(getPosition()).toMatchObject({ segmentIndex: 1, subtitleIndex: 0 });

    advance(1000);
    expect(getPosition().status).toBe("ended");
  });

  it("일시정지하면 넘어가지 않고, 다시 재생하면 지금 문장을 처음부터 기다린다", () => {
    renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    advance(600);
    act(() => useLectureStore.getState().pauseLecture());
    advance(5000);
    expect(getPosition()).toMatchObject({
      status: "paused",
      segmentIndex: 0,
      subtitleIndex: 0,
    });

    act(() => useLectureStore.getState().resumeLecture());
    advance(999);
    expect(getPosition().subtitleIndex).toBe(0);

    advance(1);
    expect(getPosition().subtitleIndex).toBe(1);
  });

  /*
  앞 문장의 타이머가 남아 있으면 구간을 옮긴 뒤 그 타이머가 한 칸 더 넘긴다.
  */
  it("다음 구간으로 옮기면 앞 문장의 남은 시간이 새 구간을 넘기지 않는다", () => {
    renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    advance(900);
    act(() => useLectureStore.getState().goToNextSegment());
    advance(100);

    expect(getPosition()).toMatchObject({
      status: "playing",
      segmentIndex: 1,
      subtitleIndex: 0,
    });
  });

  it("재생과 일시정지를 빠르게 반복해도 한 번에 한 문장만 진행한다", () => {
    renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    act(() => {
      for (let count = 0; count < 5; count += 1) {
        useLectureStore.getState().pauseLecture();
        useLectureStore.getState().resumeLecture();
      }
    });
    advance(1000);

    expect(getPosition()).toMatchObject({ segmentIndex: 0, subtitleIndex: 1 });
  });

  it("언마운트하면 남은 타이머가 위치를 바꾸지 않는다", () => {
    const { unmount } = renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    unmount();
    advance(5000);

    expect(getPosition()).toMatchObject({ segmentIndex: 0, subtitleIndex: 0 });
  });

  it("끝난 강의를 다시 시작하면 처음부터 진행한다", () => {
    renderHook(() => useLecturePlayback());
    act(() => useLectureStore.getState().startLecture(segments));

    /*
    문장이 끝나면 다음 렌더의 effect가 다음 타이머를 건다. 한 번에 3초를 흘리면 그 사이 렌더가 없어 한 문장만 진행된다.
    */
    advance(1000);
    advance(1000);
    advance(1000);
    expect(getPosition().status).toBe("ended");

    act(() => useLectureStore.getState().startLecture(segments));
    advance(1000);

    expect(getPosition()).toEqual({
      status: "playing",
      segmentIndex: 0,
      subtitleIndex: 1,
    });
  });
});
