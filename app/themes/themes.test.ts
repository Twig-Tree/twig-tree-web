import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const themesDirectory = path.resolve(__dirname);

const readCss = (fileName: string) =>
  readFileSync(path.join(themesDirectory, fileName), "utf8");

const themeFileNames = readdirSync(themesDirectory).filter(
  (fileName) => fileName.endsWith(".css") && fileName !== "tokens.css",
);

/*
함수 이름 : getThemeValues
기능 : 테마 파일에서 --theme-* 선언을 이름과 값의 객체로 읽는다.
인자 : string css -> 테마 파일 내용
반환값 : 토큰 이름을 키로 하는 값 객체
*/
const getThemeValues = (css: string) =>
  Object.fromEntries(
    [...css.matchAll(/(--theme-[a-z-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );

/*
함수 이름 : getRelativeLuminance
기능 : WCAG 정의에 따라 #rrggbb 색의 상대 휘도를 계산한다.
인자 : string hex -> #rrggbb 형식의 색
반환값 : 0과 1 사이의 상대 휘도
*/
const getRelativeLuminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/*
함수 이름 : getContrastRatio
기능 : 두 색의 WCAG 대비를 계산한다.
인자 : string first -> #rrggbb 형식의 색
string second -> #rrggbb 형식의 색
반환값 : 1 이상 21 이하의 대비
*/
const getContrastRatio = (first: string, second: string) => {
  const [lighter, darker] = [
    getRelativeLuminance(first),
    getRelativeLuminance(second),
  ].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
};

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA의 일반 글자 기준

/*
화면에서 실제로 겹치는 글자와 바탕의 조합이다.
비활성 글자와 연결선은 WCAG 대비 기준의 대상이 아니므로 넣지 않는다.
*/
const textPairs: Array<[text: string, background: string]> = [
  ["content", "surface"],
  ["content", "surface-muted"],
  ["content", "surface-hover"],
  ["content-secondary", "surface"],
  ["content-secondary", "surface-muted"],
  ["content-secondary", "surface-strong"],
  ["content-muted", "surface"],
  ["content-muted", "surface-muted"],
  ["content-muted", "surface-hover"],
  ["content-muted", "surface-strong"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["accent", "surface"],
  ["accent", "surface-muted"],
  ["accent", "accent-subtle"],
  ["accent-hover", "accent-subtle"],
  ["on-inverse", "inverse"],
  ["danger", "surface"],
  ["danger", "danger-subtle"],
  ["warning", "surface"],
  ["warning", "warning-subtle"],
  ["warning-strong", "warning-subtle"],
  ["success", "surface"],
  ["success", "success-subtle"],
  ["info", "info-subtle"],
  ["node-content", "node"],
  ["node-content-muted", "node"],
  ["root-content", "root"],
  ["root-content-muted", "root"],
];

describe("테마", () => {
  it("테마 파일이 하나 이상 있다", () => {
    expect(themeFileNames.length).toBeGreaterThan(0);
  });

  describe.each(themeFileNames)("%s", (fileName) => {
    const values = getThemeValues(readCss(fileName));

    it("토큰이 참조하는 값을 모두 정의한다", () => {
      const requiredNames = [
        ...new Set(
          [
            ...`${readCss("tokens.css")}${readCss("../xy-theme.css")}`.matchAll(
              /var\((--theme-[a-z-]+)\)/g,
            ),
          ].map((match) => match[1]),
        ),
      ];

      expect(requiredNames.length).toBeGreaterThan(0);
      expect(
        requiredNames.filter((name) => values[name] === undefined),
      ).toEqual([]);
    });

    it.each(textPairs)("%s 글자가 %s 바탕에서 읽힌다", (text, background) => {
      const ratio = getContrastRatio(
        values[`--theme-${text}`],
        values[`--theme-${background}`],
      );

      expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    });
  });
});
