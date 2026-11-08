import { getLectureScenarioJsonSchema } from "../scenario/jsonSchema";

/*
OpenAI structured output의 strict 모드(response_format json_schema, strict: true)에 넘길 스키마.
strict 모드는 JSON Schema의 일부만 받으므로, 시나리오 JSON Schema를 그 범위로 옮긴다.
https://developers.openai.com/api/docs/guides/structured-outputs 의 Supported schemas 기준(2026-11 확인)이다.

| 원래 스키마             | strict 스키마                                   |
| ----------------------- | ----------------------------------------------- |
| 선택 필드               | required에 넣고 null을 허용한다                 |
| oneOf                   | anyOf. strict 모드는 oneOf를 받지 않는다        |
| const                   | 값 하나짜리 enum. 문서에 const 지원이 없다      |
| minLength               | 뺀다. 지원 목록에 없다                          |
| $schema                 | 뺀다. 문서에 없다                               |

빠진 검사는 응답을 lectureScenarioSchema로 다시 검사할 때 잡힌다. 빈 문자열은 그때 거부된다.
*/

type JsonSchema = { [keyword: string]: unknown };

/*
strict 스키마에 남는 키워드. 시나리오 스키마에 새 키워드가 생기면 변환이 실패해, 지원 여부를 확인하고 여기에 더하게 한다.
*/
export const STRICT_JSON_SCHEMA_KEYWORDS = [
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "minItems",
  "enum",
  "pattern",
  "anyOf",
  "$ref",
  "$defs",
] as const;

const STRICT_KEYWORDS = new Set<string>(STRICT_JSON_SCHEMA_KEYWORDS);
const DROPPED_KEYWORDS = new Set(["$schema", "minLength"]);
const NULL_SCHEMA: JsonSchema = { type: "null" };

/*
함수 이름 : getNullableSchema
기능 : 선택 필드의 스키마가 null도 받게 한다. strict 모드는 모든 필드를 required로 두므로 "없음"을 null로 표현한다.
인자 : JsonSchema schema -> strict로 옮긴 필드 스키마
반환값 : null을 허용하는 필드 스키마
*/
const getNullableSchema = (schema: JsonSchema): JsonSchema => {
  if (typeof schema.type === "string") {
    return {
      ...schema,
      type: [schema.type, "null"],
      ...(Array.isArray(schema.enum) && { enum: [...schema.enum, null] }),
    };
  }

  if (Array.isArray(schema.anyOf)) {
    return { ...schema, anyOf: [...schema.anyOf, NULL_SCHEMA] };
  }

  if (typeof schema.$ref === "string") return { anyOf: [schema, NULL_SCHEMA] };

  throw new Error(
    `선택 필드를 null로 열 수 없습니다: ${JSON.stringify(schema)}`,
  );
};

/*
함수 이름 : getStrictSchema
기능 : JSON Schema 하나를 strict 모드가 받는 모양으로 옮긴다. 하위 스키마도 함께 옮긴다.
인자 : JsonSchema schema -> 시나리오 JSON Schema의 한 부분
반환값 : strict 모드용 스키마
*/
const getStrictSchema = (schema: JsonSchema): JsonSchema => {
  const strictSchema: JsonSchema = {};

  for (const [keyword, value] of Object.entries(schema)) {
    if (DROPPED_KEYWORDS.has(keyword)) continue;

    if (keyword === "const") {
      strictSchema.enum = [value];
      continue;
    }

    if (keyword === "oneOf" || keyword === "anyOf") {
      strictSchema.anyOf = (value as JsonSchema[]).map(getStrictSchema);
      continue;
    }

    if (keyword === "properties" || keyword === "$defs") {
      strictSchema[keyword] = Object.fromEntries(
        Object.entries(value as Record<string, JsonSchema>).map(
          ([name, child]) => [name, getStrictSchema(child)],
        ),
      );
      continue;
    }

    if (keyword === "items") {
      strictSchema.items = getStrictSchema(value as JsonSchema);
      continue;
    }

    if (!STRICT_KEYWORDS.has(keyword)) {
      throw new Error(
        `strict 모드 지원 여부를 확인하지 않은 키워드입니다: ${keyword}`,
      );
    }

    strictSchema[keyword] = value;
  }

  if (strictSchema.type !== "object") return strictSchema;

  /*
  strict 모드는 모든 필드를 required로 요구한다. 원래 선택이던 필드는 null을 받게 해 "없음"을 표현한다.
  */
  const properties = (strictSchema.properties ?? {}) as Record<
    string,
    JsonSchema
  >;
  const required = new Set((schema.required ?? []) as string[]);

  return {
    ...strictSchema,
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, child]) => [
        name,
        required.has(name) ? child : getNullableSchema(child),
      ]),
    ),
    required: Object.keys(properties),
    additionalProperties: false,
  };
};

/*
함수 이름 : getLectureScenarioStrictJsonSchema
기능 : 시나리오 JSON Schema를 OpenAI strict 모드에 넘길 스키마로 옮긴다.
이 스키마를 통과한 응답은 getLectureScenarioWithoutNulls로 null을 뺀 뒤 lectureScenarioSchema로 다시 검사한다.
인자 : 없음
반환값 : strict 모드용 시나리오 JSON Schema
*/
export const getLectureScenarioStrictJsonSchema = (): JsonSchema =>
  getStrictSchema(getLectureScenarioJsonSchema() as unknown as JsonSchema);

/*
함수 이름 : getLectureScenarioWithoutNulls
기능 : strict 모드 응답에서 값이 null인 필드를 뺀다. strict 스키마가 "없음"을 null로 받으므로, 시나리오 계약의 빠진 필드로 되돌린다.
시나리오에는 null을 받는 필드가 없어 객체의 null 필드는 모두 뺀다. 배열 안의 null은 그대로 두어 스키마 검사에서 거부되게 한다.
인자 : unknown value -> JSON으로 읽은 모델 응답
반환값 : null 필드를 뺀 값. 객체와 배열이 아니면 그대로 돌려준다
*/
export const getLectureScenarioWithoutNulls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(getLectureScenarioWithoutNulls);
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      child === null ? [] : [[key, getLectureScenarioWithoutNulls(child)]],
    ),
  );
};
