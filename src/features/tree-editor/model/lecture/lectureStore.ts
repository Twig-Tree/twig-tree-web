import { create } from "zustand";
import { EditorLectureSegment } from "../types";

/*
idle: 강의를 시작하지 않았다. ended: 마지막 문장까지 끝났다. 두 상태 모두 재생 중인 문장이 없다.
*/
export type LecturePlaybackStatus = "idle" | "playing" | "paused" | "ended";

interface LectureState {
  segments: EditorLectureSegment[]; // 편집기 노드에 연결한 강의 구간. 시작 전에는 빈 배열
  status: LecturePlaybackStatus;
  segmentIndex: number; // 지금 구간. 끝난 뒤에는 마지막 구간에 머문다
  subtitleIndex: number; // 지금 구간 안에서 읽고 있는 문장

  startLecture: (segments: EditorLectureSegment[]) => void;
  pauseLecture: () => void;
  resumeLecture: () => void;
  goToNextSegment: () => void;
  completeSubtitle: (segmentIndex: number, subtitleIndex: number) => void;
  resetLecture: () => void;
}

const initialState = {
  segments: [],
  status: "idle",
  segmentIndex: 0,
  subtitleIndex: 0,
} satisfies Partial<LectureState>;

/*
강의 재생 위치는 treeStore와 따로 둔다. 강의는 서버와 무관한 화면 상태라 undo 대상이 아니고,
강의가 진행될 때마다 treeStore의 handleSet 비교를 거칠 이유도 없다. 강조·접힘 store와 같은 이유다.

음성·자막·노드 강조·카메라는 모두 이 store의 구간과 문장 위치에서 파생한다. 각자 상태를 들고 있으면 서로 어긋날 수 있다.
*/
export const useLectureStore = create<LectureState>()((set, get) => ({
  ...initialState,

  /*
  함수 이름 : startLecture
  기능 : 첫 구간의 첫 문장부터 재생을 시작한다. 끝난 강의를 처음부터 다시 볼 때도 쓴다.
  인자 : EditorLectureSegment[] segments -> 편집기 노드에 연결한 강의 구간
  반환값 : 없음
  */
  startLecture: (segments) => {
    if (segments.length === 0) return;

    set({ segments, status: "playing", segmentIndex: 0, subtitleIndex: 0 });
  },

  pauseLecture: () => {
    if (get().status !== "playing") return;

    set({ status: "paused" });
  },

  resumeLecture: () => {
    if (get().status !== "paused") return;

    set({ status: "playing" });
  },

  /*
  함수 이름 : goToNextSegment
  기능 : 지금 구간의 남은 문장을 건너뛰고 다음 구간의 첫 문장으로 간다. 마지막 구간이면 강의를 끝낸다.
  일시정지 중이면 일시정지를 유지한 채 위치만 옮긴다. 다음 구간의 자막과 노드를 먼저 보고 재생할 수 있다.
  인자 : 없음
  반환값 : 없음
  */
  goToNextSegment: () => {
    const { status, segments, segmentIndex } = get();

    if (status !== "playing" && status !== "paused") return;

    if (segmentIndex + 1 >= segments.length) {
      set({ status: "ended" });
      return;
    }

    set({ segmentIndex: segmentIndex + 1, subtitleIndex: 0 });
  },

  /*
  함수 이름 : completeSubtitle
  기능 : 문장 하나를 다 읽었을 때 다음 문장으로 넘어간다. 구간의 마지막 문장이면 다음 구간으로, 마지막 구간이면 강의를 끝낸다.
  인자 : number segmentIndex -> 다 읽은 문장의 구간
  number subtitleIndex -> 다 읽은 문장
  반환값 : 없음

  다 읽은 문장의 위치를 함께 받아, 재생 중이고 지금 위치와 같을 때만 넘어간다.
  일시정지·구간 이동과 문장 종료 이벤트가 엇갈려 늦게 도착해도 엉뚱한 위치에서 한 칸 더 넘어가지 않는다.
  */
  completeSubtitle: (completedSegmentIndex, completedSubtitleIndex) => {
    const { status, segments, segmentIndex, subtitleIndex } = get();

    if (
      status !== "playing" ||
      completedSegmentIndex !== segmentIndex ||
      completedSubtitleIndex !== subtitleIndex
    ) {
      return;
    }

    if (subtitleIndex + 1 < segments[segmentIndex].subtitles.length) {
      set({ subtitleIndex: subtitleIndex + 1 });
      return;
    }

    if (segmentIndex + 1 < segments.length) {
      set({ segmentIndex: segmentIndex + 1, subtitleIndex: 0 });
      return;
    }

    set({ status: "ended" });
  },

  resetLecture: () => {
    set(initialState);
  },
}));
