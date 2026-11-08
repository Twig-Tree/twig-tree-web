import { create } from "zustand";
import { type LectureScript } from "@/src/entities/lecture";

interface GeneratedLectureState {
  scriptByTreeId: Record<string, LectureScript>; // 트리마다 마지막으로 만든 대본
  setGeneratedLecture: (treeId: string, script: LectureScript) => void;
}

/*
생성한 강의는 백엔드가 아직 저장하지 않아(BE-twig-tree#124) 메모리에만 둔다.
다른 워크스페이스로 옮겨도 남지만 새로고침하면 사라진다. 저장 API가 생기면 강의 조회 query로 바꾼다.
대본은 서버 노드 ID로 노드를 가리키므로, 트리를 고쳐도 재생할 때 지금 노드로 다시 연결한다.
*/
export const useGeneratedLectureStore = create<GeneratedLectureState>()(
  (set) => ({
    scriptByTreeId: {},

    /*
    함수 이름 : setGeneratedLecture
    기능 : 트리의 생성 강의를 새 대본으로 바꾼다. 트리마다 하나만 둔다.
    인자 : string treeId -> 강의를 만든 트리 ID
    LectureScript script -> 생성한 대본
    반환값 : 없음
    */
    setGeneratedLecture: (treeId, script) =>
      set((state) => ({
        scriptByTreeId: { ...state.scriptByTreeId, [treeId]: script },
      })),
  }),
);
