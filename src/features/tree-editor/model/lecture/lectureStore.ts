import { create } from "zustand";
import { type EditorLectureScene, type EditorLectureScript } from "../types";

/*
idle: 강의를 시작하지 않았다. ended: 마지막 비트까지 끝났다. 두 상태 모두 재생 중인 비트가 없다.
*/
export type LecturePlaybackStatus = "idle" | "playing" | "paused" | "ended";

interface LectureState {
  script: EditorLectureScript | null; // 편집기 노드에 연결한 대본
  status: LecturePlaybackStatus;
  sceneIndex: number; // 현재 장면
  beatIndex: number; // 현재 장면 안에서 재생 중인 비트
  startLecture: (script: EditorLectureScript) => void;
  pauseLecture: () => void;
  resumeLecture: () => void;
  goToNextScene: () => void;
  completeBeat: (sceneIndex: number, beatIndex: number) => void;
  resetLecture: () => void;
}

/*
함수 이름 : getCurrentLectureScene
기능 : 지금 설명 중인 장면을 고른다. 시작 전과 끝난 뒤에는 설명 중인 장면이 없다.
인자 : LectureState state -> 강의 store 상태
반환값 : 지금 장면. 재생 중이나 일시정지 중이 아니면 null
*/
export const getCurrentLectureScene = (
  state: Pick<LectureState, "status" | "script" | "sceneIndex">,
): EditorLectureScene | null => {
  if (state.status !== "playing" && state.status !== "paused") return null;

  return state.script?.scenes[state.sceneIndex] ?? null;
};

const initialState = {
  script: null,
  status: "idle",
  sceneIndex: 0,
  beatIndex: 0,
} satisfies Pick<
  LectureState,
  "script" | "status" | "sceneIndex" | "beatIndex"
>;

/*
강의 재생 위치는 treeStore와 따로 둔다. 강의는 서버와 무관한 화면 상태라 undo 대상이 아니고,
강의가 진행될 때마다 treeStore의 handleSet 비교를 거칠 이유도 없다. 강조·접힘 store와 같은 이유다.
*/
export const useLectureStore = create<LectureState>()((set, get) => ({
  ...initialState,

  startLecture: (script) => {
    if (script.scenes.length === 0) return;

    set({ script, status: "playing", sceneIndex: 0, beatIndex: 0 });
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
  함수 이름 : goToNextScene
  기능 : 현재 장면의 남은 비트를 건너뛰고 다음 장면의 첫 비트로 이동한다.
  인자 : 없음
  반환값 : 없음
  */
  goToNextScene: () => {
    const { status, script, sceneIndex } = get();

    if ((status !== "playing" && status !== "paused") || script === null) {
      return;
    }

    if (sceneIndex + 1 >= script.scenes.length) {
      set({ status: "ended" });
      return;
    }

    set({ sceneIndex: sceneIndex + 1, beatIndex: 0 });
  },

  /*
  함수 이름 : completeBeat
  기능 : 지금 재생 중인 비트가 끝났을 때 다음 비트나 장면으로 이동하고 마지막이면 강의를 끝낸다.
  인자 : number sceneIndex -> 완료된 비트의 장면 위치
  number beatIndex -> 완료된 비트 위치
  반환값 : 없음
  */
  completeBeat: (completedSceneIndex, completedBeatIndex) => {
    const { status, script, sceneIndex, beatIndex } = get();

    if (
      status !== "playing" ||
      script === null ||
      completedSceneIndex !== sceneIndex ||
      completedBeatIndex !== beatIndex
    ) {
      return;
    }

    const scene = script.scenes[sceneIndex];
    if (beatIndex + 1 < scene.beats.length) {
      set({ beatIndex: beatIndex + 1 });
      return;
    }

    if (sceneIndex + 1 < script.scenes.length) {
      set({ sceneIndex: sceneIndex + 1, beatIndex: 0 });
      return;
    }

    set({ status: "ended" });
  },

  resetLecture: () => set(initialState),
}));
