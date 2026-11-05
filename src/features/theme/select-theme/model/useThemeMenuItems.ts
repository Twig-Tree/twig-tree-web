import { THEME_IDS, useTheme, type ThemeId } from "@/src/shared/lib/theme";
import type { KebabMenuItem } from "@/src/shared/ui/kebab-menu";

const THEME_LABELS: Record<ThemeId, string> = {
  neutral: "Neutral 테마",
  soft: "Soft 테마",
};

/*
함수 이름 : useThemeMenuItems
기능 : 테마 목록을 메뉴 항목으로 만든다. 현재 테마에 선택 표시를 하고, 항목을 고르면 그 테마를 적용하고 저장한다.
인자 : 없음
반환값 : 메뉴에 넣을 테마 항목 목록
*/
export const useThemeMenuItems = (): KebabMenuItem[] => {
  const { theme, setTheme } = useTheme();

  return THEME_IDS.map((themeId) => ({
    id: `theme-${themeId}`,
    label: THEME_LABELS[themeId],
    checked: themeId === theme,
    onSelect: () => setTheme(themeId),
  }));
};
