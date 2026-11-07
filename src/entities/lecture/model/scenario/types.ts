import type * as z from "zod/mini";
import type {
  lectureScenarioSchema,
  scenarioBeatSchema,
  scenarioCueSchema,
  scenarioDeliverySchema,
  scenarioNarrationSchema,
  scenarioSceneSchema,
} from "./schema";

/*
시나리오 타입은 스키마에서 추출한다. 스키마가 계약의 단일 원본이라 타입을 따로 쓰지 않는다.
*/
export type LectureScenario = z.infer<typeof lectureScenarioSchema>;
export type ScenarioScene = z.infer<typeof scenarioSceneSchema>;
export type ScenarioBeat = z.infer<typeof scenarioBeatSchema>;
export type ScenarioNarration = z.infer<typeof scenarioNarrationSchema>;
export type ScenarioCue = z.infer<typeof scenarioCueSchema>;
export type ScenarioDelivery = z.infer<typeof scenarioDeliverySchema>;
export type SemanticIntent = ScenarioCue["intent"];
