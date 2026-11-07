import {
  getLectureActionNodeIds,
  getLectureEffectNodeIdsField,
  type LectureAnimation,
  type LectureEffectNodeIdsField,
  type LectureScript,
} from "@/src/entities/lecture";
import {
  type CustomEditorNode,
  type EditorLectureAnimation,
  type EditorLectureAnimationAction,
  type EditorLectureScript,
} from "../../model/types";
import { createLectureNodeIdResolver } from "./createLectureNodeIdResolver";

type FindClientId = ReturnType<typeof createLectureNodeIdResolver>;

/*
대본의 노드 ID 필드가 편집기 동작에서 갖는 이름. Record라서 registry에 새 필드가 생기면 여기서 타입 오류가 난다.
*/
const EDITOR_CLIENT_IDS_FIELD: Record<LectureEffectNodeIdsField, string> = {
  targetNodeIds: "targetClientIds",
  exceptNodeIds: "exceptClientIds",
  nodeIds: "clientIds",
};

/*
함수 이름 : getEditorLectureAnimation
기능 : 애니메이션 트리 안의 모든 서버 노드 ID를 편집기 clientId로 바꾼다.
인자 : LectureAnimation animation -> 변환할 애니메이션 또는 조합 그룹
FindClientId findClientId -> 서버 노드 ID를 clientId로 바꾸는 함수
반환값 : 편집기에서 실행할 애니메이션. 서버 노드 ID 하나라도 찾지 못하면 null
*/
export const getEditorLectureAnimation = (
  animation: LectureAnimation,
  findClientId: FindClientId,
): EditorLectureAnimation | null => {
  if (animation.type === "group") {
    const children: EditorLectureAnimation[] = [];

    for (const child of animation.children) {
      const editorChild = getEditorLectureAnimation(child, findClientId);

      if (editorChild === null) return null;
      children.push(editorChild);
    }

    return { ...animation, children };
  }

  const field = getLectureEffectNodeIdsField(animation);
  const nodeIds = getLectureActionNodeIds(animation);

  /*
  동작 종류와 필드를 TS가 함께 좁히지 못해 아래 두 결과를 단언한다. 동작마다 옮긴 결과는 getEditorLectureScript.test.ts가 확인한다.
  노드를 가리키지 않는 동작(wait, reset)은 편집기에서도 모양이 같다.
  */
  if (field === null || nodeIds === null) {
    return animation as EditorLectureAnimationAction;
  }

  const clientIds = nodeIds.map(findClientId);

  if (clientIds.includes(null)) return null;

  /*
  노드 필드 하나만 편집기 이름으로 옮기고 나머지 옵션은 그대로 둔다.
  */
  const editorAction: Record<string, unknown> = { ...animation };

  delete editorAction[field];
  editorAction[EDITOR_CLIENT_IDS_FIELD[field]] = clientIds;

  return editorAction as EditorLectureAnimationAction;
};

/*
함수 이름 : getEditorLectureScript
기능 : 강의 대본의 중심 노드와 모든 단위 동작의 서버 노드 ID를 현재 편집기의 clientId에 연결한다.
인자 : LectureScript script -> LLM 또는 목데이터가 만든 강의 대본
CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
반환값 : 편집기에서 실행할 강의 대본. 서버 노드 ID 하나라도 찾지 못하면 null
*/
export const getEditorLectureScript = (
  script: LectureScript,
  nodes: CustomEditorNode[],
): EditorLectureScript | null => {
  const findClientId = createLectureNodeIdResolver(nodes);
  const scenes: EditorLectureScript["scenes"] = [];

  for (const scene of script.scenes) {
    const clientId = findClientId(scene.nodeId);

    if (clientId === null) return null;

    const beats = [];

    for (const beat of scene.beats) {
      const animation = getEditorLectureAnimation(beat.animation, findClientId);

      if (animation === null) return null;
      beats.push({ ...beat, animation });
    }

    scenes.push({ id: scene.id, clientId, beats });
  }

  return { ...script, scenes };
};
