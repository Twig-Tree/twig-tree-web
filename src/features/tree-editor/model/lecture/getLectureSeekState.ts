import { getReducedMotionAnimation } from "@/src/entities/lecture";
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
  isReducedMotion: boolean; // 동작 줄이기를 켰는지. 재생기가 실행할 대본과 같은 대본으로 되감는다
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
  layers: LectureVisualLayer[]; // 그 위치에서 보여 줄 시각 레이어
  previewLayerIds: string[]; // layers 중 옮길 비트의 연출로 잠시 보여 주는 레이어. 비트를 재생할 때 걷어 낸다
  camera: LectureSeekCamera | null; // 옮길 카메라. 이동이 필요 없으면 null
};

/*
함수 이름 : getActionDurationMs
기능 : 재생기가 단위 동작 다음으로 넘어가기까지 기다리는 시간을 구한다. progressive trace는 유지되더라도 경로를 다 그린 뒤에 넘어간다.
인자 : EditorLectureAnimationAction action -> 단위 동작
반환값 : 기다리는 시간(ms)
*/
const getActionDurationMs = (action: EditorLectureAnimationAction): number => {
  if (action.type === "reset") return 0;
  if (action.type === "trace" && action.mode === "progressive") {
    return action.durationMs;
  }
  if ("persist" in action && action.persist) return 0;

  return action.durationMs;
};

/*
함수 이름 : getTimedActions
기능 : 동작 트리를 재생기와 같은 시각표로 펼친다. 병렬 그룹의 자식은 같은 시각에 시작하고 순차 그룹의 자식은 앞 자식이 끝난 뒤 시작한다.
인자 : EditorLectureAnimation animation -> 동작 트리
number startMs -> 이 동작이 시작하는 시각
반환값 : 시작 시각이 붙은 단위 동작 목록과 끝나는 시각
*/
const getTimedActions = (
  animation: EditorLectureAnimation,
  startMs: number,
): {
  actions: { action: EditorLectureAnimationAction; startMs: number }[];
  endMs: number;
} => {
  if (animation.type !== "group") {
    return {
      actions: [{ action: animation, startMs }],
      endMs: startMs + getActionDurationMs(animation),
    };
  }

  const actions: { action: EditorLectureAnimationAction; startMs: number }[] =
    [];
  let endMs = startMs;

  for (const child of animation.children) {
    const timed = getTimedActions(
      child,
      animation.mode === "parallel" ? startMs : endMs,
    );

    actions.push(...timed.actions);
    endMs = Math.max(endMs, timed.endMs);
  }

  return { actions, endMs };
};

/*
함수 이름 : getOrderedActions
기능 : 동작 트리의 단위 동작을 실제로 시작하는 순서로 늘어놓는다. 적힌 순서대로 적용하면 병렬 그룹 안의 순차 동작이 재생과 다른 결과를 낸다.
인자 : EditorLectureAnimation animation -> 동작 트리
반환값 : 시작 순서로 정렬한 단위 동작 목록. 같은 시각이면 적힌 순서를 따른다
*/
const getOrderedActions = (
  animation: EditorLectureAnimation,
): EditorLectureAnimationAction[] =>
  getTimedActions(animation, 0)
    .actions.slice()
    .sort((a, b) => a.startMs - b.startMs)
    .map(({ action }) => action);

/*
함수 이름 : getLectureSeekState
기능 : 강의를 처음부터 옮길 위치까지 따라가, 그 위치의 접힘, 시각 레이어, 마지막 카메라를 구한다.
인자 : GetLectureSeekStateParams
반환값 : 옮길 위치의 상태

시각 레이어는 장면을 떠나면 사라지므로 옮길 장면의 동작만 남긴다. 유지되지 않는 레이어는 일시정지 중인 옮길 비트의 것만 보여 준다.
옮길 비트를 재생할 때 그 비트가 카메라 동작으로 시작하면 앞선 카메라로 옮겼다가 다시 움직이게 되므로 카메라를 비운다.
*/
export const getLectureSeekState = ({
  script,
  sceneIndex,
  beatIndex,
  isTargetBeatIncluded,
  isReducedMotion,
  nodes,
  edges,
  baseCollapsedServerIds,
}: GetLectureSeekStateParams): LectureSeekState => {
  /*
  동작 줄이기는 꾸밈의 모양과 순차 추적의 유지 시점을 바꾼다. 재생과 다른 대본으로 되감으면 옮긴 화면과 재생 화면이 어긋난다.
  */
  const getBeatActions = (animation: EditorLectureAnimation) =>
    getOrderedActions(
      isReducedMotion ? getReducedMotionAnimation(animation) : animation,
    );

  const collapsedServerIds = new Set(baseCollapsedServerIds);
  let layers: LectureVisualLayer[] = [];
  const previewLayerIds: string[] = [];
  let camera: LectureSeekCamera | null = null;

  const expand = (clientIds: string[]) => {
    getLectureCollapseServerIds("expand", clientIds, nodes, edges).forEach(
      (serverId) => collapsedServerIds.delete(serverId),
    );
  };

  const applyAction = (
    action: EditorLectureAnimationAction,
    isPreviewBeat: boolean,
  ) => {
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
      case "trace":
      case "badge": {
        const isPersistent = "persist" in action && action.persist;

        if (!isPersistent && !isPreviewBeat) break;

        const layer = createLectureVisualLayer(action);

        layers.push(layer);
        if (!isPersistent) previewLayerIds.push(layer.id);
        break;
      }
      case "wait":
        break; // 시간만 보내므로 되감은 상태에 남기는 것이 없다
      default: {
        /*
        동작 종류가 늘었는데 되감기에 분기를 빠뜨리면 여기서 타입 오류가 난다.
        */
        const unhandledAction: never = action;

        return unhandledAction;
      }
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

      const isPreviewBeat = isTargetScene && currentBeatIndex === beatIndex;

      getBeatActions(beat.animation).forEach((action) =>
        applyAction(action, isPreviewBeat),
      );
    });
  });

  const targetBeat = script.scenes[sceneIndex]?.beats[beatIndex];
  const firstAction = targetBeat && getBeatActions(targetBeat.animation)[0];
  const startsWithCamera =
    !isTargetBeatIncluded &&
    (firstAction?.type === "focus" ||
      (firstAction?.type === "reset" && firstAction.scope !== "visual"));

  return {
    collapsedServerIds,
    layers,
    previewLayerIds,
    camera: startsWithCamera ? null : camera,
  };
};
