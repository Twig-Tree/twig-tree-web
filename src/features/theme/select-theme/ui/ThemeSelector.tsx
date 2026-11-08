"use client";

import {
  THEME_PREFERENCES,
  useTheme,
  type ThemePreference,
} from "@/src/shared/lib/theme";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "시스템 설정 따르기",
  neutral: "Neutral",
  soft: "Soft",
  dark: "Dark",
};

/*
함수 이름 : ThemeSelector
기능 : 테마 목록을 하나만 고르는 선택지로 보여 주고, 고르면 바로 적용하고 저장한다.
인자 : 없음
반환값 : 테마 선택 요소
*/
export function ThemeSelector() {
  const { preference, setTheme } = useTheme();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-content">테마</legend>

      {THEME_PREFERENCES.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3 py-2.5 text-sm text-content transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
        >
          <input
            type="radio"
            name="theme"
            value={option}
            checked={option === preference}
            onChange={() => setTheme(option)}
            className="accent-accent outline-none"
          />
          {THEME_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
