import { describe, expect, it } from "vitest";
import { LECTURE_SCENARIO_FIXTURES } from "../scenario/fixtures";
import { lectureScenarioSchema } from "../scenario/schema";
import {
  STRICT_JSON_SCHEMA_KEYWORDS,
  getLectureScenarioStrictJsonSchema,
  getLectureScenarioWithoutNulls,
} from "./strictJsonSchema";

type JsonSchema = { [keyword: string]: unknown };

const strictSchema = getLectureScenarioStrictJsonSchema();
const defs = strictSchema.$defs as Record<string, JsonSchema>;

/*
함수 이름 : getAllSchemas
기능 : 스키마와 그 안의 모든 하위 스키마를 모은다.
인자 : JsonSchema schema -> 시작 스키마
반환값 : 하위 스키마를 포함한 목록
*/
const getAllSchemas = (schema: JsonSchema): JsonSchema[] => [
  schema,
  ...Object.values((schema.properties ?? {}) as Record<string, JsonSchema>)
    .concat(Object.values((schema.$defs ?? {}) as Record<string, JsonSchema>))
    .concat((schema.anyOf ?? []) as JsonSchema[])
    .concat(schema.items ? [schema.items as JsonSchema] : [])
    .flatMap(getAllSchemas),
];

/*
함수 이름 : getStrictValue
기능 : 시나리오를 strict 모드 응답 모양으로 옮긴다. 빠진 필드를 null로 채우며, 스키마에 맞지 않는 값을 만나면 실패한다.
타입, enum, pattern, minItems, 정의하지 않은 필드를 검사한다. strict 스키마가 쓰는 제약 키워드가 이것뿐이다.
모델이 strict 스키마대로 답했을 때의 응답을 흉내 낸다.
인자 : unknown value -> 시나리오의 한 부분
JsonSchema schema -> 그 부분의 strict 스키마
반환값 : strict 모양의 값
*/
const getStrictValue = (value: unknown, schema: JsonSchema): unknown => {
  if (typeof schema.$ref === "string") {
    return getStrictValue(value, defs[schema.$ref.replace("#/$defs/", "")]);
  }

  if (Array.isArray(schema.anyOf)) {
    const matched = (schema.anyOf as JsonSchema[]).flatMap((option) => {
      try {
        return [getStrictValue(value, option)];
      } catch {
        return [];
      }
    });

    if (matched.length !== 1)
      throw new Error("anyOf에서 한 갈래만 맞아야 합니다");
    return matched[0];
  }

  const types = [schema.type].flat();

  if (value === null) {
    if (!types.includes("null")) throw new Error("null을 받지 않습니다");
    return null;
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    throw new Error(`enum에 없는 값입니다: ${String(value)}`);
  }

  if (types.includes("array")) {
    if (!Array.isArray(value)) throw new Error("배열이 아닙니다");
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      throw new Error(`항목이 ${schema.minItems}개보다 적습니다`);
    }
    return value.map((item) =>
      getStrictValue(item, schema.items as JsonSchema),
    );
  }

  if (types.includes("object")) {
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new Error("객체가 아닙니다");
    }

    const properties = schema.properties as Record<string, JsonSchema>;
    const extraKeys = Object.keys(value).filter((key) => !(key in properties));
    if (extraKeys.length > 0)
      throw new Error(`정의하지 않은 필드: ${extraKeys}`);

    return Object.fromEntries(
      Object.entries(properties).map(([key, childSchema]) => [
        key,
        getStrictValue(
          (value as Record<string, unknown>)[key] ?? null,
          childSchema,
        ),
      ]),
    );
  }

  if (!types.includes(typeof value)) {
    throw new Error(`${types.join("|")}가 아닙니다: ${String(value)}`);
  }

  if (
    typeof schema.pattern === "string" &&
    !new RegExp(schema.pattern, "u").test(String(value))
  ) {
    throw new Error(`pattern에 맞지 않습니다: ${String(value)}`);
  }

  return value;
};

describe("getLectureScenarioStrictJsonSchema", () => {
  /*
  백엔드가 OpenAI에 넘기는 파일이다. 시나리오 스키마를 바꾸고 파일을 갱신하지 않으면 실패한다.
  갱신: pnpm exec vitest run src/entities/lecture/model/generation/strictJsonSchema.test.ts -u
  */
  it("저장소의 strict 스키마 파일과 같다", async () => {
    await expect(
      `${JSON.stringify(strictSchema, null, 2)}\n`,
    ).toMatchFileSnapshot(
      "../../../../../docs/specs/lecture-scenario.strict.schema.json",
    );
  });

  it("루트는 anyOf가 아닌 객체다", () => {
    expect(strictSchema.type).toBe("object");
    expect(strictSchema.anyOf).toBeUndefined();
  });

  it("strict 모드가 받는 키워드만 쓴다", () => {
    const keywords = new Set(getAllSchemas(strictSchema).flatMap(Object.keys));

    expect(
      [...keywords].filter(
        (keyword) =>
          !(STRICT_JSON_SCHEMA_KEYWORDS as readonly string[]).includes(keyword),
      ),
    ).toEqual([]);
  });

  it("모든 객체가 모든 필드를 required로 두고 정의하지 않은 필드를 막는다", () => {
    for (const schema of getAllSchemas(strictSchema)) {
      if (schema.type !== "object") continue;

      expect(schema.additionalProperties).toBe(false);
      expect(schema.required).toEqual(Object.keys(schema.properties as object));
    }
  });

  /*
  모델이 strict 스키마대로 답한 응답을 흉내 내고, null을 뺀 결과가 원래 시나리오로 돌아오는지 본다.
  */
  it("왕복 테스트의 검사 함수가 pattern과 minItems 위반을 거부한다", () => {
    const [{ scenario }] = LECTURE_SCENARIO_FIXTURES.filter(
      ({ kind }) => kind === "valid",
    );
    const valid = scenario as { scenes: { nodeId: string }[] };

    expect(() =>
      getStrictValue(
        { ...valid, scenes: [{ ...valid.scenes[0], nodeId: "012" }] },
        strictSchema,
      ),
    ).toThrow("pattern");
    expect(() =>
      getStrictValue({ ...valid, scenes: [] }, strictSchema),
    ).toThrow("항목이");
  });

  it("모든 valid fixture가 strict 모양으로 갔다가 그대로 돌아온다", () => {
    const validFixtures = LECTURE_SCENARIO_FIXTURES.filter(
      ({ kind }) => kind === "valid",
    );

    expect(validFixtures.length).toBeGreaterThan(0);

    for (const { id, scenario } of validFixtures) {
      const strictValue = getStrictValue(scenario, strictSchema);
      const restored = getLectureScenarioWithoutNulls(strictValue);

      expect(JSON.stringify(strictValue), id).toContain("null");
      expect(restored, id).toEqual(scenario);
      expect(lectureScenarioSchema.safeParse(restored).success, id).toBe(true);
    }
  });
});

describe("getLectureScenarioWithoutNulls", () => {
  it("객체의 null 필드를 깊이와 관계없이 뺀다", () => {
    expect(
      getLectureScenarioWithoutNulls({
        title: "제목",
        delivery: null,
        scenes: [{ roles: { subject: "1", context: null } }],
      }),
    ).toEqual({ title: "제목", scenes: [{ roles: { subject: "1" } }] });
  });

  it("배열 안의 null은 남겨 스키마 검사에서 거부되게 한다", () => {
    expect(getLectureScenarioWithoutNulls({ subject: ["1", null] })).toEqual({
      subject: ["1", null],
    });
  });

  it("객체가 아닌 값은 그대로 돌려준다", () => {
    expect(getLectureScenarioWithoutNulls(null)).toBeNull();
    expect(getLectureScenarioWithoutNulls("text")).toBe("text");
  });
});
