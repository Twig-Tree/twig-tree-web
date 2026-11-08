import { describe, expect, it } from "vitest";
import { LECTURE_EFFECT_TYPES } from "../atomicEffects";
import { scenarioCueSchema } from "../scenario/schema";
import { getLectureGenerationVocabulary } from "./vocabulary";

const vocabulary = getLectureGenerationVocabulary();

/*
함수 이름 : getAllStrings
기능 : 값 안의 모든 문자열(키 포함)을 모은다. 모델에 넘어가는 글자를 빠짐없이 검사하기 위해서다.
인자 : unknown value -> 검사할 값
반환값 : 문자열 목록
*/
const getAllStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(getAllStrings);
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => [
      key,
      ...getAllStrings(child),
    ]);
  }

  return [];
};

describe("getLectureGenerationVocabulary", () => {
  /*
  백엔드가 프롬프트를 만들 때 읽는 파일이다. 어휘를 바꾸고 파일을 갱신하지 않으면 실패한다.
  갱신: pnpm exec vitest run src/entities/lecture/model/generation/vocabulary.test.ts -u
  */
  it("저장소의 어휘 파일과 같다", async () => {
    await expect(
      `${JSON.stringify(vocabulary, null, 2)}\n`,
    ).toMatchFileSnapshot(
      "../../../../../docs/specs/lecture-generation-vocabulary.json",
    );
  });

  it("시나리오 스키마의 모든 intent를 담는다", () => {
    expect(vocabulary.intents.map(({ intent }) => intent).sort()).toEqual(
      scenarioCueSchema.def.options
        .map((option) => option.shape.intent.def.values[0])
        .sort(),
    );
  });

  it("모든 role에 설명이 있다", () => {
    for (const { intent, roles } of vocabulary.intents) {
      for (const role of roles) {
        expect(role.description, `${intent}.${role.name}`).toBeTruthy();
      }
    }
  });

  it("role의 개수와 필수 여부를 스키마에서 읽는다", () => {
    const trace = vocabulary.intents.find(({ intent }) => intent === "trace");
    const decompose = vocabulary.intents.find(
      ({ intent }) => intent === "decompose",
    );

    expect(
      trace?.roles.map(({ name, count, required }) => ({
        name,
        count,
        required,
      })),
    ).toEqual([
      { name: "source", count: "one", required: true },
      { name: "destination", count: "one", required: true },
    ]);
    expect(
      decompose?.roles.find(({ name }) => name === "children"),
    ).toMatchObject({
      count: "many",
      required: false,
    });
  });

  /*
  이슈 #137의 완료 조건: 모델 입력에 atomic 동작 목록과 시간·CSS 값이 없다.
  intent 이름과 겹치는 동작(trace)은 intent로 쓰이므로 뺀다.
  */
  it("atomic 동작 이름과 시간, CSS 값을 담지 않는다", () => {
    const intents = new Set<string>(
      vocabulary.intents.map(({ intent }) => intent),
    );
    const forbiddenWords = new Set([
      ...LECTURE_EFFECT_TYPES.filter((type) => !intents.has(type)),
      "durationMs",
      "fallbackDurationMs",
      "easing",
      "opacity",
    ]);
    const text = getAllStrings(vocabulary).join("\n");
    const words = new Set(text.match(/[A-Za-z]+/g) ?? []);

    expect([...words].filter((word) => forbiddenWords.has(word))).toEqual([]);
    expect(text).not.toMatch(/\d+\s*(ms|px)\b/);
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b|cubic-bezier|rgba?\(/);
  });
});
