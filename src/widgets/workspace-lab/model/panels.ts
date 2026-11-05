import type { CSSProperties } from "react";

interface PanelSlotDefinition {
  id: string;
  name: string;
  description: string;
}

export type WorkspaceLabPanelKind = "sidebar" | "memo";

export interface WorkspaceLabPanelWidthDefinition extends PanelSlotDefinition {
  sidebar: number; // 왼쪽 패널 너비(px)
  memo: number; // 메모 패널 너비(px)
}

export interface WorkspaceLabPanelDensityDefinition extends PanelSlotDefinition {
  padding: number; // 패널 구획의 안쪽 여백(px)
  itemPaddingY: number; // 목록 항목의 세로 여백(px)
  fontSize: number; // 본문 글자 크기(px)
}

export const workspaceLabPanelPlacements = [
  {
    id: "docked",
    name: "고정",
    description: "캔버스 옆에 붙어 화면 폭을 나눠 씁니다.",
  },
  {
    id: "floating",
    name: "플로팅",
    description: "캔버스 위에 뜬 카드로 캔버스 폭을 그대로 둡니다.",
  },
] as const satisfies readonly PanelSlotDefinition[];

/*
두 패널은 담는 정보가 달라 같은 단계에서도 너비가 다르다.
단계 이름을 공유해 두 패널을 같은 감각으로 비교하되, 실제 값은 패널마다 둔다.
*/
export const workspaceLabPanelWidths = [
  {
    id: "narrow",
    name: "좁게",
    description: "캔버스 공간을 우선합니다.",
    sidebar: 176,
    memo: 224,
  },
  {
    id: "regular",
    name: "기본",
    description: "탐색과 읽기의 균형을 맞춘 너비입니다.",
    sidebar: 208,
    memo: 256,
  },
  {
    id: "wide",
    name: "넓게",
    description: "긴 이름과 메모를 줄바꿈 없이 읽습니다.",
    sidebar: 248,
    memo: 320,
  },
] as const satisfies readonly WorkspaceLabPanelWidthDefinition[];

export const workspaceLabPanelSurfaces = [
  {
    id: "panel",
    name: "패널",
    description: "테마의 패널 표면색을 사용합니다.",
  },
  {
    id: "canvas",
    name: "캔버스 톤",
    description: "캔버스와 같은 색으로 패널을 배경에 녹입니다.",
  },
  {
    id: "muted",
    name: "뮤트",
    description: "한 단계 가라앉은 표면으로 캔버스와 위계를 나눕니다.",
  },
  {
    id: "glass",
    name: "글래스",
    description: "반투명 표면과 흐림으로 뒤의 캔버스를 비춥니다.",
  },
] as const satisfies readonly PanelSlotDefinition[];

export const workspaceLabPanelBorders = [
  {
    id: "line",
    name: "구분선",
    description: "얇은 선으로 캔버스와 경계를 나눕니다.",
  },
  {
    id: "shadow",
    name: "그림자",
    description: "선 없이 그림자로 패널을 띄웁니다.",
  },
  {
    id: "none",
    name: "없음",
    description: "선과 그림자 없이 표면색 차이만 남깁니다.",
  },
] as const satisfies readonly PanelSlotDefinition[];

export const workspaceLabPanelDensities = [
  {
    id: "compact",
    name: "Compact",
    description: "여백을 줄여 더 많은 항목을 보여줍니다.",
    padding: 8,
    itemPaddingY: 4,
    fontSize: 11,
  },
  {
    id: "comfortable",
    name: "Comfortable",
    description: "현재 Workspace와 같은 기본 여백입니다.",
    padding: 12,
    itemPaddingY: 6,
    fontSize: 12,
  },
  {
    id: "spacious",
    name: "Spacious",
    description: "넉넉한 여백과 큰 글자로 읽기 편하게 합니다.",
    padding: 18,
    itemPaddingY: 9,
    fontSize: 13,
  },
] as const satisfies readonly WorkspaceLabPanelDensityDefinition[];

export type WorkspaceLabPanelPlacementId =
  (typeof workspaceLabPanelPlacements)[number]["id"];
export type WorkspaceLabPanelWidthId =
  (typeof workspaceLabPanelWidths)[number]["id"];
export type WorkspaceLabPanelSurfaceId =
  (typeof workspaceLabPanelSurfaces)[number]["id"];
export type WorkspaceLabPanelBorderId =
  (typeof workspaceLabPanelBorders)[number]["id"];
export type WorkspaceLabPanelDensityId =
  (typeof workspaceLabPanelDensities)[number]["id"];

export type WorkspaceLabPanelStyleSelection = {
  placement: WorkspaceLabPanelPlacementId;
  width: WorkspaceLabPanelWidthId;
  surface: WorkspaceLabPanelSurfaceId;
  border: WorkspaceLabPanelBorderId;
  density: WorkspaceLabPanelDensityId;
};

/*
현재 Workspace 화면과 같은 조합이다. 왼쪽 패널과 메모 패널은 이 값에서 각자 출발한다.
*/
export const workspaceLabDefaultPanelStyle = {
  placement: "docked",
  width: "regular",
  surface: "panel",
  border: "line",
  density: "comfortable",
} as const satisfies WorkspaceLabPanelStyleSelection;

function findPanelSlot<T extends PanelSlotDefinition>(
  definitions: readonly T[],
  id: string,
  fallbackIndex = 0,
): T {
  return (
    definitions.find((definition) => definition.id === id) ??
    definitions[fallbackIndex]
  );
}

export const getWorkspaceLabPanelPlacement = (
  id: WorkspaceLabPanelPlacementId,
) => findPanelSlot(workspaceLabPanelPlacements, id);

export const getWorkspaceLabPanelWidth = (
  id: WorkspaceLabPanelWidthId,
): WorkspaceLabPanelWidthDefinition =>
  findPanelSlot(workspaceLabPanelWidths, id, 1);

export const getWorkspaceLabPanelSurface = (id: WorkspaceLabPanelSurfaceId) =>
  findPanelSlot(workspaceLabPanelSurfaces, id);

export const getWorkspaceLabPanelBorder = (id: WorkspaceLabPanelBorderId) =>
  findPanelSlot(workspaceLabPanelBorders, id);

export const getWorkspaceLabPanelDensity = (
  id: WorkspaceLabPanelDensityId,
): WorkspaceLabPanelDensityDefinition =>
  findPanelSlot(workspaceLabPanelDensities, id, 1);

export type WorkspaceLabPanelStyle = CSSProperties & {
  "--lab-panel-padding": string;
  "--lab-panel-item-padding-y": string;
  "--lab-panel-font-size": string;
};

export const getWorkspaceLabPanelStyle = (
  kind: WorkspaceLabPanelKind,
  selection: WorkspaceLabPanelStyleSelection,
): WorkspaceLabPanelStyle => {
  const density = getWorkspaceLabPanelDensity(selection.density);

  return {
    width: getWorkspaceLabPanelWidth(selection.width)[kind],
    "--lab-panel-padding": `${density.padding}px`,
    "--lab-panel-item-padding-y": `${density.itemPaddingY}px`,
    "--lab-panel-font-size": `${density.fontSize}px`,
  };
};
