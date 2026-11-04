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
