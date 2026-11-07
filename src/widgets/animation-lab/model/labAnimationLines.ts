import {
  getLectureActionNodeIds,
  type LectureAnimation,
} from "@/src/entities/lecture";

export type LabAnimationLine = {
  depth: number; // 그룹 중첩 깊이. 들여쓰기에 쓴다
  text: string;
};

/*
함수 이름 : getLabAnimationLines
기능 : 애니메이션을 들여쓴 한 줄 요약 목록으로 펼친다. recipe가 어떤 단위 동작을 만들었는지 한눈에 보기 위해서다.
인자 : LectureAnimation animation -> 펼칠 애니메이션
ReadonlyMap<string, string> labelByNodeId -> 노드 ID별 화면 이름. 없는 노드는 ID를 그대로 쓴다
number depth -> 들여쓰기 깊이
반환값 : 깊이와 문구 목록
*/
export const getLabAnimationLines = (
  animation: LectureAnimation,
  labelByNodeId: ReadonlyMap<string, string>,
  depth = 0,
): LabAnimationLine[] => {
  if (animation.type === "group") {
    return [
      { depth, text: animation.mode === "sequence" ? "순차" : "병렬" },
      ...animation.children.flatMap((child) =>
        getLabAnimationLines(child, labelByNodeId, depth + 1),
      ),
    ];
  }

  const labels = (getLectureActionNodeIds(animation) ?? []).map(
    (nodeId) => labelByNodeId.get(nodeId) ?? nodeId,
  );
  const details = [
    labels.join(animation.type === "trace" ? " → " : ", "),
    animation.type === "reset" ? animation.scope : null,
    "durationMs" in animation ? `${animation.durationMs}ms` : null,
    "persist" in animation && animation.persist ? "유지" : null,
  ].filter(Boolean);

  return [{ depth, text: [animation.type, ...details].join(" · ") }];
};
