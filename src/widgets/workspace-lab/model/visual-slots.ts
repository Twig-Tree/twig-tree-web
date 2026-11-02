import { BackgroundVariant } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { WorkspaceLabNodeShapeId } from "./node-shapes";

interface VisualSlotDefinition {
  id: string;
  name: string;
  description: string;
}

export interface WorkspaceLabCanvasStyleDefinition extends VisualSlotDefinition {
  background?: {
    variant: BackgroundVariant;
    gap: number;
    size: number;
    color: string;
  };
}

export interface WorkspaceLabNodeDensityDefinition extends VisualSlotDefinition {
  paddingX: number;
  paddingY: number;
  minWidth: number;
  contentMinHeight: number;
  labelFontSize: number;
  circleSize: number;
}

export const workspaceLabConnectionPointStyles = [
  {
    id: "dot",
    name: "도트",
    description: "작은 채움점으로 연결 위치를 간결하게 표시합니다.",
  },
  {
    id: "ring",
    name: "링",
    description: "비어 있는 원으로 연결 가능한 지점을 강조합니다.",
  },
  {
    id: "square",
    name: "사각 포트",
    description: "도면이나 데이터 맵에 어울리는 각진 접점입니다.",
  },
  {
    id: "hidden",
    name: "숨김",
    description: "접점은 유지하되 화면에는 표시하지 않습니다.",
  },
] as const satisfies readonly VisualSlotDefinition[];

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
    background: {
      variant: BackgroundVariant.Dots,
      gap: 20,
      size: 1,
      color: "color-mix(in srgb, var(--lab-edge) 30%, transparent)",
    },
  },
  {
    id: "grid",
    name: "라인 그리드",
    description: "구조 설계에 적합한 정방형 가이드입니다.",
    background: {
      variant: BackgroundVariant.Lines,
      gap: 24,
      size: 1,
      color: "color-mix(in srgb, var(--lab-edge) 18%, transparent)",
    },
  },
  {
    id: "cross",
    name: "크로스 좌표",
    description: "넓은 공간에서도 위치를 짚기 쉬운 십자 패턴입니다.",
    background: {
      variant: BackgroundVariant.Cross,
      gap: 28,
      size: 1.5,
      color: "color-mix(in srgb, var(--lab-edge) 24%, transparent)",
    },
  },
  {
    id: "paper",
    name: "페이퍼",
    description: "패턴을 줄이고 은은한 종이 결만 남긴 캔버스입니다.",
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
) => findVisualSlot(workspaceLabConnectionPointStyles, id);

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
