import { beforeEach, describe, it, expect } from "vitest";
import { useLectureStore } from "./lectureStore";
import { EditorLectureSegment } from "../types";

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

/*
c1: 문장 2개, c2: 문장 1개
*/
const segments = [createSegment("c1", 2), createSegment("c2", 1)];

const getPosition = () => {
  const { status, segmentIndex, subtitleIndex } = useLectureStore.getState();

  return { status, segmentIndex, subtitleIndex };
};

beforeEach(() => {
  useLectureStore.getState().resetLecture();
});

describe("startLecture", () => {
  it("첫 구간의 첫 문장부터 재생한다", () => {
    useLectureStore.getState().startLecture(segments);

    expect(getPosition()).toEqual({
      status: "playing",
      segmentIndex: 0,
      subtitleIndex: 0,
    });
  });

  it("끝난 강의를 처음부터 다시 재생한다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.setState({ status: "ended", segmentIndex: 1 });

    useLectureStore.getState().startLecture(segments);

    expect(getPosition()).toEqual({
      status: "playing",
      segmentIndex: 0,
      subtitleIndex: 0,
    });
  });

  it("구간이 없으면 시작하지 않는다", () => {
    useLectureStore.getState().startLecture([]);

    expect(getPosition().status).toBe("idle");
  });
});

describe("pauseLecture와 resumeLecture", () => {
  it("일시정지했다가 같은 위치에서 다시 재생한다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().completeSubtitle(0, 0);

    useLectureStore.getState().pauseLecture();
    expect(getPosition()).toEqual({
      status: "paused",
      segmentIndex: 0,
      subtitleIndex: 1,
    });

    useLectureStore.getState().resumeLecture();
    expect(getPosition()).toEqual({
      status: "playing",
      segmentIndex: 0,
      subtitleIndex: 1,
    });
  });

  it("재생 중이 아니면 일시정지하지 않고, 일시정지 중이 아니면 재개하지 않는다", () => {
    useLectureStore.getState().pauseLecture();
    expect(getPosition().status).toBe("idle");

    useLectureStore.getState().resumeLecture();
    expect(getPosition().status).toBe("idle");

    useLectureStore.getState().startLecture(segments);
    useLectureStore.setState({ status: "ended" });
    useLectureStore.getState().resumeLecture();
    expect(getPosition().status).toBe("ended");
  });
});

describe("completeSubtitle", () => {
  it("구간 안의 다음 문장으로, 구간 끝이면 다음 구간으로, 마지막이면 강의를 끝낸다", () => {
    useLectureStore.getState().startLecture(segments);

    useLectureStore.getState().completeSubtitle(0, 0);
    expect(getPosition()).toMatchObject({ segmentIndex: 0, subtitleIndex: 1 });

    useLectureStore.getState().completeSubtitle(0, 1);
    expect(getPosition()).toMatchObject({ segmentIndex: 1, subtitleIndex: 0 });

    useLectureStore.getState().completeSubtitle(1, 0);
    expect(getPosition()).toEqual({
      status: "ended",
      segmentIndex: 1,
      subtitleIndex: 0,
    });
  });

  /*
  다음 구간으로 넘긴 직후 앞 문장의 종료 이벤트가 늦게 도착한 경우다.
  */
  it("지금 위치가 아닌 문장의 종료는 무시한다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().goToNextSegment();

    useLectureStore.getState().completeSubtitle(0, 0);

    expect(getPosition()).toMatchObject({ segmentIndex: 1, subtitleIndex: 0 });
  });

  it("일시정지 중에 도착한 종료는 무시한다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().pauseLecture();

    useLectureStore.getState().completeSubtitle(0, 0);

    expect(getPosition()).toEqual({
      status: "paused",
      segmentIndex: 0,
      subtitleIndex: 0,
    });
  });
});

describe("goToNextSegment", () => {
  it("남은 문장을 건너뛰고 다음 구간의 첫 문장으로 간다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().completeSubtitle(0, 0);

    useLectureStore.getState().goToNextSegment();

    expect(getPosition()).toEqual({
      status: "playing",
      segmentIndex: 1,
      subtitleIndex: 0,
    });
  });

  it("일시정지 중이면 일시정지를 유지한 채 옮긴다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().pauseLecture();

    useLectureStore.getState().goToNextSegment();

    expect(getPosition()).toEqual({
      status: "paused",
      segmentIndex: 1,
      subtitleIndex: 0,
    });
  });

  it("마지막 구간에서는 강의를 끝낸다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().goToNextSegment();

    useLectureStore.getState().goToNextSegment();

    expect(getPosition()).toEqual({
      status: "ended",
      segmentIndex: 1,
      subtitleIndex: 0,
    });
  });

  it("시작 전이나 끝난 뒤에는 옮기지 않는다", () => {
    useLectureStore.getState().goToNextSegment();
    expect(getPosition()).toMatchObject({ status: "idle", segmentIndex: 0 });

    useLectureStore.getState().startLecture(segments);
    useLectureStore.setState({ status: "ended" });
    useLectureStore.getState().goToNextSegment();
    expect(getPosition()).toMatchObject({ status: "ended", segmentIndex: 0 });
  });
});

describe("resetLecture", () => {
  it("구간과 위치를 비운다", () => {
    useLectureStore.getState().startLecture(segments);
    useLectureStore.getState().goToNextSegment();

    useLectureStore.getState().resetLecture();

    expect(useLectureStore.getState()).toMatchObject({
      segments: [],
      status: "idle",
      segmentIndex: 0,
      subtitleIndex: 0,
    });
  });
});
