import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { lectureScriptSchema } from "../scriptSchema";
import { SUPPORTED_RECIPE_REGISTRY_VERSIONS } from "../scenario/schema";
import { compileLectureScenario } from "./compileLectureScenario";
import {
  createLectureCompilerTree,
  type LectureCompilerTreeNode,
} from "./createLectureCompilerTree";

/*
과거에 만든 강의를 대신하는 동결 fixture. 시나리오와 트리는 고치지 않고, 지금 컴파일러가 같은 대본을 만드는지 본다.
배포된 recipe 버전의 script.json은 -u로 갱신하지 않는다. 규칙은 docs/specs/lecture-versioning.md에 있다.
*/
const legacyDirectory = join(import.meta.dirname, "legacy"); // jsdom 환경에서는 file URL을 만들 수 없어 경로로 읽는다

const readJson = (...paths: string[]): unknown =>
  JSON.parse(readFileSync(join(legacyDirectory, ...paths), "utf8"));

const listDirectories = (...paths: string[]): string[] =>
  readdirSync(join(legacyDirectory, ...paths), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const legacyCases = listDirectories().flatMap((versionDirectory) =>
  listDirectories(versionDirectory).map(
    (name) => [versionDirectory, name] as const,
  ),
);

describe("동결 fixture 호환", () => {
  it("버전 디렉터리는 지원하는 recipe 버전만 가리킨다", () => {
    expect(listDirectories()).toEqual(
      SUPPORTED_RECIPE_REGISTRY_VERSIONS.map((version) => `recipe-v${version}`),
    );
  });

  it.each(legacyCases)(
    "%s/%s를 지금 컴파일러로 컴파일해도 같은 대본이 나온다",
    async (versionDirectory, name) => {
      const scenario = readJson(versionDirectory, name, "scenario.json");

      expect(scenario).toMatchObject({
        recipeRegistryVersion: Number(versionDirectory.replace("recipe-v", "")),
      });

      const result = compileLectureScenario(scenario, {
        scriptId: name,
        tree: createLectureCompilerTree(
          readJson(
            versionDirectory,
            name,
            "tree.json",
          ) as LectureCompilerTreeNode[],
        ),
      });

      if (!result.success) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      expect(lectureScriptSchema.safeParse(result.script).success).toBe(true);
      await expect(
        `${JSON.stringify(result.script, null, 2)}\n`,
      ).toMatchFileSnapshot(
        join(legacyDirectory, versionDirectory, name, "script.json"),
      );
    },
  );
});
