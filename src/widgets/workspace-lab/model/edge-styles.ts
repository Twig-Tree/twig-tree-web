interface EdgeSlotDefinition {
  id: string;
  name: string;
  description: string;
}

export const workspaceLabEdgeLineStyles = [
  {
    id: "layout",
    name: "레이아웃 기본",
    description: "전개 방향에 맞춰 직각 또는 곡선을 자동으로 선택합니다.",
  },
  {
    id: "straight",
    name: "직선",
    description: "두 연결점을 가장 짧은 직선으로 연결합니다.",
  },
  {
    id: "orthogonal",
    name: "직각",
    description: "모서리를 둥글리지 않고 직각으로 꺾습니다.",
  },
  {
    id: "rounded",
    name: "둥근 직각",
    description: "직각 경로의 모서리를 부드럽게 둥글립니다.",
  },
  {
    id: "curved",
    name: "곡선",
    description: "Bezier 곡선으로 노드 사이를 유연하게 연결합니다.",
  },
] as const satisfies readonly EdgeSlotDefinition[];

export const workspaceLabEdgePatterns = [
  {
    id: "solid",
    name: "실선",
    description: "끊김 없는 기본 연결선입니다.",
    dashArray: undefined,
    lineCap: "round",
  },
  {
    id: "dashed",
    name: "점선",
    description: "느슨하거나 보조적인 관계에 적합한 긴 점선입니다.",
    dashArray: "7 6",
    lineCap: "round",
  },
  {
    id: "dotted",
    name: "도트",
    description: "가벼운 관계를 표현하는 짧은 도트 패턴입니다.",
    dashArray: "1 6",
    lineCap: "round",
  },
] as const satisfies readonly (EdgeSlotDefinition & {
  dashArray: string | undefined;
  lineCap: "round" | "butt";
})[];

export const workspaceLabEdgeThicknesses = [
  {
    id: "hairline",
    name: "Hairline",
    description: "복잡한 구조에서도 가볍게 보이는 1px 선입니다.",
    width: 1,
  },
  {
    id: "regular",
    name: "Regular",
    description: "가독성과 밀도의 균형을 맞춘 기본 두께입니다.",
    width: 1.5,
  },
  {
    id: "strong",
    name: "Strong",
    description: "주요 흐름을 분명하게 드러내는 3px 선입니다.",
    width: 3,
  },
] as const satisfies readonly (EdgeSlotDefinition & { width: number })[];

export const workspaceLabEdgeColors = [
  {
    id: "theme",
    name: "Theme edge",
    description: "현재 테마가 정의한 기본 연결선 색상을 사용합니다.",
    value: "var(--lab-edge)",
  },
  {
    id: "accent",
    name: "Accent",
    description: "현재 테마의 주요 강조색을 사용합니다.",
    value: "var(--lab-accent)",
  },
  {
    id: "ink",
    name: "Ink",
    description: "본문색을 사용해 강한 구조 대비를 만듭니다.",
    value: "var(--lab-node-text)",
  },
  {
    id: "highlight",
    name: "Highlight",
    description: "검색이나 주목 관계에 어울리는 보조 강조색입니다.",
    value: "var(--lab-highlight)",
  },
] as const satisfies readonly (EdgeSlotDefinition & { value: string })[];

export const workspaceLabEdgeOpacities = [
  {
    id: "full",
    name: "100%",
    description: "색상을 그대로 표시합니다.",
    value: 1,
  },
  {
    id: "muted",
    name: "65%",
    description: "노드보다 한 단계 뒤로 물러난 관계를 표현합니다.",
    value: 0.65,
  },
  {
    id: "faint",
    name: "35%",
    description: "맥락만 남기는 매우 옅은 연결선입니다.",
    value: 0.35,
  },
] as const satisfies readonly (EdgeSlotDefinition & { value: number })[];

export const workspaceLabEdgeEffects = [
  {
    id: "none",
    name: "없음",
    description: "추가 효과 없이 선 자체만 표시합니다.",
  },
  {
    id: "shadow",
    name: "그림자",
    description: "부드러운 그림자로 캔버스에서 선을 띄웁니다.",
  },
  {
    id: "contrast",
    name: "대비선",
    description: "선 뒤에 캔버스색 외곽선을 깔아 교차 영역을 구분합니다.",
  },
  {
    id: "fade",
    name: "Fade",
    description: "source에서 target 방향으로 선이 점차 선명해집니다.",
  },
] as const satisfies readonly EdgeSlotDefinition[];

export type WorkspaceLabEdgeLineStyleId =
  (typeof workspaceLabEdgeLineStyles)[number]["id"];
export type WorkspaceLabEdgePatternId =
  (typeof workspaceLabEdgePatterns)[number]["id"];
export type WorkspaceLabEdgeThicknessId =
  (typeof workspaceLabEdgeThicknesses)[number]["id"];
export type WorkspaceLabEdgeColorId =
  (typeof workspaceLabEdgeColors)[number]["id"];
export type WorkspaceLabEdgeOpacityId =
  (typeof workspaceLabEdgeOpacities)[number]["id"];
export type WorkspaceLabEdgeEffectId =
  (typeof workspaceLabEdgeEffects)[number]["id"];

export type WorkspaceLabEdgeStyleSelection = {
  lineStyle: WorkspaceLabEdgeLineStyleId;
  pattern: WorkspaceLabEdgePatternId;
  thickness: WorkspaceLabEdgeThicknessId;
  color: WorkspaceLabEdgeColorId;
  opacity: WorkspaceLabEdgeOpacityId;
  effect: WorkspaceLabEdgeEffectId;
};

interface WorkspaceLabEdgeStylePresetDefinition extends EdgeSlotDefinition {
  values: WorkspaceLabEdgeStyleSelection;
}

export const workspaceLabEdgeStylePresets = [
  {
    id: "quiet-structure",
    name: "Quiet Structure",
    description: "현재 레이아웃을 따르는 차분하고 명료한 기본 조합입니다.",
    values: {
      lineStyle: "layout",
      pattern: "solid",
      thickness: "regular",
      color: "theme",
      opacity: "full",
      effect: "none",
    },
  },
  {
    id: "soft-guide",
    name: "Soft Guide",
    description: "옅은 곡선과 그림자로 관계를 부드럽게 안내합니다.",
    values: {
      lineStyle: "curved",
      pattern: "solid",
      thickness: "regular",
      color: "theme",
      opacity: "muted",
      effect: "shadow",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "직각 점선과 대비 외곽선으로 설계 도면처럼 표현합니다.",
    values: {
      lineStyle: "orthogonal",
      pattern: "dashed",
      thickness: "hairline",
      color: "accent",
      opacity: "muted",
      effect: "contrast",
    },
  },
  {
    id: "signal-flow",
    name: "Signal Flow",
    description: "굵은 강조선과 그림자로 주요 흐름을 선명하게 드러냅니다.",
    values: {
      lineStyle: "rounded",
      pattern: "solid",
      thickness: "strong",
      color: "accent",
      opacity: "full",
      effect: "shadow",
    },
  },
  {
    id: "fading-trace",
    name: "Fading Trace",
    description: "도트 곡선이 target으로 갈수록 선명해지는 탐색형 조합입니다.",
    values: {
      lineStyle: "curved",
      pattern: "dotted",
      thickness: "regular",
      color: "highlight",
      opacity: "muted",
      effect: "fade",
    },
  },
] as const satisfies readonly WorkspaceLabEdgeStylePresetDefinition[];

export type WorkspaceLabEdgeStylePresetId =
  (typeof workspaceLabEdgeStylePresets)[number]["id"];
export type WorkspaceLabEdgeStylePresetSelection =
  | WorkspaceLabEdgeStylePresetId
  | "custom";

function findEdgeSlot<T extends EdgeSlotDefinition>(
  definitions: readonly T[],
  id: string,
): T {
  return (
    definitions.find((definition) => definition.id === id) ?? definitions[0]
  );
}

export const getWorkspaceLabEdgeLineStyle = (id: WorkspaceLabEdgeLineStyleId) =>
  findEdgeSlot(workspaceLabEdgeLineStyles, id);

export const getWorkspaceLabEdgePattern = (id: WorkspaceLabEdgePatternId) =>
  findEdgeSlot(workspaceLabEdgePatterns, id);

export const getWorkspaceLabEdgeThickness = (id: WorkspaceLabEdgeThicknessId) =>
  findEdgeSlot(workspaceLabEdgeThicknesses, id);

export const getWorkspaceLabEdgeColor = (id: WorkspaceLabEdgeColorId) =>
  findEdgeSlot(workspaceLabEdgeColors, id);

export const getWorkspaceLabEdgeOpacity = (id: WorkspaceLabEdgeOpacityId) =>
  findEdgeSlot(workspaceLabEdgeOpacities, id);

export const getWorkspaceLabEdgeEffect = (id: WorkspaceLabEdgeEffectId) =>
  findEdgeSlot(workspaceLabEdgeEffects, id);

export const getWorkspaceLabEdgeStylePreset = (
  id: WorkspaceLabEdgeStylePresetId,
) => findEdgeSlot(workspaceLabEdgeStylePresets, id);

export function getMatchingWorkspaceLabEdgeStylePresetId(
  selection: WorkspaceLabEdgeStyleSelection,
): WorkspaceLabEdgeStylePresetSelection {
  return (
    workspaceLabEdgeStylePresets.find((preset) =>
      (
        Object.keys(preset.values) as Array<
          keyof WorkspaceLabEdgeStyleSelection
        >
      ).every((key) => preset.values[key] === selection[key]),
    )?.id ?? "custom"
  );
}
