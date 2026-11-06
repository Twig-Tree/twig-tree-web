import { workspaceLabDefaultColorRoles } from "./color-roles";
import { applyWorkspaceLabDesignTheme } from "./design-themes";
import { workspaceLabEdgeStylePresets } from "./edge-styles";
import { workspaceLabDefaultPanelStyle } from "./panels";
import type {
  LabCanvasStyle,
  LabCollapseControlStyle,
  LabColorRoles,
  LabConnectionPointStyle,
  LabDensity,
  LabDesignTheme,
  LabEdgeState,
  LabEdgeStyle,
  LabLayoutMode,
  LabLayoutSpacing,
  LabNodeShape,
  LabNodeState,
  LabPanelStyle,
  LabColorTheme,
  LabShapeStyle,
  LabViewport,
  WorkspaceLabScenario,
} from "./types";

/*
Inspector가 바꾸고 Preview가 그리는 실험 조합 전체다.
옵션을 추가할 때는 이 타입과 기본값만 늘리면 Inspector와 Preview에 함께 전달된다.
*/
export type WorkspaceLabConfig = {
  scenarioId: WorkspaceLabScenario["id"];
  layoutMode: LabLayoutMode;
  layoutSpacing: LabLayoutSpacing;
  nodeState: LabNodeState; // 첫 노드에 입힐 상태
  edgeState: LabEdgeState; // 첫 연결선에 입힐 상태
  designTheme: LabDesignTheme; // 마지막으로 적용한 디자인 테마. 수정 여부를 가르는 기준이다
  colorTheme: LabColorTheme;
  colorRoles: LabColorRoles;
  shapeStyle: LabShapeStyle; // 곡률과 그림자
  canvasStyle: LabCanvasStyle;
  viewport: LabViewport;
  nodeShape: LabNodeShape;
  density: LabDensity;
  collapseControlStyle: LabCollapseControlStyle;
  edgeStyle: LabEdgeStyle;
  connectionPointStyle: LabConnectionPointStyle;
  showToolbar: boolean;
  showPlayer: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean; // 메모 패널 표시 여부
  leftPanelStyle: LabPanelStyle;
  memoPanelStyle: LabPanelStyle;
};

export type WorkspaceLabConfigChange = Partial<WorkspaceLabConfig>;

export const workspaceLabDefaultConfig: WorkspaceLabConfig = {
  scenarioId: "balanced",
  layoutMode: "vertical",
  layoutSpacing: "balanced",
  nodeState: "selected",
  edgeState: "default",
  designTheme: "quiet",
  colorTheme: "quiet",
  colorRoles: workspaceLabDefaultColorRoles,
  shapeStyle: "layered",
  canvasStyle: "dots",
  viewport: "desktop",
  nodeShape: "rounded",
  density: "comfortable",
  collapseControlStyle: "floating",
  edgeStyle: workspaceLabEdgeStylePresets[0].values,
  connectionPointStyle: "dot",
  showToolbar: true,
  showPlayer: false,
  showLeftPanel: true,
  showRightPanel: false,
  leftPanelStyle: workspaceLabDefaultPanelStyle,
  memoPanelStyle: workspaceLabDefaultPanelStyle,
};

/*
함수 이름 : workspaceLabConfigReducer
기능 : 바뀐 필드를 현재 조합에 합친다. 디자인 테마를 넘기면 그 테마의 스타일 묶음을 먼저 적용한다. 컬러 테마가 바뀌고 색 역할을 함께 넘기지 않았으면 색 역할을 테마 기본으로 되돌린다.
인자 : WorkspaceLabConfig config -> 현재 조합
WorkspaceLabConfigChange change -> 바꿀 필드
반환값 : 다음 조합
*/
export function workspaceLabConfigReducer(
  config: WorkspaceLabConfig,
  change: WorkspaceLabConfigChange,
): WorkspaceLabConfig {
  /*
  디자인 테마는 같은 테마를 다시 골라도 적용한다. 수정한 값을 테마 값으로 되돌리는 초기화로 쓴다.
  */
  if (change.designTheme !== undefined) {
    return {
      ...applyWorkspaceLabDesignTheme(config, change.designTheme),
      ...change,
    };
  }

  const next = { ...config, ...change };

  /*
  컬러 테마는 색 역할의 출발점이다. 컬러 테마를 바꾸면 이전 테마 위에 덧씌운 역할 선택을 버린다.
  */
  if (
    change.colorTheme !== undefined &&
    change.colorTheme !== config.colorTheme &&
    change.colorRoles === undefined
  ) {
    next.colorRoles = workspaceLabDefaultColorRoles;
  }

  return next;
}

/*
함수 이름 : isWorkspaceLabDefaultConfig
기능 : 현재 조합이 Lab 기본 조합과 같은지 판단한다. 색 역할·연결선·패널처럼 묶인 값은 한 단계 안까지 비교한다.
인자 : WorkspaceLabConfig config -> 현재 조합
반환값 : 모든 값이 기본 조합과 같으면 true
*/
export const isWorkspaceLabDefaultConfig = (config: WorkspaceLabConfig) =>
  (
    Object.keys(workspaceLabDefaultConfig) as Array<keyof WorkspaceLabConfig>
  ).every((key) => {
    const defaultValue = workspaceLabDefaultConfig[key];
    const value = config[key];

    return typeof defaultValue === "object"
      ? Object.entries(defaultValue).every(
          ([field, fieldValue]) =>
            (value as Record<string, unknown>)[field] === fieldValue,
        )
      : defaultValue === value;
  });
