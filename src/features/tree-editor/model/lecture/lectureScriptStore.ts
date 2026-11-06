import { create } from "zustand";
import { type EditorLectureScene, type EditorLectureScript } from "../types";
import { type LecturePlaybackStatus } from "./lectureStore";

interface LectureScriptState {
  script: EditorLectureScript | null; // 편집기 노드에 연결한 동적 대본
  status: LecturePlaybackStatus;
  sceneIndex: number; // 현재 장면
  beatIndex: number; // 현재 장면 안에서 재생 중인 비트
  startScript: (script: EditorLectureScript) => void;
  pauseScript: () => void;
  resumeScript: () => void;
  goToNextScene: () => void;
  completeBeat: (sceneIndex: number, beatIndex: number) => void;
  resetScript: () => void;
}

/*
함수 이름 : getCurrentLectureScene
기능 : 지금 설명 중인 장면을 고른다. 시작 전과 끝난 뒤에는 설명 중인 장면이 없다.
인자 : LectureScriptState state -> 강의 store 상태
반환값 : 지금 장면. 재생 중이나 일시정지 중이 아니면 null
*/
export const getCurrentLectureScene = (
  state: Pick<LectureScriptState, "status" | "script" | "sceneIndex">,
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
  LectureScriptState,
  "script" | "status" | "sceneIndex" | "beatIndex"
>;

/*
동적 강의의 재생 위치를 기존 구간 강의와 분리한다. 두 형식은 전환 기준이 각각 자막과 비트로 달라
하나의 store에 섞으면 모든 action이 두 데이터 모양을 동시에 처리해야 한다.
*/
export const useLectureScriptStore = create<LectureScriptState>()(
  (set, get) => ({
    ...initialState,

    startScript: (script) => {
      if (script.scenes.length === 0) return;

      set({ script, status: "playing", sceneIndex: 0, beatIndex: 0 });
    },

    pauseScript: () => {
      if (get().status !== "playing") return;
      set({ status: "paused" });
    },

    resumeScript: () => {
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

    resetScript: () => set(initialState),
  }),
);
