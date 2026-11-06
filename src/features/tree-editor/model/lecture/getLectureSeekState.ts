import { getAncestorClientIds } from "../../lib/getAncestorClientIds";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
  type EditorLectureAnimation,
  type EditorLectureAnimationAction,
  type EditorLectureScript,
} from "../types";
import { type LectureVisualLayer } from "./lectureAnimationStore";
import {
  createLectureVisualLayer,
  getLectureCollapseServerIds,
} from "./runLectureAnimation";

type GetLectureSeekStateParams = {
  script: EditorLectureScript; // 강의 대본
  sceneIndex: number; // 옮길 장면
  beatIndex: number; // 옮길 비트
  isTargetBeatIncluded: boolean; // 옮길 비트의 연출까지 적용할지. 비트를 곧바로 재생하면 그 재생이 적용하므로 빼고, 일시정지 중이면 넣는다
  nodes: CustomEditorNode[]; // 트리의 노드 목록
  edges: CustomEditorEdge[]; // 트리의 엣지 목록
  baseCollapsedServerIds: ReadonlySet<string>; // 강의를 시작할 때의 접힘 집합
};

export type LectureSeekCamera =
  | { type: "reset" }
  | {
      type: "focus";
      clientIds: string[];
      options: { maxZoom: number; duration: number };
    };

type LectureSeekState = {
  collapsedServerIds: Set<string>; // 그 위치의 접힘 집합
  layers: LectureVisualLayer[]; // 그 위치에서 유지되는 시각 레이어
  camera: LectureSeekCamera | null; // 옮길 카메라. 이동이 필요 없으면 null
};

/*
함수 이름 : getFlatActions
기능 : 동작 트리를 대본에 적힌 순서대로 펼친다. 병렬 그룹도 접힘과 레이어의 결과는 순서와 관계없다.
인자 : EditorLectureAnimation animation -> 동작 트리
반환값 : 단위 동작 목록
*/
const getFlatActions = (
  animation: EditorLectureAnimation,
): EditorLectureAnimationAction[] =>
  animation.type === "group"
    ? animation.children.flatMap(getFlatActions)
    : [animation];

/*
함수 이름 : getLectureSeekState
기능 : 강의를 처음부터 옮길 위치까지 따라가, 그 위치의 접힘, 유지되는 시각 레이어, 마지막 카메라를 구한다.
인자 : GetLectureSeekStateParams
반환값 : 옮길 위치의 상태

시각 레이어는 장면을 떠나면 사라지므로 옮길 장면의 동작만 남긴다.
옮길 비트를 재생할 때 그 비트가 카메라 동작으로 시작하면 앞선 카메라로 옮겼다가 다시 움직이게 되므로 카메라를 비운다.
*/
export const getLectureSeekState = ({
  script,
  sceneIndex,
  beatIndex,
  isTargetBeatIncluded,
  nodes,
  edges,
  baseCollapsedServerIds,
}: GetLectureSeekStateParams): LectureSeekState => {
  const collapsedServerIds = new Set(baseCollapsedServerIds);
  let layers: LectureVisualLayer[] = [];
  let camera: LectureSeekCamera | null = null;

  const expand = (clientIds: string[]) => {
    getLectureCollapseServerIds("expand", clientIds, nodes, edges).forEach(
      (serverId) => collapsedServerIds.delete(serverId),
    );
  };

  const applyAction = (action: EditorLectureAnimationAction) => {
    switch (action.type) {
      case "focus":
        expand(
          action.targetClientIds.flatMap((clientId) =>
            getAncestorClientIds(edges, clientId),
          ),
        ); // focus는 대상을 드러내려고 조상만 펼치고 대상 자신의 접힘은 그대로 둔다.
        camera = {
          type: "focus",
          clientIds: action.targetClientIds,
          options: { maxZoom: action.maxZoom, duration: action.durationMs },
        };
        break;
      case "collapse":
        getLectureCollapseServerIds(
          "collapse",
          action.targetClientIds,
          nodes,
          edges,
        ).forEach((serverId) => collapsedServerIds.add(serverId));
        break;
      case "expand":
        expand(action.targetClientIds);
        break;
      case "reset":
        if (action.scope !== "camera") layers = [];
        if (action.scope !== "visual") camera = { type: "reset" };
        break;
      case "highlight":
      case "dim":
        if (action.persist) layers.push(createLectureVisualLayer(action));
        break;
      case "trace":
        break;
    }
  };

  script.scenes.slice(0, sceneIndex + 1).forEach((scene, currentSceneIndex) => {
    if (currentSceneIndex === sceneIndex) layers = [];

    scene.beats.forEach((beat, currentBeatIndex) => {
      const isTargetScene = currentSceneIndex === sceneIndex;

      if (isTargetScene && currentBeatIndex > beatIndex) return;

      if (
        isTargetScene &&
        currentBeatIndex === beatIndex &&
        !isTargetBeatIncluded
      ) {
        return;
      }

      getFlatActions(beat.animation).forEach(applyAction);
    });
  });

  const targetBeat = script.scenes[sceneIndex]?.beats[beatIndex];
  const firstAction = targetBeat && getFlatActions(targetBeat.animation)[0];
  const startsWithCamera =
    !isTargetBeatIncluded &&
    (firstAction?.type === "focus" ||
      (firstAction?.type === "reset" && firstAction.scope !== "visual"));

  return {
    collapsedServerIds,
    layers,
    camera: startsWithCamera ? null : camera,
  };
};
