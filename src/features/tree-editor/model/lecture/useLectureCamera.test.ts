import { beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLectureStore } from "./lectureStore";
import { useLectureCamera } from "./useLectureCamera";
import { EditorLectureSegment } from "../types";

/*
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
  camera: {
    targetClientIds: [clientId, `${clientId}-child`],
    maxZoom: 1.2,
    durationMs: 700,
  },
});

const createSegments = () => [createSegment("c1", 2), createSegment("c2", 1)];

const revealNodes = vi.fn();

const lecture = () => useLectureStore.getState();

beforeEach(() => {
  revealNodes.mockClear();
  useLectureStore.getState().resetLecture();
});

describe("useLectureCamera", () => {
  it("강의를 시작하면 첫 구간의 대상 노드로 구간의 배율과 시간으로 옮긴다", () => {
    renderHook(() => useLectureCamera({ revealNodes }));

    act(() => lecture().startLecture(createSegments()));

    expect(revealNodes).toHaveBeenCalledExactlyOnceWith(["c1", "c1-child"], {
      maxZoom: 1.2,
      duration: 700,
    });
  });

  it("시작 전에는 옮기지 않는다", () => {
    renderHook(() => useLectureCamera({ revealNodes }));

    expect(revealNodes).not.toHaveBeenCalled();
  });

  it("다음 구간으로 넘어가면 그 구간의 대상으로 옮긴다", () => {
    renderHook(() => useLectureCamera({ revealNodes }));
    act(() => lecture().startLecture(createSegments()));

    act(() => lecture().goToNextSegment());

    expect(revealNodes).toHaveBeenLastCalledWith(
      ["c2", "c2-child"],
      expect.anything(),
    );
    expect(revealNodes).toHaveBeenCalledTimes(2);
  });

  /*
  사용자가 강의 중 화면을 옮겨 다른 곳을 보고 있어도 같은 구간에서는 되돌리지 않는다.
  */
  it("같은 구간 안에서 문장이 넘어가거나 일시정지·재개해도 다시 옮기지 않는다", () => {
    renderHook(() => useLectureCamera({ revealNodes }));
    act(() => lecture().startLecture(createSegments()));

    act(() => lecture().completeSubtitle(0, 0));
    act(() => lecture().pauseLecture());
    act(() => lecture().resumeLecture());

    expect(revealNodes).toHaveBeenCalledOnce();
  });

  /*
  revealNodes는 보이는 노드가 바뀔 때마다 새 함수가 된다.
  */
  it("이동 함수가 바뀌어도 다시 옮기지 않는다", () => {
    const { rerender } = renderHook(
      ({ reveal }) => useLectureCamera({ revealNodes: reveal }),
      { initialProps: { reveal: revealNodes } },
    );
    act(() => lecture().startLecture(createSegments()));

    const nextRevealNodes = vi.fn();
    rerender({ reveal: nextRevealNodes });

    expect(revealNodes).toHaveBeenCalledOnce();
    expect(nextRevealNodes).not.toHaveBeenCalled();
  });

  it("강의가 끝나면 옮기지 않고, 다시 시작하면 첫 구간으로 옮긴다", () => {
    renderHook(() => useLectureCamera({ revealNodes }));
    act(() => lecture().startLecture(createSegments()));
    act(() => lecture().goToNextSegment());
    act(() => lecture().goToNextSegment());
    expect(lecture().status).toBe("ended");
    expect(revealNodes).toHaveBeenCalledTimes(2);

    act(() => lecture().startLecture(createSegments()));

    expect(revealNodes).toHaveBeenCalledTimes(3);
    expect(revealNodes).toHaveBeenLastCalledWith(
      ["c1", "c1-child"],
      expect.anything(),
    );
  });
});
