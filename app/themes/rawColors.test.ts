import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");
const SCANNED_DIRECTORIES = ["app", "src"];
const SCANNED_EXTENSIONS = [".ts", ".tsx", ".css"];

/*
Lab은 여러 테마를 비교하는 실험실이라 자기 색을 직접 가진다. 테마 파일은 색 값을 정의하는 곳이다.
*/
const EXCLUDED_PATHS = ["src/widgets/workspace-lab/", "app/themes/"];

const PALETTE_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITIES =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|divide|placeholder|shadow|accent|caret|decoration";

const RAW_COLOR_CLASS = new RegExp(
  `(?<![\\w-])(?:${COLOR_UTILITIES})(?:-[a-z]{1,2})?-(?:(?:${PALETTE_NAMES})-\\d{2,3}|white|black)(?![\\w-])`,
  "g",
);
const RAW_CSS_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/g;

/*
함수 이름 : getSourceFiles
기능 : 검사 대상 디렉터리에서 테스트와 제외 경로를 뺀 소스 파일을 찾는다.
인자 : 없음
반환값 : 프로젝트 루트 기준 상대 경로 목록
*/
const getSourceFiles = () =>
  SCANNED_DIRECTORIES.flatMap(
    (directory) =>
      readdirSync(path.join(projectRoot, directory), {
        recursive: true,
        encoding: "utf8",
      }).map(
        (filePath) => `${directory}/${filePath.replaceAll(path.sep, "/")}`,
      ), // Windows의 구분자도 제외 경로와 비교할 수 있게 맞춘다.
  ).filter(
    (filePath) =>
      SCANNED_EXTENSIONS.includes(path.extname(filePath)) &&
      !filePath.includes(".test.") &&
      !EXCLUDED_PATHS.some((excluded) => filePath.startsWith(excluded)),
  );

/*
함수 이름 : getRawColorClasses
기능 : 문자열에서 테마 토큰을 거치지 않는 Tailwind 기본 색 클래스를 찾는다.
인자 : string source -> 검사할 문자열
반환값 : 찾은 클래스 목록
*/
const getRawColorClasses = (source: string) =>
  source.match(RAW_COLOR_CLASS) ?? [];

describe("테마 토큰 사용", () => {
  it("기본 색 클래스를 찾아낸다", () => {
    expect(
      getRawColorClasses(
        'className="bg-slate-100 hover:text-white border-t-red-400 ring-indigo-500/50"',
      ),
    ).toEqual([
      "bg-slate-100",
      "text-white",
      "border-t-red-400",
      "ring-indigo-500",
    ]);
  });

  it("토큰 클래스와 다른 유틸리티는 걸리지 않는다", () => {
    expect(
      getRawColorClasses(
        'className="bg-surface text-content border-accent/50 text-sm whitespace-nowrap"',
      ),
    ).toEqual([]);
  });

  it("검사할 파일을 찾는다", () => {
    const sourceFiles = getSourceFiles();

    expect(sourceFiles).toContain("app/xy-theme.css");
    expect(sourceFiles).toContain("src/features/tree-editor/ui/CustomNode.tsx");
  });

  it("제품 코드는 Tailwind 기본 색 클래스를 쓰지 않는다", () => {
    const violations = getSourceFiles().flatMap((filePath) =>
      getRawColorClasses(
        readFileSync(path.join(projectRoot, filePath), "utf8"),
      ).map((colorClass) => `${filePath}: ${colorClass}`),
    );

    expect(violations).toEqual([]);
  });

  it("제품 CSS는 색 값을 직접 쓰지 않는다", () => {
    const violations = getSourceFiles()
      .filter((filePath) => filePath.endsWith(".css"))
      .flatMap((filePath) =>
        (
          readFileSync(path.join(projectRoot, filePath), "utf8").match(
            RAW_CSS_COLOR,
          ) ?? []
        ).map((color) => `${filePath}: ${color}`),
      );

    expect(violations).toEqual([]);
  });
});
