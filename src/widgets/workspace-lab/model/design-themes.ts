import { workspaceLabDefaultColorRoles } from "./color-roles";
import type { WorkspaceLabConfig } from "./config";
import { getWorkspaceLabEdgeStylePreset } from "./edge-styles";
import type { WorkspaceLabPanelStyleSelection } from "./panels";

/*
패널 표현은 표면·경계·밀도만 테마에 묶는다.
배치와 너비는 화면 구성의 결정이라 테마를 바꿔도 사용자가 고른 값을 유지한다.
*/
export type WorkspaceLabPanelExpression = Pick<
  WorkspaceLabPanelStyleSelection,
  "surface" | "border" | "density"
>;

/*
디자인 테마가 한 번에 정하는 스타일 묶음이다.
구조 탭의 항목, 뷰포트, 표시 여부, 패널 배치·너비는 테마와 무관하게 남는다.
*/
export type WorkspaceLabDesignThemeValues = Pick<
  WorkspaceLabConfig,
  | "colorTheme"
  | "colorRoles"
  | "shapeStyle"
  | "canvasStyle"
  | "nodeShape"
  | "density"
  | "collapseControlStyle"
  | "connectionPointStyle"
  | "edgeStyle"
> & {
  leftPanel: WorkspaceLabPanelExpression;
  memoPanel: WorkspaceLabPanelExpression;
};

interface WorkspaceLabDesignThemeDefinition {
  id: string;
  name: string;
  description: string;
  values: WorkspaceLabDesignThemeValues;
}

const linedPanel = {
  surface: "panel",
  border: "line",
  density: "comfortable",
} as const satisfies WorkspaceLabPanelExpression;

/*
새 디자인 테마는 이 배열에 추가한다. 슬롯 값은 각 registry의 id를 그대로 쓴다.
첫 항목은 workspaceLabDefaultConfig와 같은 조합이어야 한다.
*/
export const workspaceLabDesignThemes = [
  {
    id: "quiet",
    name: "Quiet Focus",
    description:
      "저채도 캔버스와 겹그림자로 콘텐츠에 집중하는 현재 Workspace의 기본 조합입니다.",
    values: {
      colorTheme: "quiet",
      colorRoles: workspaceLabDefaultColorRoles,
      shapeStyle: "layered",
      canvasStyle: "dots",
      nodeShape: "rounded",
      density: "comfortable",
      collapseControlStyle: "floating",
      connectionPointStyle: "dot",
      edgeStyle: getWorkspaceLabEdgeStylePreset("quiet-structure").values,
      leftPanel: linedPanel,
      memoPanel: linedPanel,
    },
  },
  {
    id: "neutral",
    name: "Neutral",
    description:
      "중립 회색과 표준 곡률로 제품 UI에 바로 옮기기 쉬운 조합입니다.",
    values: {
      colorTheme: "neutral",
      colorRoles: workspaceLabDefaultColorRoles,
      shapeStyle: "standard",
      canvasStyle: "fine-dots",
      nodeShape: "rounded",
      density: "comfortable",
      collapseControlStyle: "floating",
      connectionPointStyle: "dot",
      edgeStyle: getWorkspaceLabEdgeStylePreset("quiet-structure").values,
      leftPanel: linedPanel,
      memoPanel: linedPanel,
    },
  },
  {
    id: "soft",
    name: "Soft",
    description:
      "보랏빛 표면, 큰 곡률, 옅은 곡선 연결로 친근하게 풀어낸 조합입니다.",
    values: {
      colorTheme: "soft",
      colorRoles: workspaceLabDefaultColorRoles,
      shapeStyle: "diffuse",
      canvasStyle: "paper",
      nodeShape: "rounded",
      density: "spacious",
      collapseControlStyle: "notch",
      connectionPointStyle: "ring",
      edgeStyle: getWorkspaceLabEdgeStylePreset("soft-guide").values,
      leftPanel: { surface: "muted", border: "shadow", density: "spacious" },
      memoPanel: { surface: "muted", border: "shadow", density: "spacious" },
    },
  },
  {
    id: "contrast",
    name: "High contrast",
    description:
      "진한 외곽선, 하드 섀도, 굵은 직각 연결로 정보 경계를 뚜렷하게 나눈 조합입니다.",
    values: {
      colorTheme: "contrast",
      colorRoles: workspaceLabDefaultColorRoles,
      shapeStyle: "hard",
      canvasStyle: "grid",
      nodeShape: "square",
      density: "comfortable",
      collapseControlStyle: "minimal",
      connectionPointStyle: "square",
      edgeStyle: {
        lineStyle: "orthogonal",
        pattern: "solid",
        thickness: "strong",
        color: "ink",
        opacity: "full",
        effect: "none",
      },
      leftPanel: { surface: "panel", border: "line", density: "compact" },
      memoPanel: { surface: "panel", border: "line", density: "compact" },
    },
  },
] as const satisfies readonly WorkspaceLabDesignThemeDefinition[];

export type WorkspaceLabDesignThemeId =
  (typeof workspaceLabDesignThemes)[number]["id"];

export const getWorkspaceLabDesignTheme = (
  id: WorkspaceLabDesignThemeId,
): WorkspaceLabDesignThemeDefinition =>
  workspaceLabDesignThemes.find((theme) => theme.id === id) ??
  workspaceLabDesignThemes[0];

const hasSameValues = <T extends object>(a: T, b: T) =>
  (Object.keys(a) as Array<keyof T>).every((key) => a[key] === b[key]);

/*
함수 이름 : applyWorkspaceLabDesignTheme
기능 : 디자인 테마가 정하는 스타일 묶음을 현재 조합에 덮어쓴다. 패널은 표현만 바꾸고 배치·너비는 유지한다.
인자 : WorkspaceLabConfig config -> 현재 조합
WorkspaceLabDesignThemeId id -> 적용할 디자인 테마
반환값 : 디자인 테마를 적용한 조합
*/
export function applyWorkspaceLabDesignTheme(
  config: WorkspaceLabConfig,
  id: WorkspaceLabDesignThemeId,
): WorkspaceLabConfig {
  const { leftPanel, memoPanel, ...values } =
    getWorkspaceLabDesignTheme(id).values;

  return {
    ...config,
    ...values,
    designTheme: id,
    leftPanelStyle: { ...config.leftPanelStyle, ...leftPanel },
    memoPanelStyle: { ...config.memoPanelStyle, ...memoPanel },
  };
}

/*
함수 이름 : isWorkspaceLabDesignThemeModified
기능 : 현재 조합이 마지막으로 적용한 디자인 테마에서 벗어났는지 판단한다. 테마 밖의 항목은 비교하지 않는다.
인자 : WorkspaceLabConfig config -> 현재 조합
반환값 : 테마가 정하는 값 중 하나라도 다르면 true
*/
export function isWorkspaceLabDesignThemeModified(
  config: WorkspaceLabConfig,
): boolean {
  const { leftPanel, memoPanel, colorRoles, edgeStyle, ...values } =
    getWorkspaceLabDesignTheme(config.designTheme).values;

  return !(
    hasSameValues(values, config) &&
    hasSameValues(colorRoles, config.colorRoles) &&
    hasSameValues(edgeStyle, config.edgeStyle) &&
    hasSameValues(leftPanel, config.leftPanelStyle) &&
    hasSameValues(memoPanel, config.memoPanelStyle)
  );
}
