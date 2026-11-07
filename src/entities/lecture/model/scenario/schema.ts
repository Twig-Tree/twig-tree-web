import * as z from "zod/mini";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";

/*
외부 모델이 생성하는 강의 시나리오의 계약.
모델은 교육적 의도(intent), 노드의 역할(role), 전달 방식(delivery)만 고르고,
atomic 동작과 시간은 서비스의 컴파일러가 정한다. 그래서 이 계약에는 durationMs가 없다.
*/

export const LECTURE_SCENARIO_SCHEMA_VERSION = 1;

/*
서버 노드 ID 문자열. pattern은 JSON Schema로도 나가 모델에게 형식을 알려 주고,
안전 정수 범위는 JSON Schema로 표현할 수 없어 isValidApiId로 한 번 더 검사한다.
*/
const nodeIdSchema = z
  .string()
  .check(
    z.regex(/^[1-9]\d*$/),
    z.refine(isValidApiId, { message: "서버 노드 ID 형식이 아닙니다." }),
  );

/*
delivery는 모두 선택값이다. 빠진 값의 기본값은 intent마다 다를 수 있어(tone 등) 스키마가 아니라 컴파일러가 채운다.
*/
export const scenarioDeliverySchema = z.strictObject({
  pace: z.optional(z.enum(["slow", "normal", "quick"])),
  intensity: z.optional(z.enum(["subtle", "medium", "strong"])),
  tone: z.optional(
    z.enum(["neutral", "accent", "positive", "warning", "danger"]),
  ),
  continuity: z.optional(z.enum(["transient", "persist"])), // persist면 같은 장면의 다음 비트까지 효과를 남긴다
});

/*
cue는 intent 값으로 갈라지는 discriminatedUnion이다. intent마다 받는 role이 달라,
잘못된 조합이 "어느 intent의 어느 role이 틀렸는지"로 보고된다.
*/
const introduceCueSchema = z.strictObject({
  intent: z.literal("introduce"),
  roles: z.strictObject({
    subject: nodeIdSchema,
    context: z.optional(z.array(nodeIdSchema)),
  }),
  delivery: z.optional(scenarioDeliverySchema),
});

export const scenarioCueSchema = z.discriminatedUnion("intent", [
  introduceCueSchema,
]);

/*
내레이션 시간은 서비스가 글자 수로 계산하므로 모델은 문장만 낸다.
*/
export const scenarioNarrationSchema = z.strictObject({
  text: z.string().check(z.minLength(1)),
});

/*
비트의 cue는 순서대로 실행한다. cue가 없으면 내레이션만 나오는 비트다.
*/
export const scenarioBeatSchema = z.strictObject({
  id: z.string().check(z.minLength(1)),
  narration: scenarioNarrationSchema,
  cues: z.array(scenarioCueSchema),
});

export const scenarioSceneSchema = z.strictObject({
  id: z.string().check(z.minLength(1)),
  nodeId: nodeIdSchema, // 장면이 설명하는 중심 노드
  beats: z.array(scenarioBeatSchema).check(z.minLength(1)),
});

export const lectureScenarioSchema = z.strictObject({
  scenarioSchemaVersion: z.literal(LECTURE_SCENARIO_SCHEMA_VERSION),
  recipeRegistryVersion: z.int().check(z.positive()), // 지원 범위는 버전 정책 단계에서 정한다
  title: z.string().check(z.minLength(1)),
  scenes: z.array(scenarioSceneSchema).check(z.minLength(1)),
});
