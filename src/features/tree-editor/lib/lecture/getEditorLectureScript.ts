import {
  type LectureAnimation,
  type LectureScript,
} from "@/src/entities/lecture";
import {
  type CustomEditorNode,
  type EditorLectureAnimation,
  type EditorLectureScript,
} from "../../model/types";
import { createLectureNodeIdResolver } from "./createLectureNodeIdResolver";

type FindClientId = ReturnType<typeof createLectureNodeIdResolver>;

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

  const getClientIds = (nodeIds: string[]): string[] | null => {
    const clientIds = nodeIds.map(findClientId);

    return clientIds.includes(null)
      ? null
      : clientIds.filter((clientId) => clientId !== null);
  };

  switch (animation.type) {
    case "focus":
    case "highlight": {
      const targetClientIds = getClientIds(animation.targetNodeIds);

      if (targetClientIds === null) return null;

      return animation.type === "focus"
        ? {
            type: animation.type,
            targetClientIds,
            maxZoom: animation.maxZoom,
            durationMs: animation.durationMs,
          }
        : {
            type: animation.type,
            targetClientIds,
            style: animation.style,
            durationMs: animation.durationMs,
            ...(animation.persist === undefined
              ? {}
              : { persist: animation.persist }),
          };
    }
    case "dim": {
      const exceptClientIds = getClientIds(animation.exceptNodeIds);

      if (exceptClientIds === null) return null;
      return {
        type: animation.type,
        exceptClientIds,
        durationMs: animation.durationMs,
        ...(animation.persist === undefined
          ? {}
          : { persist: animation.persist }),
      };
    }
    case "trace": {
      const clientIds = getClientIds(animation.nodeIds);

      if (clientIds === null) return null;
      return {
        type: animation.type,
        clientIds,
        durationMs: animation.durationMs,
      };
    }
    case "reset":
      return animation;
  }
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
