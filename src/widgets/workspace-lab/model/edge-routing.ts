/*
SmoothStep은 source와 target에서 각각 offset만큼 직선으로 빠져나온 뒤 꺾인다.
두 offset이 겹치면 경로가 반대 방향으로 되감기며 불필요한 굴곡이 생기므로,
노드 사이에는 양쪽 offset과 작은 중앙 여유를 합친 길이를 보장한다.
*/
export const workspaceLabSmoothStepRouting = {
  offset: 20,
  borderRadius: 16,
  centerClearance: 8,
} as const;

export const workspaceLabSmoothStepMinimumGap =
  workspaceLabSmoothStepRouting.offset * 2 +
  workspaceLabSmoothStepRouting.centerClearance;
