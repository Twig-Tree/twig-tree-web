import { BackgroundVariant } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { WorkspaceLabNodeShapeId } from "./node-shapes";

interface VisualSlotDefinition {
  id: string;
  name: string;
  description: string;
}

export interface WorkspaceLabCanvasBackgroundLayer {
  variant: BackgroundVariant;
  gap: number;
  size?: number; // 도트 지름과 크로스 길이
  lineWidth?: number; // 라인과 크로스 두께
  color: string;
}

export interface WorkspaceLabCanvasStyleDefinition extends VisualSlotDefinition {
  /*
  아래에서 위 순서로 쌓는 React Flow 패턴 레이어다.
  비어 있으면 root의 테마 캔버스 색과 CSS 질감만 보인다.
  */
  backgrounds?: readonly WorkspaceLabCanvasBackgroundLayer[];
}

export interface WorkspaceLabConnectionPointTokens {
  width: string; // 위·아래 접점 기준 가로 길이. 왼쪽·오른쪽 접점은 가로와 세로를 바꿔 그린다.
  height: string; // 위·아래 접점 기준 세로 길이
  radius: string;
  borderWidth: string;
  borderStyle: "solid" | "dashed";
  borderColor: string;
  fill: string;
  shadow: string; // 테두리 바깥에 덧그리는 고리와 번짐
  rotate: string; // React Flow가 위치 지정에 쓰는 transform과 겹치지 않도록 rotate 속성으로 돌린다.
  opacity: string;
}

export interface WorkspaceLabConnectionPointStyleDefinition extends VisualSlotDefinition {
  tokens: WorkspaceLabConnectionPointTokens;
}

export interface WorkspaceLabNodeDensityDefinition extends VisualSlotDefinition {
  paddingX: number;
  paddingY: number;
  minWidth: number;
  contentMinHeight: number;
  labelFontSize: number;
  circleSize: number;
}

/*
연결 포인트는 크기, 윤곽선, 채움을 독립된 토큰으로 조합한다.
색은 컬러 테마 변수만 참조해 어떤 테마와 섞어도 바탕과 어긋나지 않는다.
*/
const accentMix = (percent: number) =>
  `color-mix(in srgb, var(--lab-accent) ${percent}%, transparent)`;

const defaultConnectionPointTokens = {
  width: "7px",
  height: "7px",
  radius: "50%",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--lab-edge)",
  fill: "var(--lab-surface)",
  shadow: "none",
  rotate: "0deg",
  opacity: "1",
} as const satisfies WorkspaceLabConnectionPointTokens;

export const workspaceLabConnectionPointStyles = [
  {
    id: "dot",
    name: "도트",
    description: "작은 점으로 연결 위치를 간결하게 표시합니다.",
    tokens: defaultConnectionPointTokens,
  },
  {
    id: "pin",
    name: "핀",
    description: "윤곽선 없이 연결선 색으로 채운 가장 작은 점입니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "5px",
      height: "5px",
      borderWidth: "0px",
      fill: "var(--lab-edge)",
    },
  },
  {
    id: "solid",
    name: "채운 원",
    description:
      "강조색으로 채우고 노드 표면색 테두리로 선과 노드에서 떼어 냅니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "10px",
      height: "10px",
      borderWidth: "2px",
      borderColor: "var(--lab-surface)",
      fill: "var(--lab-accent)",
    },
  },
  {
    id: "ring",
    name: "링",
    description: "비어 있는 원으로 연결 가능한 지점을 강조합니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "10px",
      height: "10px",
      borderWidth: "2px",
      borderColor: "var(--lab-accent)",
      fill: "var(--lab-canvas)",
    },
  },
  {
    id: "dashed",
    name: "점선 링",
    description: "점선 윤곽의 큰 원으로 도면 위 접점처럼 표시합니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "12px",
      height: "12px",
      borderWidth: "1.5px",
      borderStyle: "dashed",
      borderColor: "var(--lab-accent)",
      fill: "var(--lab-canvas)",
    },
  },
  {
    id: "target",
    name: "과녁",
    description: "채운 중심과 바깥 고리를 겹쳐 눈에 띄는 접점을 만듭니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "8px",
      height: "8px",
      borderWidth: "2px",
      borderColor: "var(--lab-canvas)",
      fill: "var(--lab-accent)",
      shadow: "0 0 0 1.5px var(--lab-accent)",
    },
  },
  {
    id: "halo",
    name: "후광",
    description: "채운 점 둘레에 옅은 강조색 번짐을 둡니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "8px",
      height: "8px",
      borderWidth: "0px",
      fill: "var(--lab-accent)",
      shadow: `0 0 0 4px ${accentMix(22)}`,
    },
  },
  {
    id: "square",
    name: "사각 포트",
    description: "도면이나 데이터 맵에 어울리는 각진 접점입니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "8px",
      height: "8px",
      radius: "1px",
      borderColor: "var(--lab-accent)",
    },
  },
  {
    id: "diamond",
    name: "마름모",
    description: "45도 돌린 채운 사각형으로 방향이 있는 접점처럼 보입니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "8px",
      height: "8px",
      radius: "1px",
      borderWidth: "1.5px",
      borderColor: "var(--lab-surface)",
      fill: "var(--lab-accent)",
      rotate: "45deg",
    },
  },
  {
    id: "tab",
    name: "탭",
    description: "노드 가장자리를 따라 눕힌 짧은 막대입니다.",
    tokens: {
      ...defaultConnectionPointTokens,
      width: "16px",
      height: "4px",
      radius: "2px",
      borderWidth: "0px",
      fill: "var(--lab-accent)",
    },
  },
  {
    id: "hidden",
    name: "숨김",
    description: "접점은 유지하되 화면에는 표시하지 않습니다.",
    tokens: { ...defaultConnectionPointTokens, opacity: "0" },
  },
] as const satisfies readonly WorkspaceLabConnectionPointStyleDefinition[];

export const workspaceLabCollapseControlStyles = [
  {
    id: "floating",
    name: "플로팅 원형",
    description: "노드 바깥 모서리에 작은 원형 버튼을 배치합니다.",
  },
  {
    id: "notch",
    name: "하단 노치",
    description: "노드 아래 중앙에 연결부처럼 붙는 버튼입니다.",
  },
  {
    id: "minimal",
    name: "인라인 미니멀",
    description: "노드 안쪽에 테두리 없는 아이콘만 표시합니다.",
  },
] as const satisfies readonly VisualSlotDefinition[];

export const workspaceLabCanvasStyles = [
  {
    id: "dots",
    name: "도트 그리드",
    description: "배치 기준을 제공하는 가벼운 점 패턴입니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Dots,
        gap: 20,
        size: 1,
        color: "color-mix(in srgb, var(--lab-edge) 32%, transparent)",
      },
    ],
  },
  {
    id: "fine-dots",
    name: "촘촘한 도트",
    description: "작은 점을 좁게 깔아 고밀도 트리에서도 결만 남깁니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Dots,
        gap: 12,
        size: 0.8,
        color: "color-mix(in srgb, var(--lab-edge) 24%, transparent)",
      },
    ],
  },
  {
    id: "bold-dots",
    name: "큰 도트",
    description: "넓은 간격의 굵은 점으로 확대해도 기준점이 또렷합니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Dots,
        gap: 32,
        size: 2.2,
        color: "color-mix(in srgb, var(--lab-edge) 36%, transparent)",
      },
    ],
  },
  {
    id: "grid",
    name: "라인 그리드",
    description: "구조 설계에 적합한 정방형 가이드입니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Lines,
        gap: 24,
        lineWidth: 1,
        color: "color-mix(in srgb, var(--lab-edge) 28%, transparent)",
      },
    ],
  },
  {
    /*
    Lines 패턴은 칸의 중앙에 선을 긋는다. 주선 간격을 보조선 간격의 홀수 배로 두어야
    두 레이어의 선이 같은 좌표에서 겹친다.
    */
    id: "graph",
    name: "모눈",
    description: "가는 보조선과 굵은 주선으로 거리와 정렬을 가늠합니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Lines,
        gap: 16,
        lineWidth: 0.5,
        color: "color-mix(in srgb, var(--lab-edge) 16%, transparent)",
      },
      {
        variant: BackgroundVariant.Lines,
        gap: 80,
        lineWidth: 1,
        color: "color-mix(in srgb, var(--lab-edge) 30%, transparent)",
      },
    ],
  },
  {
    id: "accent-grid",
    name: "액센트 그리드",
    description: "테마 강조색으로 옅게 그은 그리드입니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Lines,
        gap: 24,
        lineWidth: 1,
        color: "color-mix(in srgb, var(--lab-accent) 14%, transparent)",
      },
    ],
  },
  {
    id: "cross",
    name: "크로스 좌표",
    description: "넓은 공간에서도 위치를 짚기 쉬운 십자 패턴입니다.",
    backgrounds: [
      {
        variant: BackgroundVariant.Cross,
        gap: 28,
        size: 1.5,
        color: "color-mix(in srgb, var(--lab-edge) 28%, transparent)",
      },
    ],
  },
  {
    id: "paper",
    name: "페이퍼",
    description: "패턴을 줄이고 은은한 종이 결만 남긴 캔버스입니다.",
  },
  {
    id: "spotlight",
    name: "스포트라이트",
    description: "가운데를 밝히고 가장자리를 눌러 트리에 시선을 모읍니다.",
  },
  {
    id: "plain",
    name: "무지",
    description: "패턴과 질감 없이 테마 캔버스 색만 사용합니다.",
  },
] as const satisfies readonly WorkspaceLabCanvasStyleDefinition[];

export const workspaceLabNodeDensities = [
  {
    id: "compact",
    name: "Compact",
    description: "많은 노드를 한 화면에서 빠르게 훑는 밀도입니다.",
    paddingX: 11,
    paddingY: 8,
    minWidth: 132,
    contentMinHeight: 40,
    labelFontSize: 12,
    circleSize: 96,
  },
  {
    id: "comfortable",
    name: "Comfortable",
    description: "정보량과 여백의 균형을 맞춘 기본 밀도입니다.",
    paddingX: 16,
    paddingY: 13,
    minWidth: 148,
    contentMinHeight: 48,
    labelFontSize: 13,
    circleSize: 112,
  },
  {
    id: "spacious",
    name: "Spacious",
    description: "노드의 존재감과 읽기 편한 여백을 강조합니다.",
    paddingX: 22,
    paddingY: 18,
    minWidth: 168,
    contentMinHeight: 60,
    labelFontSize: 14,
    circleSize: 128,
  },
] as const satisfies readonly WorkspaceLabNodeDensityDefinition[];

export type WorkspaceLabConnectionPointStyleId =
  (typeof workspaceLabConnectionPointStyles)[number]["id"];
export type WorkspaceLabCollapseControlStyleId =
  (typeof workspaceLabCollapseControlStyles)[number]["id"];
export type WorkspaceLabCanvasStyleId =
  (typeof workspaceLabCanvasStyles)[number]["id"];
export type WorkspaceLabNodeDensityId =
  (typeof workspaceLabNodeDensities)[number]["id"];

function findVisualSlot<T extends VisualSlotDefinition>(
  definitions: readonly T[],
  id: string,
  fallbackIndex = 0,
): T {
  return (
    definitions.find((definition) => definition.id === id) ??
    definitions[fallbackIndex]
  );
}

export const getWorkspaceLabConnectionPointStyle = (
  id: WorkspaceLabConnectionPointStyleId,
): WorkspaceLabConnectionPointStyleDefinition =>
  findVisualSlot(workspaceLabConnectionPointStyles, id);

const connectionPointTokenCssVariables = {
  width: "--lab-handle-width",
  height: "--lab-handle-height",
  radius: "--lab-handle-radius",
  borderWidth: "--lab-handle-border-width",
  borderStyle: "--lab-handle-border-style",
  borderColor: "--lab-handle-border-color",
  fill: "--lab-handle-fill",
  shadow: "--lab-handle-shadow",
  rotate: "--lab-handle-rotate",
  opacity: "--lab-handle-opacity",
} as const satisfies Record<
  keyof WorkspaceLabConnectionPointTokens,
  `--lab-handle-${string}`
>;

type WorkspaceLabConnectionPointCssStyle = CSSProperties &
  Record<
    (typeof connectionPointTokenCssVariables)[keyof typeof connectionPointTokenCssVariables],
    string
  >;

/*
함수 이름 : getWorkspaceLabConnectionPointCssStyle
기능 : 연결 포인트 토큰을 노드 접점 CSS가 읽는 --lab-handle-* 변수로 변환한다.
인자 : WorkspaceLabConnectionPointStyleDefinition pointStyle -> 적용할 연결 포인트 스타일
반환값 : 캔버스 요소에 넣을 CSS 변수 객체
*/
export function getWorkspaceLabConnectionPointCssStyle(
  pointStyle: WorkspaceLabConnectionPointStyleDefinition,
): WorkspaceLabConnectionPointCssStyle {
  const style = {} as WorkspaceLabConnectionPointCssStyle;

  for (const tokenName of Object.keys(
    connectionPointTokenCssVariables,
  ) as Array<keyof WorkspaceLabConnectionPointTokens>) {
    style[connectionPointTokenCssVariables[tokenName]] =
      pointStyle.tokens[tokenName];
  }

  return style;
}

export const getWorkspaceLabCollapseControlStyle = (
  id: WorkspaceLabCollapseControlStyleId,
) => findVisualSlot(workspaceLabCollapseControlStyles, id);

export const getWorkspaceLabCanvasStyle = (
  id: WorkspaceLabCanvasStyleId,
): WorkspaceLabCanvasStyleDefinition =>
  findVisualSlot(workspaceLabCanvasStyles, id);

export const getWorkspaceLabNodeDensity = (
  id: WorkspaceLabNodeDensityId,
): WorkspaceLabNodeDensityDefinition =>
  findVisualSlot(workspaceLabNodeDensities, id, 1);

export type WorkspaceLabNodeDensityStyle = CSSProperties & {
  "--lab-node-padding-x": string;
  "--lab-node-padding-y": string;
  "--lab-node-min-width": string;
  "--lab-node-content-min-height": string;
  "--lab-node-label-font-size": string;
  "--lab-node-circle-size": string;
};

export const getWorkspaceLabNodeDensityStyle = (
  density: WorkspaceLabNodeDensityDefinition,
): WorkspaceLabNodeDensityStyle => ({
  "--lab-node-padding-x": `${density.paddingX}px`,
  "--lab-node-padding-y": `${density.paddingY}px`,
  "--lab-node-min-width": `${density.minWidth}px`,
  "--lab-node-content-min-height": `${density.contentMinHeight}px`,
  "--lab-node-label-font-size": `${density.labelFontSize}px`,
  "--lab-node-circle-size": `${density.circleSize}px`,
});

export const getWorkspaceLabNodeSize = (
  density: WorkspaceLabNodeDensityDefinition,
  shape: WorkspaceLabNodeShapeId,
) => {
  if (shape === "circle") {
    return { width: density.circleSize, height: density.circleSize };
  }

  return {
    width: density.minWidth,
    height: density.contentMinHeight + density.paddingY * 2 + 2,
  };
};
