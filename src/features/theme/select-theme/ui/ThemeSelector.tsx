"use client";

import { THEME_IDS, useTheme, type ThemeId } from "@/src/shared/lib/theme";

const THEME_LABELS: Record<ThemeId, string> = {
  neutral: "Neutral",
  soft: "Soft",
};

/*
함수 이름 : ThemeSelector
기능 : 테마 목록을 하나만 고르는 선택지로 보여 주고, 고르면 바로 적용하고 저장한다.
인자 : 없음
반환값 : 테마 선택 요소
*/
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-content">테마</legend>

      {THEME_IDS.map((themeId) => (
        <label
          key={themeId}
          className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3 py-2.5 text-sm text-content transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
        >
          <input
            type="radio"
            name="theme"
            value={themeId}
            checked={themeId === theme}
            onChange={() => setTheme(themeId)}
            className="accent-accent outline-none"
          />
          {THEME_LABELS[themeId]}
        </label>
      ))}
    </fieldset>
  );
}
