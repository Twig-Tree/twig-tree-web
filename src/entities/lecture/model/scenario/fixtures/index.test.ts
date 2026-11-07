import { readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { LECTURE_SCENARIO_FIXTURES } from ".";

const listNames = (directory: string): string[] =>
  readdirSync(join(import.meta.dirname, directory))
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => `${directory}/${fileName.replace(".json", "")}`)
    .sort();

describe("LECTURE_SCENARIO_FIXTURES", () => {
  it("valid와 invalid 디렉터리의 fixture를 모두 담는다", () => {
    expect(LECTURE_SCENARIO_FIXTURES.map(({ id }) => id).sort()).toEqual(
      [...listNames("valid"), ...listNames("invalid")].sort(),
    );
  });

  it("모든 fixture가 트리를 갖는다", () => {
    for (const fixture of LECTURE_SCENARIO_FIXTURES) {
      expect(fixture.tree.length).toBeGreaterThan(0);
    }
  });
});
