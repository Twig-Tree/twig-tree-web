import type { CSSProperties } from "react";

export interface WorkspaceLabShapeTokens {
  nodeRadius: string;
  nodeShadow: string;
  selectedShadow: string;
  rootShadow: string;
  toolbarShadow: string;
  playerShadow: string;
}

export interface WorkspaceLabShapeStyleDefinition {
  id: string;
  name: string;
  description: string;
  tokens: WorkspaceLabShapeTokens;
}

/*
그림자는 모양만 정하고 색은 컬러 테마의 --lab-shadow-ink에서 섞는다.
형태와 컬러 테마를 따로 골라도 그림자가 바탕색과 어긋나지 않는다.
*/
const ink = (percent: number) =>
  `color-mix(in srgb, var(--lab-shadow-ink) ${percent}%, transparent)`;

export const workspaceLabShapeStyles = [
  {
    id: "layered",
    name: "겹그림자",
    description:
      "얕은 윤곽 그림자와 넓은 확산 그림자를 겹쳐 차분하게 띄웁니다.",
    tokens: {
      nodeRadius: "12px",
      nodeShadow: `0 1px 2px ${ink(7)}, 0 8px 24px ${ink(6)}`,
      selectedShadow: `0 12px 30px ${ink(20)}`,
      rootShadow: `0 1px 2px ${ink(22)}, 0 12px 30px ${ink(20)}`,
      toolbarShadow: `0 14px 32px ${ink(22)}`,
      playerShadow: `0 14px 34px ${ink(14)}`,
    },
  },
  {
    id: "standard",
    name: "표준",
    description: "제품 UI에 흔한 곡률과 한 겹 그림자입니다.",
    tokens: {
      nodeRadius: "14px",
      nodeShadow: `0 8px 24px ${ink(8)}`,
      selectedShadow: `0 8px 24px ${ink(8)}`,
      rootShadow: `0 8px 24px ${ink(8)}`,
      toolbarShadow: `0 10px 24px ${ink(12)}`,
      playerShadow: `0 10px 24px ${ink(12)}`,
    },
  },
  {
    id: "diffuse",
    name: "부드러운 확산",
    description: "큰 곡률과 넓게 번지는 그림자로 친근하게 띄웁니다.",
    tokens: {
      nodeRadius: "20px",
      nodeShadow: `0 10px 30px ${ink(11)}`,
      selectedShadow: `0 10px 30px ${ink(15)}`,
      rootShadow: `0 10px 30px ${ink(11)}`,
      toolbarShadow: `0 10px 24px ${ink(12)}`,
      playerShadow: `0 10px 24px ${ink(12)}`,
    },
  },
  {
    id: "hard",
    name: "하드 섀도",
    description:
      "작은 곡률과 번지지 않는 오프셋 그림자로 경계를 뚜렷하게 합니다.",
    tokens: {
      nodeRadius: "6px",
      nodeShadow: `3px 3px 0 ${ink(88)}`,
      selectedShadow: `3px 3px 0 ${ink(88)}`,
      rootShadow: `3px 3px 0 ${ink(88)}`,
      toolbarShadow: `3px 3px 0 ${ink(88)}`,
      playerShadow: `3px 3px 0 ${ink(88)}`,
    },
  },
  {
    id: "flat",
    name: "플랫",
    description:
      "노드에 그림자를 두지 않고 선과 면의 대비로만 구분합니다. 떠 있는 툴바만 얕게 띄웁니다.",
    tokens: {
      nodeRadius: "4px",
      nodeShadow: "none",
      selectedShadow: "none",
      rootShadow: "none",
      toolbarShadow: `0 2px 8px ${ink(18)}`,
      playerShadow: `0 2px 8px ${ink(18)}`,
    },
  },
] as const satisfies readonly WorkspaceLabShapeStyleDefinition[];

export type WorkspaceLabShapeStyleId =
  (typeof workspaceLabShapeStyles)[number]["id"];

const shapeTokenCssVariables = {
  nodeRadius: "--lab-node-radius",
  nodeShadow: "--lab-node-shadow",
  selectedShadow: "--lab-selected-shadow",
  rootShadow: "--lab-root-shadow",
  toolbarShadow: "--lab-toolbar-shadow",
  playerShadow: "--lab-player-shadow",
} as const satisfies Record<keyof WorkspaceLabShapeTokens, `--lab-${string}`>;

type WorkspaceLabShapeStyle = CSSProperties &
  Record<
    (typeof shapeTokenCssVariables)[keyof typeof shapeTokenCssVariables],
    string
  >;

export const getWorkspaceLabShapeStyle = (
  id: WorkspaceLabShapeStyleId,
): WorkspaceLabShapeStyleDefinition =>
  workspaceLabShapeStyles.find((shape) => shape.id === id) ??
  workspaceLabShapeStyles[0];

export function getWorkspaceLabShapeCssStyle(
  shape: WorkspaceLabShapeStyleDefinition,
): WorkspaceLabShapeStyle {
  const style = {} as WorkspaceLabShapeStyle;

  for (const tokenName of Object.keys(shapeTokenCssVariables) as Array<
    keyof WorkspaceLabShapeTokens
  >) {
    style[shapeTokenCssVariables[tokenName]] = shape.tokens[tokenName];
  }

  return style;
}
