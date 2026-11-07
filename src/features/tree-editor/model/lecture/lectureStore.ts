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
  seekId: number; // 사용자가 위치를 옮길 때마다 늘어난다. 같은 위치를 다시 재생할 때도 비트를 새로 시작하기 위해 쓴다
  startLecture: (script: EditorLectureScript) => void;
  pauseLecture: () => void;
  resumeLecture: () => void;
  goToNextScene: () => void;
  goToPreviousScene: () => void;
  goToNextBeat: () => void;
  goToPreviousBeat: () => void;
  replayBeat: () => void;
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
  seekId: 0,
} satisfies Pick<
  LectureState,
  "script" | "status" | "sceneIndex" | "beatIndex" | "seekId"
>;

/*
강의 재생 위치는 treeStore와 따로 둔다. 강의는 서버와 무관한 화면 상태라 undo 대상이 아니고,
강의가 진행될 때마다 treeStore의 handleSet 비교를 거칠 이유도 없다. 강조·접힘 store와 같은 이유다.
*/
/*
함수 이름 : useIsLectureActive
기능 : 강의가 재생 중이거나 일시정지 중인지 구독한다.
인자 : 없음
반환값 : 강의가 진행되는 중이면 true
*/
export const useIsLectureActive = () =>
  useLectureStore(
    (state) => state.status === "playing" || state.status === "paused",
  );

export const useLectureStore = create<LectureState>()((set, get) => {
  /*
  함수 이름 : getActiveScript
  기능 : 강의가 진행 중이면 대본을 돌려준다. 끝났거나 시작 전이면 옮길 위치가 없다.
  인자 : 없음
  반환값 : 대본. 진행 중이 아니면 null
  */
  const getActiveScript = () => {
    const { status, script } = get();

    return status === "playing" || status === "paused" ? script : null;
  };

  const seekTo = (sceneIndex: number, beatIndex: number) => {
    set(({ seekId }) => ({ sceneIndex, beatIndex, seekId: seekId + 1 }));
  };

  return {
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
      const script = getActiveScript();
      const { sceneIndex } = get();

      if (script === null) return;

      if (sceneIndex + 1 >= script.scenes.length) {
        set({ status: "ended" });
        return;
      }

      seekTo(sceneIndex + 1, 0);
    },

    /*
  함수 이름 : goToPreviousScene
  기능 : 이전 장면의 첫 비트로 이동한다. 첫 장면이면 그 장면의 처음으로 돌아간다.
  인자 : 없음
  반환값 : 없음
  */
    goToPreviousScene: () => {
      if (getActiveScript() === null) return;

      seekTo(Math.max(0, get().sceneIndex - 1), 0);
    },

    /*
  함수 이름 : goToNextBeat
  기능 : 다음 비트로 이동한다. 장면의 마지막 비트면 다음 장면으로 가고, 강의의 마지막 비트면 강의를 끝낸다.
  인자 : 없음
  반환값 : 없음
  */
    goToNextBeat: () => {
      const script = getActiveScript();
      const { sceneIndex, beatIndex } = get();

      if (script === null) return;

      if (beatIndex + 1 < script.scenes[sceneIndex].beats.length) {
        seekTo(sceneIndex, beatIndex + 1);
        return;
      }

      get().goToNextScene();
    },

    /*
  함수 이름 : goToPreviousBeat
  기능 : 이전 비트로 이동한다. 장면의 첫 비트면 이전 장면의 마지막 비트로 가고, 강의의 첫 비트면 그 비트를 처음부터 다시 재생한다.
  인자 : 없음
  반환값 : 없음
  */
    goToPreviousBeat: () => {
      const script = getActiveScript();
      const { sceneIndex, beatIndex } = get();

      if (script === null) return;

      if (beatIndex > 0) {
        seekTo(sceneIndex, beatIndex - 1);
        return;
      }

      if (sceneIndex > 0) {
        const previousBeatCount = script.scenes[sceneIndex - 1].beats.length;

        seekTo(sceneIndex - 1, Math.max(0, previousBeatCount - 1));
        return;
      }

      seekTo(0, 0);
    },

    /*
  함수 이름 : replayBeat
  기능 : 지금 비트를 처음부터 다시 재생한다. 다시 듣는 동작이므로 일시정지 중이어도 재생을 시작한다.
  인자 : 없음
  반환값 : 없음
  */
    replayBeat: () => {
      if (getActiveScript() === null) return;

      const { sceneIndex, beatIndex } = get();

      set({ status: "playing" });
      seekTo(sceneIndex, beatIndex);
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
  };
});
