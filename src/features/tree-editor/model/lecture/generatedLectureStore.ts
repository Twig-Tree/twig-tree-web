import { create } from "zustand";
import { type LectureScript } from "@/src/entities/lecture";

interface GeneratedLectureState {
  scriptByTreeId: Record<string, LectureScript>; // 트리마다 마지막으로 만든 대본
  latestScriptIdByTreeId: Record<string, string>; // 트리마다 마지막으로 시작한 생성 요청의 대본 ID
  markLatestLectureRequest: (treeId: string, scriptId: string) => void;
  setGeneratedLecture: (treeId: string, script: LectureScript) => void;
}

/*
생성한 강의는 백엔드가 아직 저장하지 않아 메모리에만 둔다.
다른 워크스페이스로 옮겨도 남지만 새로고침하면 사라진다. 저장 API가 생기면 강의 조회 query로 바꾼다.
대본은 서버 노드 ID로 노드를 가리키므로, 트리를 고쳐도 재생할 때 지금 노드로 다시 연결한다.
*/
export const useGeneratedLectureStore = create<GeneratedLectureState>()(
  (set) => ({
    scriptByTreeId: {},
    latestScriptIdByTreeId: {},

    /*
    함수 이름 : markLatestLectureRequest
    기능 : 트리의 마지막 생성 요청을 기록한다. 이 요청의 대본만 보관되고 먼저 시작한 요청의 결과는 버려진다.
    인자 : string treeId -> 강의를 만들 트리 ID
    string scriptId -> 이 요청이 만들 대본의 ID
    반환값 : 없음
    */
    markLatestLectureRequest: (treeId, scriptId) =>
      set((state) => ({
        latestScriptIdByTreeId: {
          ...state.latestScriptIdByTreeId,
          [treeId]: scriptId,
        },
      })),

    /*
    함수 이름 : setGeneratedLecture
    기능 : 트리의 생성 강의를 새 대본으로 바꾼다. 트리마다 하나만 두고, 마지막 요청의 대본이 아니면 무시한다.
    인자 : string treeId -> 강의를 만든 트리 ID
    LectureScript script -> 생성한 대본
    반환값 : 없음

    입력 카드의 중복 요청 방지는 화면을 떠나면 사라져, 같은 트리의 요청이 겹칠 수 있다. 이때 응답 순서가 아니라 요청 순서로 정한다.
    */
    setGeneratedLecture: (treeId, script) =>
      set((state) =>
        state.latestScriptIdByTreeId[treeId] === script.id
          ? { scriptByTreeId: { ...state.scriptByTreeId, [treeId]: script } }
          : state,
      ),
  }),
);
