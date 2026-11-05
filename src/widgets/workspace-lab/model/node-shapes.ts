export interface WorkspaceLabNodeShapeDefinition {
  id: string;
  name: string;
  description: string;
}

/*
새 모양은 이 목록에 정의하고 WorkspaceLab.module.css의 data-shape 스타일만
추가하면 Inspector와 미리보기에 자동으로 연결된다.
*/
export const workspaceLabNodeShapes = [
  {
    id: "square",
    name: "사각형",
    description: "각진 모서리로 구조와 그리드의 인상을 강조합니다.",
  },
  {
    id: "rounded",
    name: "둥근 사각형",
    description: "현재 테마의 곡률을 사용해 친근함과 가독성의 균형을 맞춥니다.",
  },
  {
    id: "circle",
    name: "원형",
    description: "동일한 직경 안에 내용을 모아 개념과 관계를 강조합니다.",
  },
] as const satisfies readonly WorkspaceLabNodeShapeDefinition[];

export type WorkspaceLabNodeShapeId =
  (typeof workspaceLabNodeShapes)[number]["id"];

export function getWorkspaceLabNodeShape(
  id: WorkspaceLabNodeShapeId,
): WorkspaceLabNodeShapeDefinition {
  return (
    workspaceLabNodeShapes.find((shape) => shape.id === id) ??
    workspaceLabNodeShapes[1]
  );
}
