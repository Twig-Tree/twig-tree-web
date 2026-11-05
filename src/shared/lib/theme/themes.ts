export const THEME_IDS = ["neutral", "soft"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "neutral";

export const THEME_STORAGE_KEY = "twig-tree:theme";

/*
함수 이름 : isThemeId
기능 : 저장소나 문서에서 읽은 값이 제품에 있는 테마인지 판단한다. 테마를 없앤 뒤에도 저장값이 남아 있을 수 있어 읽을 때마다 확인한다.
인자 : string | null | undefined value -> 확인할 값
반환값 : 제품에 있는 테마면 true
*/
export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  THEME_IDS.some((themeId) => themeId === value);
