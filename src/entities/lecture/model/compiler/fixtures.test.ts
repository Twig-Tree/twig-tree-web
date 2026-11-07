import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { lectureScriptSchema } from "../scriptSchema";
import { compileLectureScenario } from "./compileLectureScenario";
import {
  createLectureCompilerTree,
  type LectureCompilerTreeNode,
} from "./createLectureCompilerTree";

/*
시나리오 fixture를 실제로 컴파일한다. 시나리오에는 트리가 없으므로 fixture마다 전제하는 트리를
fixtures/trees/<같은 이름>.json에 둔다. 시나리오 파일의 형식은 백엔드와 함께 쓰므로 바꾸지 않는다.
*/
const fixtureDirectory = join(import.meta.dirname, "../scenario/fixtures"); // jsdom 환경에서는 file URL을 만들 수 없어 경로로 읽는다

const readJson = (...paths: string[]): unknown =>
  JSON.parse(readFileSync(join(fixtureDirectory, ...paths), "utf8"));

const listJson = (directory: string): string[] =>
  readdirSync(join(fixtureDirectory, directory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

describe("시나리오 fixture 컴파일", () => {
  it("유효 fixture마다 같은 이름의 트리가 있다", () => {
    expect(listJson("trees")).toEqual(listJson("valid"));
  });

  it.each(listJson("valid"))(
    "%s를 경고 없이 컴파일하고 결과가 대본 스키마를 통과한다",
    (fileName) => {
      const tree = createLectureCompilerTree(
        readJson("trees", fileName) as LectureCompilerTreeNode[],
      );
      const result = compileLectureScenario(readJson("valid", fileName), {
        scriptId: fileName.replace(".json", ""),
        tree,
      });

      if (!result.success) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      expect(result.warnings).toEqual([]);
      expect(lectureScriptSchema.safeParse(result.script).success).toBe(true);
      expect({
        script: result.script,
        sourceMap: result.sourceMap,
      }).toMatchSnapshot();
    },
  );

  it.each(listJson("invalid"))(
    "%s는 기대한 위치에서 schema 단계 오류로 거부된다",
    (fileName) => {
      const { scenario, expectedIssuePaths } = readJson(
        "invalid",
        fileName,
      ) as { scenario: unknown; expectedIssuePaths: string[] };

      const result = compileLectureScenario(scenario, {
        scriptId: "invalid",
        tree: createLectureCompilerTree([]),
      });

      expect(result.success).toBe(false);
      expect(
        !result.success &&
          result.issues.map(({ stage, path }) => `${stage}:${path.join(".")}`),
      ).toEqual(expectedIssuePaths.map((path) => `schema:${path}`));
    },
  );
});
