import type { CSSProperties } from "react";

export interface WorkspaceLabColorThemeTokens {
  previewBackground: string;
  previewPattern: string;
  previewPatternSize: string;
  frameBorder: string;
  frameShadow: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  panelSurface: string;
  headerSurface: string;
  border: string;
  panelBorder: string;
  text: string;
  mutedText: string;
  accent: string;
  accentText: string; // 강조색으로 채운 면 위의 글자·아이콘 색
  highlight: string;
  lecture: string;
  danger: string;
  edge: string;
  shadowInk: string; // 형태 슬롯의 그림자가 섞어 쓰는 색
  selectedRing: string;
  rootSurface: string;
  rootBorder: string;
  rootText: string;
  rootMutedText: string;
  rootControlSurface: string;
  rootControlText: string;
  savedSurface: string;
  savedText: string;
  avatarSurface: string;
  avatarText: string;
  shareSurface: string;
  shareBorder: string;
  shareText: string;
  searchSurface: string;
  outlineText: string;
  outlineHoverSurface: string;
  outlineHoverText: string;
  tagSurface: string;
  tagBorder: string;
  tagText: string;
  toolbarSurface: string;
  toolbarBorder: string;
  toolbarText: string;
  toolbarHoverSurface: string;
  toolbarHoverText: string;
  playerSurface: string;
  playerBorder: string;
}

export interface WorkspaceLabColorThemeDefinition {
  id: string;
  name: string;
  description: string;
  tokens: WorkspaceLabColorThemeTokens;
}

const neutralTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#e9edf2",
  previewPattern: "radial-gradient(#cbd2dc 0.75px, transparent 0.75px)",
  previewPatternSize: "12px 12px",
  frameBorder: "rgb(148 163 184 / 22%)",
  frameShadow: "0 18px 50px rgb(15 23 42 / 13%)",
  canvas: "#f7f8fa",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  panelSurface: "#ffffff",
  headerSurface: "#ffffff",
  border: "#dce1e8",
  panelBorder: "#e2e8f0",
  text: "#172033",
  mutedText: "#778195",
  accent: "#4f46e5",
  accentText: "#ffffff",
  highlight: "#f59e0b",
  lecture: "#06b6d4",
  danger: "#dc2626",
  edge: "#a6afbe",
  shadowInk: "#0f172a",
  selectedRing: "rgb(79 70 229 / 18%)",
  rootSurface: "#ffffff",
  rootBorder: "#b9b5e8",
  rootText: "#172033",
  rootMutedText: "#778195",
  rootControlSurface: "#ffffff",
  rootControlText: "#778195",
  savedSurface: "#ecfdf5",
  savedText: "#047857",
  avatarSurface: "#0f172a",
  avatarText: "#ffffff",
  shareSurface: "#ffffff",
  shareBorder: "#e2e8f0",
  shareText: "#475569",
  searchSurface: "#f8fafc",
  outlineText: "#475569",
  outlineHoverSurface: "#f8fafc",
  outlineHoverText: "#0f172a",
  tagSurface: "#f1f5f9",
  tagBorder: "transparent",
  tagText: "#475569",
  toolbarSurface: "rgb(255 255 255 / 95%)",
  toolbarBorder: "#e2e8f0",
  toolbarText: "#64748b",
  toolbarHoverSurface: "#f1f5f9",
  toolbarHoverText: "#4f46e5",
  playerSurface: "rgb(255 255 255 / 95%)",
  playerBorder: "#e2e8f0",
};

const quietTokens: WorkspaceLabColorThemeTokens = {
  ...neutralTokens,
  previewBackground: "#dfe5de",
  previewPattern:
    "linear-gradient(rgb(255 255 255 / 24%) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 24%) 1px, transparent 1px)",
  previewPatternSize: "24px 24px",
  canvas: "#f2f5f0",
  surface: "#fffefa",
  surfaceMuted: "#f2f5f0",
  panelSurface: "#fffefa",
  headerSurface: "#fffefa",
  border: "#d4dcd2",
  panelBorder: "#dfe5dd",
  text: "#203029",
  mutedText: "#78877f",
  accent: "#6757d9",
  highlight: "#d99032",
  lecture: "#168c87",
  danger: "#c84949",
  edge: "#9caaa2",
  shadowInk: "#172a21",
  selectedRing: "rgb(103 87 217 / 18%)",
  rootSurface: "#203029",
  rootBorder: "#203029",
  rootText: "#f9fbf8",
  rootMutedText: "#aebbb4",
  rootControlSurface: "#6757d9",
  rootControlText: "#ffffff",
  savedSurface: "#ecf4ec",
  savedText: "#4d7257",
  avatarSurface: "#203029",
  avatarText: "#ffffff",
  shareSurface: "#f8faf6",
  shareBorder: "#d4dcd2",
  shareText: "#405047",
  searchSurface: "#f5f7f3",
  outlineText: "#58675f",
  outlineHoverSurface: "#f0f3ee",
  outlineHoverText: "#203029",
  tagSurface: "#f4f6f2",
  tagBorder: "#dfe5dd",
  tagText: "#59685f",
  toolbarSurface: "rgb(32 48 41 / 94%)",
  toolbarBorder: "rgb(255 255 255 / 12%)",
  toolbarText: "#cbd5cf",
  toolbarHoverSurface: "rgb(255 255 255 / 10%)",
  toolbarHoverText: "#ffffff",
  playerSurface: "rgb(255 254 250 / 95%)",
  playerBorder: "#d4dcd2",
};

const softTokens: WorkspaceLabColorThemeTokens = {
  ...neutralTokens,
  canvas: "#f7f5ff",
  surface: "#fffafd",
  surfaceMuted: "#f7f1fb",
  panelSurface: "#fffafd",
  headerSurface: "#fffafd",
  border: "#e7dff0",
  panelBorder: "#e7dff0",
  text: "#31233d",
  mutedText: "#8a7895",
  accent: "#8b5cf6",
  highlight: "#ec4899",
  lecture: "#0ea5e9",
  edge: "#b9a9c6",
  shadowInk: "#594078",
  selectedRing: "rgb(139 92 246 / 18%)",
  rootSurface: "#fffafd",
  rootBorder: "#cbb8e0",
  rootText: "#31233d",
  rootMutedText: "#8a7895",
  searchSurface: "#f7f1fb",
  outlineHoverSurface: "#f7f1fb",
  tagSurface: "#f7f1fb",
  tagBorder: "#e7dff0",
  tagText: "#6e587a",
  toolbarHoverText: "#8b5cf6",
};

const contrastTokens: WorkspaceLabColorThemeTokens = {
  ...neutralTokens,
  canvas: "#f4f5f7",
  surfaceMuted: "#eef0f3",
  border: "#111827",
  panelBorder: "#111827",
  text: "#030712",
  mutedText: "#374151",
  accent: "#4338ca",
  highlight: "#b45309",
  lecture: "#0369a1",
  edge: "#111827",
  shadowInk: "#111827",
  selectedRing: "rgb(67 56 202 / 24%)",
  rootBorder: "#111827",
  rootControlText: "#111827",
  shareBorder: "#111827",
  searchSurface: "#eef0f3",
  outlineHoverSurface: "#e5e7eb",
  tagSurface: "#ffffff",
  tagBorder: "#111827",
  tagText: "#111827",
  toolbarBorder: "#111827",
  playerBorder: "#111827",
};

/*
어두운 캔버스 위에서 청록 강조색 하나로 초점을 모은다.
그림자가 바탕에 묻히므로 깊이는 표면 단계와 테두리로 만든다.
*/
const midnightTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#0b0f14",
  previewPattern:
    "radial-gradient(rgb(255 255 255 / 6%) 0.75px, transparent 0.75px)",
  previewPatternSize: "12px 12px",
  frameBorder: "rgb(255 255 255 / 8%)",
  frameShadow: "0 24px 60px rgb(0 0 0 / 45%)",
  canvas: "#0f141a",
  surface: "#182029",
  surfaceMuted: "#131a21",
  panelSurface: "#131a21",
  headerSurface: "#131a21",
  border: "#2a3540",
  panelBorder: "#222c36",
  text: "#e6edf3",
  mutedText: "#8b98a5",
  accent: "#2dd4bf",
  accentText: "#042f2a",
  highlight: "#fbbf24",
  lecture: "#60a5fa",
  danger: "#f87171",
  edge: "#3d4b59",
  shadowInk: "#000000",
  selectedRing: "rgb(45 212 191 / 22%)",
  rootSurface: "#123a36",
  rootBorder: "#2dd4bf",
  rootText: "#e6fffb",
  rootMutedText: "#7fbfb6",
  rootControlSurface: "#2dd4bf",
  rootControlText: "#042f2a",
  savedSurface: "#10302b",
  savedText: "#5eead4",
  avatarSurface: "#2dd4bf",
  avatarText: "#042f2a",
  shareSurface: "#182029",
  shareBorder: "#2a3540",
  shareText: "#b4c0cb",
  searchSurface: "#182029",
  outlineText: "#b4c0cb",
  outlineHoverSurface: "#1d2731",
  outlineHoverText: "#ffffff",
  tagSurface: "#1d2731",
  tagBorder: "transparent",
  tagText: "#b4c0cb",
  toolbarSurface: "rgb(24 32 41 / 94%)",
  toolbarBorder: "#2a3540",
  toolbarText: "#9aa7b4",
  toolbarHoverSurface: "rgb(255 255 255 / 6%)",
  toolbarHoverText: "#2dd4bf",
  playerSurface: "rgb(24 32 41 / 95%)",
  playerBorder: "#2a3540",
};

/*
청사진 용지처럼 짙은 파랑 바탕에 밝은 하늘색 선을 긋는다.
루트만 밝게 반전해 도면의 표제란처럼 보이게 한다.
*/
const blueprintTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#0d2340",
  previewPattern:
    "linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 5%) 1px, transparent 1px)",
  previewPatternSize: "20px 20px",
  frameBorder: "rgb(125 211 252 / 20%)",
  frameShadow: "0 20px 60px rgb(2 12 27 / 50%)",
  canvas: "#123a6b",
  surface: "#0f2f57",
  surfaceMuted: "#0d2a4e",
  panelSurface: "#0b2545",
  headerSurface: "#0b2545",
  border: "#3b6ea5",
  panelBorder: "#24507f",
  text: "#e0f2fe",
  mutedText: "#8fb6d9",
  accent: "#7dd3fc",
  accentText: "#0b2545",
  highlight: "#fde047",
  lecture: "#a7f3d0",
  danger: "#fca5a5",
  edge: "#93c5fd",
  shadowInk: "#020c1b",
  selectedRing: "rgb(125 211 252 / 28%)",
  rootSurface: "#e0f2fe",
  rootBorder: "#e0f2fe",
  rootText: "#0b2545",
  rootMutedText: "#3b6ea5",
  rootControlSurface: "#0b2545",
  rootControlText: "#7dd3fc",
  savedSurface: "rgb(125 211 252 / 14%)",
  savedText: "#7dd3fc",
  avatarSurface: "#7dd3fc",
  avatarText: "#0b2545",
  shareSurface: "#0f2f57",
  shareBorder: "#3b6ea5",
  shareText: "#bae6fd",
  searchSurface: "#0f2f57",
  outlineText: "#bae6fd",
  outlineHoverSurface: "#123a6b",
  outlineHoverText: "#ffffff",
  tagSurface: "transparent",
  tagBorder: "#3b6ea5",
  tagText: "#bae6fd",
  toolbarSurface: "rgb(11 37 69 / 94%)",
  toolbarBorder: "#3b6ea5",
  toolbarText: "#93c5fd",
  toolbarHoverSurface: "rgb(125 211 252 / 12%)",
  toolbarHoverText: "#e0f2fe",
  playerSurface: "rgb(11 37 69 / 95%)",
  playerBorder: "#3b6ea5",
};

/*
올리브와 이끼색을 바탕에 깔고 루트를 연한 잎색으로 채워 자라나는 나무처럼 보이게 한다.
*/
const groveTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#dfe3d2",
  previewPattern: "radial-gradient(#c4cbb0 0.75px, transparent 0.75px)",
  previewPatternSize: "16px 16px",
  frameBorder: "rgb(90 110 60 / 20%)",
  frameShadow: "0 18px 50px rgb(40 60 20 / 14%)",
  canvas: "#edf0e3",
  surface: "#fbfbf4",
  surfaceMuted: "#f1f3e8",
  panelSurface: "#f6f7ee",
  headerSurface: "#f6f7ee",
  border: "#d6dcc6",
  panelBorder: "#dde2cf",
  text: "#263020",
  mutedText: "#6c7760",
  accent: "#5a7d3a",
  accentText: "#ffffff",
  highlight: "#e0a23b",
  lecture: "#2f7f8f",
  danger: "#b8452f",
  edge: "#a7b394",
  shadowInk: "#2c3d1e",
  selectedRing: "rgb(90 125 58 / 20%)",
  rootSurface: "#e3ebcf",
  rootBorder: "#5a7d3a",
  rootText: "#263020",
  rootMutedText: "#5f6d4f",
  rootControlSurface: "#5a7d3a",
  rootControlText: "#ffffff",
  savedSurface: "#e3ebcf",
  savedText: "#46632c",
  avatarSurface: "#5a7d3a",
  avatarText: "#ffffff",
  shareSurface: "#fbfbf4",
  shareBorder: "#d6dcc6",
  shareText: "#4c5940",
  searchSurface: "#f1f3e8",
  outlineText: "#4c5940",
  outlineHoverSurface: "#e9eddc",
  outlineHoverText: "#263020",
  tagSurface: "#e9eddc",
  tagBorder: "transparent",
  tagText: "#4c5940",
  toolbarSurface: "rgb(251 251 244 / 95%)",
  toolbarBorder: "#d6dcc6",
  toolbarText: "#6c7760",
  toolbarHoverSurface: "#e9eddc",
  toolbarHoverText: "#5a7d3a",
  playerSurface: "rgb(251 251 244 / 95%)",
  playerBorder: "#d6dcc6",
};

/*
노랑 바탕, 코랄 강조, 노랑 루트로 밝고 경쾌하게 만든다.
코랄은 흰 글자 대비가 부족해 강조면 위 글자를 짙은 남색으로 둔다.
*/
const sunnyTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#ffe9b8",
  previewPattern: "radial-gradient(#f5cf7a 1.25px, transparent 1.25px)",
  previewPatternSize: "18px 18px",
  frameBorder: "rgb(43 45 66 / 14%)",
  frameShadow: "0 18px 50px rgb(180 100 20 / 18%)",
  canvas: "#fff8e7",
  surface: "#ffffff",
  surfaceMuted: "#fff3d6",
  panelSurface: "#ffffff",
  headerSurface: "#ffffff",
  border: "#f3dfb4",
  panelBorder: "#f6e6c4",
  text: "#2b2d42",
  mutedText: "#74768c",
  accent: "#ff5a5f",
  accentText: "#2b2d42",
  highlight: "#ffb627",
  lecture: "#2ec4b6",
  danger: "#d7263d",
  edge: "#f0b9a0",
  shadowInk: "#b4561f",
  selectedRing: "rgb(255 90 95 / 22%)",
  rootSurface: "#ffc542",
  rootBorder: "#ffc542",
  rootText: "#2b2d42",
  rootMutedText: "#6b5a2a",
  rootControlSurface: "#2b2d42",
  rootControlText: "#ffc542",
  savedSurface: "#dff7f4",
  savedText: "#1a7f75",
  avatarSurface: "#ff5a5f",
  avatarText: "#2b2d42",
  shareSurface: "#ffffff",
  shareBorder: "#f3dfb4",
  shareText: "#4a4c63",
  searchSurface: "#fff8e7",
  outlineText: "#4a4c63",
  outlineHoverSurface: "#fff3d6",
  outlineHoverText: "#2b2d42",
  tagSurface: "#ffe1e2",
  tagBorder: "transparent",
  tagText: "#a8343a",
  toolbarSurface: "rgb(255 255 255 / 96%)",
  toolbarBorder: "#f3dfb4",
  toolbarText: "#74768c",
  toolbarHoverSurface: "#fff3d6",
  toolbarHoverText: "#ff5a5f",
  playerSurface: "rgb(255 255 255 / 96%)",
  playerBorder: "#f3dfb4",
};

/*
바랜 종이색 바탕에 검정 선과 다홍 강조 하나만 둔다.
High contrast가 가독성을 위한 대비라면, 이쪽은 장식 없는 인쇄물 같은 표현이 목적이다.
*/
const monoTokens: WorkspaceLabColorThemeTokens = {
  previewBackground: "#d9d6cf",
  previewPattern:
    "linear-gradient(rgb(0 0 0 / 6%) 1px, transparent 1px), linear-gradient(90deg, rgb(0 0 0 / 6%) 1px, transparent 1px)",
  previewPatternSize: "32px 32px",
  frameBorder: "#111111",
  frameShadow: "8px 8px 0 #111111",
  canvas: "#f2f0eb",
  surface: "#ffffff",
  surfaceMuted: "#e9e6df",
  panelSurface: "#f2f0eb",
  headerSurface: "#ffffff",
  border: "#111111",
  panelBorder: "#111111",
  text: "#111111",
  mutedText: "#55524c",
  accent: "#e63312",
  accentText: "#ffffff",
  highlight: "#ffd400",
  lecture: "#1d4ed8",
  danger: "#e63312",
  edge: "#111111",
  shadowInk: "#111111",
  selectedRing: "rgb(230 51 18 / 26%)",
  rootSurface: "#111111",
  rootBorder: "#111111",
  rootText: "#ffffff",
  rootMutedText: "#b8b4ab",
  rootControlSurface: "#e63312",
  rootControlText: "#ffffff",
  savedSurface: "#ffd400",
  savedText: "#111111",
  avatarSurface: "#e63312",
  avatarText: "#ffffff",
  shareSurface: "#ffffff",
  shareBorder: "#111111",
  shareText: "#111111",
  searchSurface: "#ffffff",
  outlineText: "#111111",
  outlineHoverSurface: "#ffd400",
  outlineHoverText: "#111111",
  tagSurface: "#ffffff",
  tagBorder: "#111111",
  tagText: "#111111",
  toolbarSurface: "#ffffff",
  toolbarBorder: "#111111",
  toolbarText: "#111111",
  toolbarHoverSurface: "#ffd400",
  toolbarHoverText: "#111111",
  playerSurface: "#ffffff",
  playerBorder: "#111111",
};

/*
새 테마는 기존 tokens를 펼쳐 필요한 값만 덮어쓴 뒤 이 배열에 정의한다.
id union, Inspector 옵션, 팔레트, CSS 변수 주입은 이 registry에서 자동으로 파생된다.
*/
export const workspaceLabColorThemes = [
  {
    id: "quiet",
    name: "Draft 01 · Quiet Focus",
    description:
      "콘텐츠에 집중되는 저채도 캔버스와 짙은 루트 노드로 계층의 시작점을 분명하게 표현합니다.",
    tokens: quietTokens,
  },
  {
    id: "neutral",
    name: "Neutral",
    description: "제품 UI에 바로 적용하기 쉬운 중립적인 기본 프리셋입니다.",
    tokens: neutralTokens,
  },
  {
    id: "soft",
    name: "Soft",
    description: "부드러운 곡률과 보랏빛 표면으로 친근한 인상을 만듭니다.",
    tokens: softTokens,
  },
  {
    id: "contrast",
    name: "High contrast",
    description: "강한 외곽선과 그림자로 정보 경계를 뚜렷하게 구분합니다.",
    tokens: contrastTokens,
  },
  {
    id: "midnight",
    name: "Midnight",
    description:
      "어두운 캔버스와 청록 강조색으로 긴 작업에서도 눈이 덜 피로합니다.",
    tokens: midnightTokens,
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "짙은 파랑 바탕에 하늘색 선을 그어 설계 도면처럼 표현합니다.",
    tokens: blueprintTokens,
  },
  {
    id: "grove",
    name: "Grove",
    description:
      "올리브와 이끼색, 연한 잎색 루트로 자라나는 나무처럼 보입니다.",
    tokens: groveTokens,
  },
  {
    id: "sunny",
    name: "Sunny Pop",
    description: "노랑 바탕과 코랄 강조색으로 밝고 경쾌한 인상을 만듭니다.",
    tokens: sunnyTokens,
  },
  {
    id: "mono",
    name: "Mono Brutal",
    description:
      "바랜 종이에 검정 선과 다홍 강조 하나만 둔 인쇄물 같은 표현입니다.",
    tokens: monoTokens,
  },
] as const satisfies readonly WorkspaceLabColorThemeDefinition[];

export type WorkspaceLabColorThemeId =
  (typeof workspaceLabColorThemes)[number]["id"];
export type WorkspaceLabColorTheme = (typeof workspaceLabColorThemes)[number];

const tokenCssVariables = {
  previewBackground: "--lab-preview-background",
  previewPattern: "--lab-preview-pattern",
  previewPatternSize: "--lab-preview-pattern-size",
  frameBorder: "--lab-frame-border",
  frameShadow: "--lab-frame-shadow",
  canvas: "--lab-canvas",
  surface: "--lab-surface",
  surfaceMuted: "--lab-surface-muted",
  panelSurface: "--lab-panel-surface",
  headerSurface: "--lab-header-surface",
  border: "--lab-border",
  panelBorder: "--lab-panel-border",
  text: "--lab-node-text",
  mutedText: "--lab-node-muted",
  accent: "--lab-accent",
  accentText: "--lab-accent-text",
  highlight: "--lab-highlight",
  lecture: "--lab-lecture",
  danger: "--lab-danger",
  edge: "--lab-edge",
  shadowInk: "--lab-shadow-ink",
  selectedRing: "--lab-selected-ring",
  rootSurface: "--lab-root-surface",
  rootBorder: "--lab-root-border",
  rootText: "--lab-root-text",
  rootMutedText: "--lab-root-muted",
  rootControlSurface: "--lab-root-control-surface",
  rootControlText: "--lab-root-control-text",
  savedSurface: "--lab-saved-surface",
  savedText: "--lab-saved-text",
  avatarSurface: "--lab-avatar-surface",
  avatarText: "--lab-avatar-text",
  shareSurface: "--lab-share-surface",
  shareBorder: "--lab-share-border",
  shareText: "--lab-share-text",
  searchSurface: "--lab-search-surface",
  outlineText: "--lab-outline-text",
  outlineHoverSurface: "--lab-outline-hover-surface",
  outlineHoverText: "--lab-outline-hover-text",
  tagSurface: "--lab-tag-surface",
  tagBorder: "--lab-tag-border",
  tagText: "--lab-tag-text",
  toolbarSurface: "--lab-toolbar-surface",
  toolbarBorder: "--lab-toolbar-border",
  toolbarText: "--lab-toolbar-text",
  toolbarHoverSurface: "--lab-toolbar-hover-surface",
  toolbarHoverText: "--lab-toolbar-hover-text",
  playerSurface: "--lab-player-surface",
  playerBorder: "--lab-player-border",
} as const satisfies Record<
  keyof WorkspaceLabColorThemeTokens,
  `--lab-${string}`
>;

type WorkspaceLabColorThemeStyle = CSSProperties &
  Record<(typeof tokenCssVariables)[keyof typeof tokenCssVariables], string>;

export function getWorkspaceLabColorTheme(id: WorkspaceLabColorThemeId) {
  return (
    workspaceLabColorThemes.find((theme) => theme.id === id) ??
    workspaceLabColorThemes[0]
  );
}

export function getWorkspaceLabColorThemeStyle(
  theme: WorkspaceLabColorThemeDefinition,
): WorkspaceLabColorThemeStyle {
  const style = {} as WorkspaceLabColorThemeStyle;

  for (const tokenName of Object.keys(tokenCssVariables) as Array<
    keyof WorkspaceLabColorThemeTokens
  >) {
    style[tokenCssVariables[tokenName]] = theme.tokens[tokenName];
  }

  return style;
}

export function getWorkspaceLabColorThemePalette(
  theme: WorkspaceLabColorThemeDefinition,
) {
  return [
    { label: "Canvas", color: theme.tokens.canvas },
    { label: "Surface", color: theme.tokens.surface },
    { label: "Ink", color: theme.tokens.text },
    { label: "Accent", color: theme.tokens.accent },
    { label: "Root", color: theme.tokens.rootSurface },
  ];
}
