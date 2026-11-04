import type { WorkspaceLabColorThemeTokens } from "./color-themes";

type ColorRoleOverride = Partial<WorkspaceLabColorThemeTokens>;

interface ColorRoleOptionDefinition {
  id: string;
  name: string;
  description: string;
  swatches?: readonly string[]; // Inspector 견본에 쓸 대표 색
  /*
  앞선 역할까지 덧씌운 토큰을 받아 이 선택이 바꿀 토큰만 돌려준다.
  앞선 역할의 결과를 받아야 루트나 크롬이 새 강조색·중립 톤을 따라간다.
  */
  apply: (tokens: WorkspaceLabColorThemeTokens) => ColorRoleOverride;
}

const mix = (color: string, percent: number, base: string) =>
  `color-mix(in srgb, ${color} ${percent}%, ${base})`;

const themeDefault = {
  id: "theme",
  name: "테마 기본",
  description: "선택한 테마의 값을 그대로 사용합니다.",
  apply: () => ({}),
} as const satisfies ColorRoleOptionDefinition;

type NeutralScale = {
  preview: string; // Lab 바깥 배경
  canvas: string;
  surface: string;
  muted: string; // 한 단계 가라앉은 표면
  border: string;
  edge: string;
  text: string;
  mutedText: string;
  softText: string; // 목록·태그처럼 본문보다 약한 글자
};

const createNeutralOption = (
  id: string,
  name: string,
  description: string,
  scale: NeutralScale,
) =>
  ({
    id,
    name,
    description,
    swatches: [scale.canvas, scale.surface, scale.text],
    apply: () => ({
      previewBackground: scale.preview,
      canvas: scale.canvas,
      surface: scale.surface,
      surfaceMuted: scale.muted,
      panelSurface: scale.surface,
      headerSurface: scale.surface,
      border: scale.border,
      panelBorder: scale.border,
      text: scale.text,
      mutedText: scale.mutedText,
      edge: scale.edge,
      searchSurface: scale.muted,
      outlineText: scale.softText,
      outlineHoverSurface: scale.muted,
      outlineHoverText: scale.text,
      tagSurface: scale.muted,
      tagBorder: scale.border,
      tagText: scale.softText,
      shareSurface: scale.surface,
      shareBorder: scale.border,
      shareText: scale.softText,
      playerSurface: mix(scale.surface, 95, "transparent"),
      playerBorder: scale.border,
    }),
  }) satisfies ColorRoleOptionDefinition;

export const workspaceLabNeutralTones = [
  themeDefault,
  createNeutralOption("slate", "Slate", "푸른 기가 도는 중립 회색입니다.", {
    preview: "#e9edf2",
    canvas: "#f7f8fa",
    surface: "#ffffff",
    muted: "#f1f5f9",
    border: "#e2e8f0",
    edge: "#a6afbe",
    text: "#172033",
    mutedText: "#778195",
    softText: "#475569",
  }),
  createNeutralOption("sage", "Sage", "초록 기가 도는 저채도 톤입니다.", {
    preview: "#dfe5de",
    canvas: "#f2f5f0",
    surface: "#fffefa",
    muted: "#f0f3ee",
    border: "#dfe5dd",
    edge: "#9caaa2",
    text: "#203029",
    mutedText: "#78877f",
    softText: "#58675f",
  }),
  createNeutralOption("stone", "Stone", "따뜻한 종이 같은 회갈색 톤입니다.", {
    preview: "#e7e5e4",
    canvas: "#f7f6f4",
    surface: "#fffdfa",
    muted: "#f2f0ed",
    border: "#e2ded9",
    edge: "#aaa39b",
    text: "#292524",
    mutedText: "#857d76",
    softText: "#57534e",
  }),
  createNeutralOption(
    "lavender",
    "Lavender",
    "보랏빛이 살짝 도는 부드러운 톤입니다.",
    {
      preview: "#ebe7f5",
      canvas: "#f7f5ff",
      surface: "#fffafd",
      muted: "#f4effb",
      border: "#e7dff0",
      edge: "#b9a9c6",
      text: "#31233d",
      mutedText: "#8a7895",
      softText: "#6e587a",
    },
  ),
  createNeutralOption("pure", "Pure", "색조 없는 순수 무채색입니다.", {
    preview: "#ececec",
    canvas: "#fafafa",
    surface: "#ffffff",
    muted: "#f5f5f5",
    border: "#e5e5e5",
    edge: "#a3a3a3",
    text: "#0a0a0a",
    mutedText: "#737373",
    softText: "#525252",
  }),
] as const satisfies readonly ColorRoleOptionDefinition[];

/*
테마마다 강조색을 쓰는 토큰이 다르다. 예를 들어 Quiet는 루트 접기 버튼도 강조색이다.
그래서 고정 목록 대신 이전 강조색과 같은 값을 쓰던 토큰을 모두 새 강조색으로 바꾼다.
*/
const createAccentOption = (id: string, name: string, color: string) =>
  ({
    id,
    name,
    description: `${name} 계열 강조색입니다.`,
    swatches: [color],
    apply: (tokens: WorkspaceLabColorThemeTokens) => {
      const override: ColorRoleOverride = {};

      for (const key of Object.keys(tokens) as Array<
        keyof WorkspaceLabColorThemeTokens
      >) {
        if (tokens[key] === tokens.accent) override[key] = color;
      }

      return {
        ...override,
        accent: color,
        selectedRing: mix(color, 18, "transparent"),
      };
    },
  }) satisfies ColorRoleOptionDefinition;

export const workspaceLabAccentColors = [
  themeDefault,
  createAccentOption("indigo", "Indigo", "#4f46e5"),
  createAccentOption("violet", "Violet", "#8b5cf6"),
  createAccentOption("blue", "Blue", "#2563eb"),
  createAccentOption("teal", "Teal", "#0d9488"),
  createAccentOption("rose", "Rose", "#e11d48"),
  createAccentOption("amber", "Amber", "#d97706"),
] as const satisfies readonly ColorRoleOptionDefinition[];

export const workspaceLabRootColors = [
  themeDefault,
  {
    id: "ink",
    name: "어두운 잉크",
    description: "본문 글자색으로 루트를 채워 계층의 시작을 무겁게 둡니다.",
    apply: (tokens) => ({
      rootSurface: tokens.text,
      rootBorder: tokens.text,
      rootText: tokens.surface,
      rootMutedText: mix(tokens.surface, 65, tokens.text),
      rootControlSurface: tokens.accent,
      rootControlText: "#ffffff",
    }),
  },
  {
    id: "surface",
    name: "밝은 표면",
    description: "다른 노드와 같은 표면에 강조색 테두리만 더합니다.",
    apply: (tokens) => ({
      rootSurface: tokens.surface,
      rootBorder: mix(tokens.accent, 45, tokens.border),
      rootText: tokens.text,
      rootMutedText: tokens.mutedText,
      rootControlSurface: tokens.surface,
      rootControlText: tokens.mutedText,
    }),
  },
  {
    id: "accent",
    name: "강조색 채움",
    description: "강조색으로 루트를 채워 시작점을 가장 먼저 보이게 합니다.",
    apply: (tokens) => ({
      rootSurface: tokens.accent,
      rootBorder: tokens.accent,
      rootText: "#ffffff",
      rootMutedText: mix("#ffffff", 72, tokens.accent),
      rootControlSurface: tokens.surface,
      rootControlText: tokens.accent,
    }),
  },
] as const satisfies readonly ColorRoleOptionDefinition[];

export const workspaceLabStatusColors = [
  themeDefault,
  {
    id: "vivid",
    name: "선명",
    description: "검색·강의·오류 상태를 채도 높은 색으로 바로 구분합니다.",
    swatches: ["#f59e0b", "#06b6d4", "#ef4444"],
    apply: () => ({
      highlight: "#f59e0b",
      lecture: "#06b6d4",
      danger: "#ef4444",
      savedSurface: "#dcfce7",
      savedText: "#15803d",
    }),
  },
  {
    id: "calm",
    name: "차분",
    description: "채도를 낮춰 상태 색이 콘텐츠보다 앞서지 않게 합니다.",
    swatches: ["#c99a4a", "#4f9a95", "#b85c5c"],
    apply: () => ({
      highlight: "#c99a4a",
      lecture: "#4f9a95",
      danger: "#b85c5c",
      savedSurface: "#eef3ec",
      savedText: "#5b7a62",
    }),
  },
] as const satisfies readonly ColorRoleOptionDefinition[];

/*
플레이어는 내부 글자색이 Tailwind로 고정되어 있어 어두운 표면에서 읽히지 않는다.
크롬 역할은 툴바와 아바타만 다룬다.
*/
export const workspaceLabChromeColors = [
  themeDefault,
  {
    id: "light",
    name: "밝게",
    description: "툴바를 표면색으로 띄워 캔버스와 같은 무게로 둡니다.",
    apply: (tokens) => ({
      toolbarSurface: mix(tokens.surface, 95, "transparent"),
      toolbarBorder: tokens.border,
      toolbarText: tokens.mutedText,
      toolbarHoverSurface: tokens.surfaceMuted,
      toolbarHoverText: tokens.accent,
      avatarSurface: tokens.text,
      avatarText: tokens.surface,
    }),
  },
  {
    id: "dark",
    name: "어둡게",
    description: "툴바를 글자색으로 채워 캔버스 위에서 또렷하게 구분합니다.",
    apply: (tokens) => ({
      toolbarSurface: mix(tokens.text, 94, "transparent"),
      toolbarBorder: "rgb(255 255 255 / 12%)",
      toolbarText: mix(tokens.surface, 75, tokens.text),
      toolbarHoverSurface: "rgb(255 255 255 / 10%)",
      toolbarHoverText: "#ffffff",
      avatarSurface: tokens.text,
      avatarText: tokens.surface,
    }),
  },
  {
    id: "accent",
    name: "강조색",
    description: "툴바와 아바타를 강조색으로 채워 조작 영역을 드러냅니다.",
    apply: (tokens) => ({
      toolbarSurface: tokens.accent,
      toolbarBorder: "transparent",
      toolbarText: mix("#ffffff", 80, tokens.accent),
      toolbarHoverSurface: "rgb(255 255 255 / 14%)",
      toolbarHoverText: "#ffffff",
      avatarSurface: tokens.accent,
      avatarText: "#ffffff",
    }),
  },
] as const satisfies readonly ColorRoleOptionDefinition[];

/*
대비는 색을 새로 고르지 않고 앞선 역할이 정한 선과 보조 글자를 표면 쪽이나 글자 쪽으로 민다.
마지막에 적용해야 중립 톤을 바꿔도 같은 비율로 따라간다.
*/
export const workspaceLabColorContrasts = [
  themeDefault,
  {
    id: "low",
    name: "낮음",
    description: "선과 보조 글자를 표면 쪽으로 옅게 만듭니다.",
    apply: (tokens) => ({
      border: mix(tokens.border, 60, tokens.surface),
      panelBorder: mix(tokens.panelBorder, 60, tokens.surface),
      edge: mix(tokens.edge, 65, tokens.canvas),
      mutedText: mix(tokens.mutedText, 80, tokens.surface),
    }),
  },
  {
    id: "high",
    name: "높음",
    description: "선과 보조 글자를 글자색 쪽으로 진하게 만듭니다.",
    apply: (tokens) => ({
      border: mix(tokens.border, 45, tokens.text),
      panelBorder: mix(tokens.panelBorder, 45, tokens.text),
      edge: mix(tokens.edge, 55, tokens.text),
      mutedText: mix(tokens.mutedText, 60, tokens.text),
    }),
  },
] as const satisfies readonly ColorRoleOptionDefinition[];

export type WorkspaceLabNeutralToneId =
  (typeof workspaceLabNeutralTones)[number]["id"];
export type WorkspaceLabAccentColorId =
  (typeof workspaceLabAccentColors)[number]["id"];
export type WorkspaceLabRootColorId =
  (typeof workspaceLabRootColors)[number]["id"];
export type WorkspaceLabStatusColorId =
  (typeof workspaceLabStatusColors)[number]["id"];
export type WorkspaceLabChromeColorId =
  (typeof workspaceLabChromeColors)[number]["id"];
export type WorkspaceLabColorContrastId =
  (typeof workspaceLabColorContrasts)[number]["id"];

export type WorkspaceLabColorRoleSelection = {
  neutral: WorkspaceLabNeutralToneId;
  accent: WorkspaceLabAccentColorId;
  root: WorkspaceLabRootColorId;
  status: WorkspaceLabStatusColorId;
  chrome: WorkspaceLabChromeColorId;
  contrast: WorkspaceLabColorContrastId;
};

export const workspaceLabDefaultColorRoles = {
  neutral: "theme",
  accent: "theme",
  root: "theme",
  status: "theme",
  chrome: "theme",
  contrast: "theme",
} as const satisfies WorkspaceLabColorRoleSelection;

/*
덧씌우는 순서다. 뒤의 역할은 앞의 결과를 읽으므로 순서를 바꾸면 결과가 달라진다.
*/
const colorRoleRegistries = [
  ["neutral", workspaceLabNeutralTones],
  ["accent", workspaceLabAccentColors],
  ["root", workspaceLabRootColors],
  ["status", workspaceLabStatusColors],
  ["chrome", workspaceLabChromeColors],
  ["contrast", workspaceLabColorContrasts],
] as const satisfies ReadonlyArray<
  readonly [
    keyof WorkspaceLabColorRoleSelection,
    readonly ColorRoleOptionDefinition[],
  ]
>;

/*
함수 이름 : getWorkspaceLabColorTokens
기능 : 테마 토큰 위에 역할별 색 선택을 정해진 순서로 덧씌운다. 모든 역할이 테마 기본이면 테마 토큰을 그대로 돌려준다.
인자 : WorkspaceLabColorThemeTokens baseTokens -> 출발점이 되는 테마 토큰
WorkspaceLabColorRoleSelection selection -> 역할별 색 선택값
반환값 : 화면에 적용할 테마 토큰
*/
export function getWorkspaceLabColorTokens(
  baseTokens: WorkspaceLabColorThemeTokens,
  selection: WorkspaceLabColorRoleSelection,
): WorkspaceLabColorThemeTokens {
  let tokens = baseTokens;

  for (const [role, options] of colorRoleRegistries) {
    const option: ColorRoleOptionDefinition =
      options.find((item) => item.id === selection[role]) ?? options[0];

    tokens = { ...tokens, ...option.apply(tokens) };
  }

  return tokens;
}
