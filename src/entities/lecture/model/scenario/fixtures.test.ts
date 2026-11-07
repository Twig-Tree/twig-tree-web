import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  lectureScenarioSchema,
  type SemanticIntent,
} from "@/src/entities/lecture";

/*
fixture는 JSON 파일이라 백엔드도 같은 파일로 자기 검증을 확인할 수 있다.
무효 fixture는 거부될 위치(expectedIssuePaths)를 함께 담아, 다른 이유로 거부되어 통과하는 것을 막는다.
*/
const fixtureDirectory = join(import.meta.dirname, "fixtures"); // jsdom 환경에서는 file URL을 만들 수 없어 경로로 읽는다

const readFixtures = (kind: "valid" | "invalid") =>
  readdirSync(join(fixtureDirectory, kind))
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => ({
      fileName,
      content: JSON.parse(
        readFileSync(join(fixtureDirectory, kind, fileName), "utf8"),
      ) as unknown,
    }));

const validFixtures = readFixtures("valid");
const invalidFixtures = readFixtures("invalid") as {
  fileName: string;
  content: {
    description: string;
    expectedIssuePaths: string[];
    scenario: unknown;
  };
}[];

/*
Record로 두어 intent를 추가하면 여기서 타입 오류가 나고, 아래 테스트가 유효 fixture에 그 intent가 있는지 확인하게 된다.
*/
const INTENT_SET: Record<SemanticIntent, true> = {
  introduce: true,
  emphasize: true,
  compare: true,
  decompose: true,
  trace: true,
  reveal: true,
  warn: true,
  correct: true,
  incorrect: true,
  transition: true,
  recap: true,
  summarize: true,
};
const ALL_INTENTS = Object.keys(INTENT_SET);

describe("강의 시나리오 fixture", () => {
  it("대표 강의 시나리오가 5개 이상이고 모든 intent를 한 번 이상 쓴다", () => {
    const usedIntents = new Set(
      validFixtures.flatMap(({ content }) =>
        lectureScenarioSchema
          .parse(content)
          .scenes.flatMap((scene) =>
            scene.beats.flatMap((beat) => beat.cues.map((cue) => cue.intent)),
          ),
      ),
    );

    expect(validFixtures.length).toBeGreaterThanOrEqual(5);
    expect([...usedIntents].sort()).toEqual([...ALL_INTENTS].sort());
  });

  it.each(validFixtures)("$fileName을 통과시킨다", ({ content }) => {
    const result = lectureScenarioSchema.safeParse(content);

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(invalidFixtures)("$fileName: $content.description", ({ content }) => {
    const result = lectureScenarioSchema.safeParse(content.scenario);

    expect(
      result.error?.issues.map((issue) => issue.path.join(".")) ?? [],
    ).toEqual(content.expectedIssuePaths);
  });
});
