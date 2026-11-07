import * as z from "zod/mini";
import {
  lectureScenarioSchema,
  nodeIdListSchema,
  nodeIdSchema,
  scenarioBeatSchema,
  scenarioCueSchema,
  scenarioDeliverySchema,
  scenarioSceneSchema,
} from "./schema";

/*
JSON Schema에서 $defs로 뽑을 스키마의 이름. 이름이 없으면 같은 스키마가 intent마다 펼쳐져 길어진다.
reused: "ref"로 재사용을 모두 뽑으면 __schema0 같은 이름이 붙어 백엔드와 모델이 읽기 어려워, 이름을 붙인 것만 뽑는다.
전역 registry에 넣지 않고 이 파일 안에서만 쓴다.
*/
const scenarioJsonSchemaIds = z.registry<{ id: string }>();

scenarioJsonSchemaIds.add(nodeIdSchema, { id: "NodeId" });
scenarioJsonSchemaIds.add(nodeIdListSchema, { id: "NodeIdList" });
scenarioJsonSchemaIds.add(scenarioDeliverySchema, { id: "Delivery" });
scenarioJsonSchemaIds.add(scenarioCueSchema, { id: "Cue" });
scenarioJsonSchemaIds.add(scenarioBeatSchema, { id: "Beat" });
scenarioJsonSchemaIds.add(scenarioSceneSchema, { id: "Scene" });

/*
함수 이름 : getLectureScenarioJsonSchema
기능 : 시나리오 스키마를 백엔드와 외부 모델에 넘길 JSON Schema(draft 2020-12)로 바꾼다.
노드 중복과 ID 중복 검사는 JSON Schema로 표현할 수 없어 빠지므로, 모델 출력은 이 스키마를 통과해도 lectureScenarioSchema로 다시 검사한다.
인자 : 없음
반환값 : 시나리오 JSON Schema 객체
*/
export const getLectureScenarioJsonSchema = () =>
  z.toJSONSchema(lectureScenarioSchema, { metadata: scenarioJsonSchemaIds });
