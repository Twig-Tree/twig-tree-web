import {
  type LectureNodeId,
  type LectureNodePath,
  type LectureScript,
} from "./types";

/*
서버가 강의를 내려주기 전까지 쓰는 데모 강의. 노드 ID는 DB가 저장할 때마다 새로 부여하므로 대본에 고정할 수 없다.
이름 경로로 지금 트리의 서버 노드 ID를 찾아 일반 LectureScript를 만들고, 플레이어는 서버 ID만 안다.
강의 API를 연결하면 이 데모 경로와 함께 사라진다.
*/
export interface DemoLecture {
  createScript: (
    findNodeId: (path: LectureNodePath) => LectureNodeId | null,
  ) => LectureScript | null; // 경로 하나라도 찾지 못하면 null
}

/*
함수 이름 : createDemoLecture
기능 : 노드 이름 경로와 대본 생성 함수를 묶어 지금 트리에 맞출 수 있는 데모 강의를 만든다.
인자 : Record<K, LectureNodePath> nodePaths -> 대본이 가리키는 노드의 이름과 경로
(nodeIds: Record<K, LectureNodeId>) => LectureScript createScript -> 찾은 서버 노드 ID로 대본을 만드는 함수
반환값 : 데모 강의
*/
export const createDemoLecture = <K extends string>(
  nodePaths: Record<K, LectureNodePath>,
  createScript: (nodeIds: Record<K, LectureNodeId>) => LectureScript,
): DemoLecture => ({
  createScript: (findNodeId) => {
    const nodeIds = {} as Record<K, LectureNodeId>;

    for (const key of Object.keys(nodePaths) as K[]) {
      const nodeId = findNodeId(nodePaths[key]);

      if (nodeId === null) return null;

      nodeIds[key] = nodeId;
    }

    return createScript(nodeIds);
  },
});
