import {
  LECTURE_SCENARIO_SCHEMA_VERSION,
  SUPPORTED_RECIPE_REGISTRY_VERSIONS,
} from "../scenario/schema";
import { getLectureScenarioJsonSchema } from "../scenario/jsonSchema";
import {
  type ScenarioCue,
  type ScenarioDelivery,
  type SemanticIntent,
} from "../scenario/types";

/*
외부 모델에 넘기는 어휘. 모델은 이 어휘로 "무엇을 가르칠지"만 고르고, 동작·시간·색은 서비스가 정한다.
그래서 여기에는 atomic 동작 이름, 시간, CSS 값을 넣지 않는다(lecture-generation.md, vocabulary.test.ts).
role의 개수와 필수 여부는 손으로 적지 않고 JSON Schema에서 읽어, 스키마와 어긋나지 않게 한다.
*/

type IntentDescription<Intent extends SemanticIntent> = {
  meaning: string; // 이 intent를 고를 때
  roles: Record<
    keyof Extract<ScenarioCue, { intent: Intent }>["roles"],
    string
  >; // role마다 어떤 노드를 넣는지
};

const INTENT_DESCRIPTIONS: {
  [Intent in SemanticIntent]: IntentDescription<Intent>;
} = {
  introduce: {
    meaning: "새 개념을 처음 소개한다.",
    roles: {
      subject: "소개할 노드",
      context: "함께 보여 줄 주변 노드",
    },
  },
  emphasize: {
    meaning: "이미 나온 개념 중 지금 말하는 것을 강조한다.",
    roles: { subject: "강조할 노드" },
  },
  compare: {
    meaning: "두 쪽을 나란히 놓고 비교한다.",
    roles: { left: "비교의 한쪽 노드", right: "비교의 다른 쪽 노드" },
  },
  decompose: {
    meaning: "한 개념을 하위 요소로 나눠 보여 준다.",
    roles: {
      parent: "나눌 노드",
      children: "보여 줄 자식 노드. 생략하면 모든 자식",
    },
  },
  trace: {
    meaning: "한 노드에서 다른 노드까지 이어지는 흐름을 따라간다.",
    roles: {
      source: "출발 노드. destination의 조상이거나 자손이어야 한다",
      destination: "도착 노드",
    },
  },
  reveal: {
    meaning: "아직 보이지 않던 노드를 드러낸다.",
    roles: { subject: "드러낼 노드" },
  },
  warn: {
    meaning: "흔히 틀리거나 조심해야 할 점을 짚는다.",
    roles: { subject: "주의할 노드" },
  },
  correct: {
    meaning: "정답을 확인한다.",
    roles: {
      correctAnswer: "정답 노드",
      incorrectAnswer: "함께 보여 줄 오답 노드",
    },
  },
  incorrect: {
    meaning: "오답을 짚는다.",
    roles: {
      incorrectAnswer: "오답 노드",
      correctAnswer: "함께 보여 줄 정답 노드",
    },
  },
  transition: {
    meaning: "다른 주제로 넘어간다.",
    roles: {
      destination: "넘어갈 노드",
      source: "떠나는 노드",
    },
  },
  recap: {
    meaning: "앞에서 다룬 내용을 다시 짚는다.",
    roles: { subject: "다시 짚을 노드" },
  },
  summarize: {
    meaning: "여러 내용을 하나로 정리한다.",
    roles: {
      subject: "정리의 중심 노드",
      context: "정리에 포함할 노드",
    },
  },
};

const DELIVERY_DESCRIPTIONS: {
  [Field in keyof ScenarioDelivery]-?: {
    meaning: string;
    values: Record<NonNullable<ScenarioDelivery[Field]>, string>;
  };
} = {
  pace: {
    meaning: "빠르기",
    values: { slow: "천천히", normal: "보통", quick: "빠르게" },
  },
  intensity: {
    meaning: "세기",
    values: { subtle: "약하게", medium: "보통", strong: "강하게" },
  },
  tone: {
    meaning: "분위기",
    values: {
      neutral: "중립",
      accent: "강조",
      positive: "긍정, 정답",
      warning: "주의",
      danger: "위험, 오답",
    },
  },
  continuity: {
    meaning: "효과를 얼마나 남길지",
    values: {
      transient: "이 비트 안에서만",
      persist: "같은 장면의 다음 비트까지",
    },
  },
};

/*
JSON Schema로 표현할 수 없거나, 모델이 자주 틀려 따로 알려야 하는 규칙.
*/
const GENERATION_RULES = [
  "노드는 트리 outline의 대괄호 안 ID 문자열로 가리킨다. outline에 없는 ID는 쓰지 않는다.",
  "장면(scene)은 nodeId의 노드를 중심으로 설명한다. 비트(beat)는 내레이션 한두 문장과 그때 일어날 cue로 이뤄진다.",
  "scene ID와 beat ID는 시나리오 전체에서 서로 겹치지 않는다.",
  "한 cue 안에서 같은 노드를 두 role에 쓰지 않는다. 한 role 안에서도 같은 노드를 두 번 쓰지 않는다.",
  "선택 role과 delivery는 필요할 때만 쓴다. 빠진 값은 서비스가 intent에 맞게 채운다.",
  "화면 효과의 종류, 시간, 색은 정하지 않는다. 서비스가 intent와 delivery로 정한다.",
] as const;

export type LectureGenerationRole = {
  name: string;
  count: "one" | "many"; // one은 노드 ID 문자열, many는 비어 있지 않은 노드 ID 배열
  required: boolean;
  description: string;
};

export type LectureGenerationIntent = {
  intent: SemanticIntent;
  meaning: string;
  roles: LectureGenerationRole[];
};

export type LectureGenerationVocabulary = {
  scenarioSchemaVersion: number;
  recipeRegistryVersions: number[]; // 시나리오의 recipeRegistryVersion에 쓸 수 있는 값
  intents: LectureGenerationIntent[];
  delivery: {
    field: keyof ScenarioDelivery;
    meaning: string;
    values: { value: string; meaning: string }[];
  }[];
  rules: string[];
};

type JsonSchemaNode = {
  $ref?: string;
  const?: unknown;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  oneOf?: JsonSchemaNode[];
};

/*
함수 이름 : getRoleCount
기능 : JSON Schema의 role 정의가 노드 하나인지 하나 이상인지 읽는다.
인자 : JsonSchemaNode role -> role의 JSON Schema
반환값 : one 또는 many
*/
const getRoleCount = (role: JsonSchemaNode): "one" | "many" => {
  if (role.$ref === "#/$defs/NodeId") return "one";
  if (role.$ref === "#/$defs/NodeIdList") return "many";

  throw new Error(
    `role의 JSON Schema를 읽지 못했습니다: ${JSON.stringify(role)}`,
  );
};

/*
함수 이름 : getLectureGenerationVocabulary
기능 : 외부 모델에 넘길 intent, role, delivery 어휘와 규칙을 만든다.
role의 개수와 필수 여부는 JSON Schema의 Cue 정의에서 읽고, 설명만 이 파일에서 붙인다.
인자 : 없음
반환값 : 버전, intent별 뜻과 role, delivery 값, 규칙
*/
export const getLectureGenerationVocabulary =
  (): LectureGenerationVocabulary => {
    const jsonSchema = getLectureScenarioJsonSchema() as unknown as {
      $defs: { Cue: JsonSchemaNode };
    };
    const cueSchemas = jsonSchema.$defs.Cue.oneOf ?? [];

    const intents = cueSchemas.map((cueSchema): LectureGenerationIntent => {
      const intent = cueSchema.properties?.intent?.const as SemanticIntent;
      const rolesSchema = cueSchema.properties?.roles;
      const required = new Set(rolesSchema?.required ?? []);
      const description = INTENT_DESCRIPTIONS[intent];
      const roleDescriptions: Record<string, string> = description.roles;

      return {
        intent,
        meaning: description.meaning,
        roles: Object.entries(rolesSchema?.properties ?? {}).map(
          ([name, roleSchema]) => ({
            name,
            count: getRoleCount(roleSchema),
            required: required.has(name),
            description: roleDescriptions[name],
          }),
        ),
      };
    });

    return {
      scenarioSchemaVersion: LECTURE_SCENARIO_SCHEMA_VERSION,
      recipeRegistryVersions: [...SUPPORTED_RECIPE_REGISTRY_VERSIONS],
      intents,
      delivery: (
        Object.entries(DELIVERY_DESCRIPTIONS) as [
          keyof ScenarioDelivery,
          { meaning: string; values: Record<string, string> },
        ][]
      ).map(([field, { meaning, values }]) => ({
        field,
        meaning,
        values: Object.entries(values).map(([value, valueMeaning]) => ({
          value,
          meaning: valueMeaning,
        })),
      })),
      rules: [...GENERATION_RULES],
    };
  };
