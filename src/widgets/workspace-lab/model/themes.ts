import type { CSSProperties } from "react";

export interface WorkspaceLabThemeTokens {
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
  highlight: string;
  lecture: string;
  danger: string;
  edge: string;
  nodeRadius: string;
  nodeShadow: string;
  selectedRing: string;
  selectedShadow: string;
  rootSurface: string;
  rootBorder: string;
  rootText: string;
  rootMutedText: string;
  rootShadow: string;
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
  toolbarShadow: string;
  playerSurface: string;
  playerBorder: string;
  playerShadow: string;
}

export interface WorkspaceLabThemeDefinition {
  id: string;
  name: string;
  description: string;
  tokens: WorkspaceLabThemeTokens;
}

const neutralTokens: WorkspaceLabThemeTokens = {
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
  highlight: "#f59e0b",
  lecture: "#06b6d4",
  danger: "#dc2626",
  edge: "#a6afbe",
  nodeRadius: "14px",
  nodeShadow: "0 8px 24px rgb(15 23 42 / 8%)",
  selectedRing: "rgb(79 70 229 / 18%)",
  selectedShadow: "0 8px 24px rgb(15 23 42 / 8%)",
  rootSurface: "#ffffff",
  rootBorder: "#b9b5e8",
  rootText: "#172033",
  rootMutedText: "#778195",
  rootShadow: "0 8px 24px rgb(15 23 42 / 8%)",
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
  toolbarShadow: "0 10px 24px rgb(15 23 42 / 12%)",
  playerSurface: "rgb(255 255 255 / 95%)",
  playerBorder: "#e2e8f0",
  playerShadow: "0 10px 24px rgb(15 23 42 / 12%)",
};

const quietTokens: WorkspaceLabThemeTokens = {
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
  nodeRadius: "12px",
  nodeShadow: "0 1px 2px rgb(23 42 33 / 7%), 0 8px 24px rgb(23 42 33 / 6%)",
  selectedRing: "rgb(103 87 217 / 18%)",
  selectedShadow: "0 12px 30px rgb(23 42 33 / 20%)",
  rootSurface: "#203029",
  rootBorder: "#203029",
  rootText: "#f9fbf8",
  rootMutedText: "#aebbb4",
  rootShadow: "0 1px 2px rgb(9 20 14 / 22%), 0 12px 30px rgb(23 42 33 / 20%)",
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
  toolbarShadow: "0 14px 32px rgb(23 42 33 / 22%)",
  playerSurface: "rgb(255 254 250 / 95%)",
  playerBorder: "#d4dcd2",
  playerShadow: "0 14px 34px rgb(23 42 33 / 14%)",
};

const softTokens: WorkspaceLabThemeTokens = {
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
  nodeRadius: "20px",
  nodeShadow: "0 10px 30px rgb(89 64 120 / 11%)",
  selectedRing: "rgb(139 92 246 / 18%)",
  selectedShadow: "0 10px 30px rgb(89 64 120 / 15%)",
  rootSurface: "#fffafd",
  rootBorder: "#cbb8e0",
  rootText: "#31233d",
  rootMutedText: "#8a7895",
  rootShadow: "0 10px 30px rgb(89 64 120 / 11%)",
  searchSurface: "#f7f1fb",
  outlineHoverSurface: "#f7f1fb",
  tagSurface: "#f7f1fb",
  tagBorder: "#e7dff0",
  tagText: "#6e587a",
  toolbarHoverText: "#8b5cf6",
};

const contrastTokens: WorkspaceLabThemeTokens = {
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
  nodeRadius: "6px",
  nodeShadow: "3px 3px 0 rgb(17 24 39 / 88%)",
  selectedRing: "rgb(67 56 202 / 24%)",
  selectedShadow: "3px 3px 0 rgb(17 24 39 / 88%)",
  rootBorder: "#111827",
  rootShadow: "3px 3px 0 rgb(17 24 39 / 88%)",
  rootControlText: "#111827",
  shareBorder: "#111827",
  searchSurface: "#eef0f3",
  outlineHoverSurface: "#e5e7eb",
  tagSurface: "#ffffff",
  tagBorder: "#111827",
  tagText: "#111827",
  toolbarBorder: "#111827",
  toolbarShadow: "3px 3px 0 rgb(17 24 39 / 88%)",
  playerBorder: "#111827",
  playerShadow: "3px 3px 0 rgb(17 24 39 / 88%)",
};

/*
새 테마는 기존 tokens를 펼쳐 필요한 값만 덮어쓴 뒤 이 배열에 정의한다.
id union, Inspector 옵션, 팔레트, CSS 변수 주입은 이 registry에서 자동으로 파생된다.
*/
export const workspaceLabThemes = [
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
] as const satisfies readonly WorkspaceLabThemeDefinition[];

export type WorkspaceLabThemeId = (typeof workspaceLabThemes)[number]["id"];
export type WorkspaceLabTheme = (typeof workspaceLabThemes)[number];

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
  highlight: "--lab-highlight",
  lecture: "--lab-lecture",
  danger: "--lab-danger",
  edge: "--lab-edge",
  nodeRadius: "--lab-node-radius",
  nodeShadow: "--lab-node-shadow",
  selectedRing: "--lab-selected-ring",
  selectedShadow: "--lab-selected-shadow",
  rootSurface: "--lab-root-surface",
  rootBorder: "--lab-root-border",
  rootText: "--lab-root-text",
  rootMutedText: "--lab-root-muted",
  rootShadow: "--lab-root-shadow",
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
  toolbarShadow: "--lab-toolbar-shadow",
  playerSurface: "--lab-player-surface",
  playerBorder: "--lab-player-border",
  playerShadow: "--lab-player-shadow",
} as const satisfies Record<keyof WorkspaceLabThemeTokens, `--lab-${string}`>;

type WorkspaceLabThemeStyle = CSSProperties &
  Record<(typeof tokenCssVariables)[keyof typeof tokenCssVariables], string>;

export function getWorkspaceLabTheme(id: WorkspaceLabThemeId) {
  return (
    workspaceLabThemes.find((theme) => theme.id === id) ?? workspaceLabThemes[0]
  );
}

export function getWorkspaceLabThemeStyle(
  theme: WorkspaceLabThemeDefinition,
): WorkspaceLabThemeStyle {
  const style = {} as WorkspaceLabThemeStyle;

  for (const tokenName of Object.keys(tokenCssVariables) as Array<
    keyof WorkspaceLabThemeTokens
  >) {
    style[tokenCssVariables[tokenName]] = theme.tokens[tokenName];
  }

  return style;
}

export function getWorkspaceLabThemePalette(
  theme: WorkspaceLabThemeDefinition,
) {
  return [
    { label: "Canvas", color: theme.tokens.canvas },
    { label: "Surface", color: theme.tokens.surface },
    { label: "Ink", color: theme.tokens.text },
    { label: "Accent", color: theme.tokens.accent },
    { label: "Root", color: theme.tokens.rootSurface },
  ];
}
