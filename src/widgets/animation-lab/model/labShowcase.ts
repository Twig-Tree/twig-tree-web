import {
  type LectureAnimation,
  type LectureNodeId,
  type LectureNodePath,
  SHOWCASE_DEMO_LECTURE,
} from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "./fixtureTree";
import { getLabScenarioAnimation } from "./labScenarioRun";

/*
함수 이름 : findLabNodeId
기능 : 노드 이름 경로를 따라 랩 고정 트리에서 노드 ID를 찾는다.
인자 : LectureNodePath path -> 루트부터의 노드 이름 경로
반환값 : 찾은 노드 ID. 경로 중간에 없는 이름이 있으면 null
*/
const findLabNodeId = (path: LectureNodePath): LectureNodeId | null => {
  let parentId: string | null = null;

  for (const name of path) {
    const node = ANIMATION_LAB_TREE.find(
      (candidate) =>
        candidate.parentId === parentId && candidate.label === name,
    );

    if (node === undefined) return null;

    parentId = node.id;
  }

  return parentId;
};

/*
함수 이름 : getLabShowcaseAnimation
기능 : 발표 시연 강의를 랩 고정 트리에 연결하고, 강의 플레이어와 같은 흐름의 애니메이션 하나로 잇는다.
내레이션 자리는 fallbackDurationMs만큼 머물고, 장면이 바뀌면 남은 효과를 지운다. 자막과 음성은 없다.
인자 : 없음
반환값 : 대본 전체를 차례로 재생하는 애니메이션. 고정 트리가 발표 트리와 어긋나 노드를 찾지 못하면 null
*/
export const getLabShowcaseAnimation = (): LectureAnimation | null => {
  const script = SHOWCASE_DEMO_LECTURE.createScript(findLabNodeId);

  return script === null ? null : getLabScenarioAnimation(script);
};
