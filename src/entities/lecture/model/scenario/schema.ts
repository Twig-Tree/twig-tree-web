import * as z from "zod/mini";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";
import {
  getRepeatedRoleNodePaths,
  getRepeatedScenarioIdPaths,
} from "./scenarioChecks";

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

const nodeIdListSchema = z.array(nodeIdSchema).check(z.minLength(1));

/*
role의 개수 규칙은 모양으로 표현한다.
- 정확히 하나: 노드 ID 문자열
- 하나 이상: 비어 있지 않은 배열
- 선택: optional. 없으면 0개이므로, 주어진 배열은 비어 있으면 안 된다.
*/
const one = nodeIdSchema;
const many = nodeIdListSchema;
const optionalMany = z.optional(nodeIdListSchema);
const optionalOne = z.optional(nodeIdSchema);

/*
함수 이름 : createCueSchema
기능 : intent 하나와 그 intent가 받는 role 모양으로 cue 스키마를 만든다. 정의하지 않은 role은 strict 검사로 거부된다.
인자 : Intent intent -> cue의 intent 값
Roles roles -> role 이름별 개수 규칙
반환값 : intent를 판별값으로 갖는 cue 스키마
*/
const createCueSchema = <
  Intent extends string,
  Roles extends Record<string, z.ZodMiniType>,
>(
  intent: Intent,
  roles: Roles,
) =>
  z.strictObject({
    intent: z.literal(intent),
    roles: z.strictObject(roles).check(
      z.superRefine((value, context) => {
        const repeatedPaths = getRepeatedRoleNodePaths(
          value as Record<string, string | string[] | undefined>,
        );

        for (const path of repeatedPaths) {
          context.addIssue({
            code: "custom",
            message: "한 cue에서 같은 노드를 두 번 쓸 수 없습니다.",
            path,
          });
        }
      }),
    ),
    delivery: z.optional(scenarioDeliverySchema),
  });

/*
cue는 intent 값으로 갈라지는 discriminatedUnion이다. intent마다 받는 role이 달라,
잘못된 조합이 "어느 intent의 어느 role이 틀렸는지"로 보고된다.
role 사이의 관계(겹침, 출발과 도착이 같음)는 모양으로 표현할 수 없어 roles에 검사를 붙인다.
*/
export const scenarioCueSchema = z.discriminatedUnion("intent", [
  createCueSchema("introduce", { subject: one, context: optionalMany }),
  createCueSchema("emphasize", { subject: many }),
  createCueSchema("compare", { left: many, right: many }),
  createCueSchema("decompose", { parent: one, children: optionalMany }), // children이 없으면 parent의 모든 자식
  createCueSchema("trace", { source: one, destination: one }), // 경로는 서비스가 트리에서 찾는다
  createCueSchema("reveal", { subject: many }),
  createCueSchema("warn", { subject: many }),
  createCueSchema("correct", {
    correctAnswer: many,
    incorrectAnswer: optionalMany,
  }),
  createCueSchema("incorrect", {
    incorrectAnswer: many,
    correctAnswer: optionalMany,
  }),
  createCueSchema("transition", { destination: one, source: optionalOne }),
  createCueSchema("recap", { subject: many }),
  createCueSchema("summarize", { subject: one, context: optionalMany }),
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

export const lectureScenarioSchema = z
  .strictObject({
    scenarioSchemaVersion: z.literal(LECTURE_SCENARIO_SCHEMA_VERSION),
    recipeRegistryVersion: z.int().check(z.positive()), // 지원 범위는 버전 정책 단계에서 정한다
    title: z.string().check(z.minLength(1)),
    scenes: z.array(scenarioSceneSchema).check(z.minLength(1)),
  })
  .check(
    z.superRefine((scenario, context) => {
      for (const path of getRepeatedScenarioIdPaths(scenario)) {
        context.addIssue({
          code: "custom",
          message: "scene ID와 beat ID는 시나리오 안에서 고유해야 합니다.",
          path,
        });
      }
    }),
  );
