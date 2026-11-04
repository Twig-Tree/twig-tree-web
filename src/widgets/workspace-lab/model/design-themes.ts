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

/*
Inspector 구획마다 디자인 테마의 어느 값을 책임지는지 정한다.
구획 배지는 이 묶음 안에서만 테마와 비교하고, 초기화도 이 묶음만 되돌린다.
*/
const designThemeSectionKeys = {
  color: ["colorTheme", "colorRoles"],
  shape: ["shapeStyle"],
  canvas: ["canvasStyle"],
  node: ["nodeShape", "density", "collapseControlStyle"],
  connection: ["edgeStyle", "connectionPointStyle"],
  leftPanel: ["leftPanel"],
  memoPanel: ["memoPanel"],
} as const satisfies Record<
  string,
  ReadonlyArray<keyof WorkspaceLabDesignThemeValues>
>;

export type WorkspaceLabDesignThemeSection =
  keyof typeof designThemeSectionKeys;

type DesignThemeValueKey = keyof WorkspaceLabDesignThemeValues;

const designThemeSections = Object.keys(
  designThemeSectionKeys,
) as WorkspaceLabDesignThemeSection[];

/*
테마 값과 config 값은 패널만 이름과 모양이 다르다.
테마는 패널 표현만 갖고, config는 배치·너비까지 담은 패널 스타일을 갖는다.
*/
const getConfigValue = (
  config: WorkspaceLabConfig,
  key: DesignThemeValueKey,
) =>
  key === "leftPanel"
    ? config.leftPanelStyle
    : key === "memoPanel"
      ? config.memoPanelStyle
      : config[key];

const isSameValue = (themeValue: unknown, configValue: unknown) =>
  typeof themeValue === "object" && themeValue !== null
    ? Object.entries(themeValue).every(
        ([key, value]) =>
          (configValue as Record<string, unknown>)[key] === value,
      )
    : themeValue === configValue;

function getThemeValuesChange(
  config: WorkspaceLabConfig,
  id: WorkspaceLabDesignThemeId,
  keys: ReadonlyArray<DesignThemeValueKey>,
): Partial<WorkspaceLabConfig> {
  const values = getWorkspaceLabDesignTheme(id).values;
  const change: Partial<WorkspaceLabConfig> = {};

  for (const key of keys) {
    if (key === "leftPanel") {
      change.leftPanelStyle = { ...config.leftPanelStyle, ...values.leftPanel };
    } else if (key === "memoPanel") {
      change.memoPanelStyle = { ...config.memoPanelStyle, ...values.memoPanel };
    } else {
      Object.assign(change, { [key]: values[key] });
    }
  }

  return change;
}

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
  return {
    ...config,
    ...getThemeValuesChange(
      config,
      id,
      designThemeSections.flatMap((section) => designThemeSectionKeys[section]),
    ),
    designTheme: id,
  };
}

/*
함수 이름 : getWorkspaceLabDesignThemeSectionChange
기능 : 한 구획이 책임지는 값만 현재 디자인 테마의 값으로 되돌리는 변경을 만든다.
인자 : WorkspaceLabConfig config -> 현재 조합
WorkspaceLabDesignThemeSection section -> 되돌릴 구획
반환값 : reducer에 넘길 변경
*/
export const getWorkspaceLabDesignThemeSectionChange = (
  config: WorkspaceLabConfig,
  section: WorkspaceLabDesignThemeSection,
) =>
  getThemeValuesChange(
    config,
    config.designTheme,
    designThemeSectionKeys[section],
  );

/*
함수 이름 : isWorkspaceLabDesignThemeSectionModified
기능 : 한 구획이 책임지는 값이 현재 디자인 테마에서 벗어났는지 판단한다.
인자 : WorkspaceLabConfig config -> 현재 조합
WorkspaceLabDesignThemeSection section -> 비교할 구획
반환값 : 구획 값 중 하나라도 테마와 다르면 true
*/
export function isWorkspaceLabDesignThemeSectionModified(
  config: WorkspaceLabConfig,
  section: WorkspaceLabDesignThemeSection,
): boolean {
  const values = getWorkspaceLabDesignTheme(config.designTheme).values;

  return designThemeSectionKeys[section].some(
    (key) => !isSameValue(values[key], getConfigValue(config, key)),
  );
}

/*
함수 이름 : isWorkspaceLabDesignThemeModified
기능 : 현재 조합이 마지막으로 적용한 디자인 테마에서 벗어났는지 판단한다. 테마 밖의 항목은 비교하지 않는다.
인자 : WorkspaceLabConfig config -> 현재 조합
반환값 : 테마가 정하는 값 중 하나라도 다르면 true
*/
export const isWorkspaceLabDesignThemeModified = (config: WorkspaceLabConfig) =>
  designThemeSections.some((section) =>
    isWorkspaceLabDesignThemeSectionModified(config, section),
  );
