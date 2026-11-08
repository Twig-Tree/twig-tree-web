export const THEME_IDS = ["neutral", "soft", "dark"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "neutral";

export const THEME_STORAGE_KEY = "twig-tree:theme";

export const SYSTEM_THEME = "system";

export type ThemePreference = ThemeId | typeof SYSTEM_THEME; // 사용자가 고른 값. 적용되는 테마는 ThemeId 중 하나다

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  SYSTEM_THEME,
  ...THEME_IDS,
];

export const SYSTEM_DARK_THEME: ThemeId = "dark";

export const SYSTEM_LIGHT_THEME: ThemeId = "neutral";

export const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/*
함수 이름 : isThemeId
기능 : 저장소나 문서에서 읽은 값이 제품에 있는 테마인지 판단한다. 테마를 없앤 뒤에도 저장값이 남아 있을 수 있어 읽을 때마다 확인한다.
인자 : string | null | undefined value -> 확인할 값
반환값 : 제품에 있는 테마면 true
*/
export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  THEME_IDS.some((themeId) => themeId === value);

/*
함수 이름 : isThemePreference
기능 : 저장소에서 읽은 값이 사용자가 고를 수 있는 값인지 판단한다.
인자 : string | null | undefined value -> 확인할 값
반환값 : 제품 테마이거나 시스템 설정이면 true
*/
export const isThemePreference = (
  value: string | null | undefined,
): value is ThemePreference => value === SYSTEM_THEME || isThemeId(value);
