import { type LectureCompileIssue } from "../compiler/types";
import { type LectureScenario, type ScenarioDelivery } from "../scenario/types";

export type LectureDeliveryField = keyof ScenarioDelivery;

/*
Record로 두어 delivery에 필드가 늘고 여기서 빠뜨리면 타입 오류가 난다.
*/
const DELIVERY_FIELDS = Object.keys({
  pace: true,
  intensity: true,
  tone: true,
  continuity: true,
} satisfies Record<LectureDeliveryField, true>) as LectureDeliveryField[];

/*
컴파일 한 번의 측정값. 스키마를 통과하지 못하면 cue를 믿을 수 없어 cue 단위 값은 null이다.

- fallback: 모델이 delivery 필드를 하나라도 비워 intent 기본값을 쓴 cue. 컴파일러는 recipe를 대신 고르지 않으므로 기본값을 채우는 곳은 delivery뿐이다.
- 잘못된 role: roles 아래에 node(트리에 없는 노드)나 recipe(트리와 맞지 않는 관계) 문제가 하나라도 있는 cue.
*/
export type LectureCompileMetrics = {
  compileMs: number; // 컴파일에 걸린 시간
  cueCount: number | null;
  defaultDeliveryCueCount: number | null; // fallback cue 수
  defaultDeliveryFieldCounts: Record<LectureDeliveryField, number> | null; // 필드별로 기본값을 쓴 cue 수
  invalidRoleCueCount: number | null;
  fallbackRate: number | null; // defaultDeliveryCueCount / cueCount. cue가 없으면 null
  invalidRoleRate: number | null; // invalidRoleCueCount / cueCount. cue가 없으면 null
};

type GetLectureCompileMetricsParams = {
  scenario: LectureScenario | null; // 스키마를 통과한 시나리오. 통과하지 못했으면 null
  issues: LectureCompileIssue[]; // 컴파일 문제. 성공했으면 warning만 있다
  compileMs: number; // 컴파일에 걸린 시간
};

/*
함수 이름 : getInvalidRoleCueKey
기능 : 문제 위치가 cue의 roles 아래이면 그 cue를 가리키는 키를 만든다.
인자 : PropertyKey[] path -> 시나리오 안의 위치
반환값 : "장면-비트-cue" 키. roles 아래가 아니면 null
*/
const getInvalidRoleCueKey = (path: PropertyKey[]): string | null => {
  const [scenes, sceneIndex, beats, beatIndex, cues, cueIndex, roles] = path;

  if (scenes !== "scenes" || beats !== "beats" || cues !== "cues") return null;
  if (roles !== "roles") return null;

  return `${String(sceneIndex)}-${String(beatIndex)}-${String(cueIndex)}`;
};

const getRate = (count: number, total: number): number | null =>
  total === 0 ? null : count / total;

/*
함수 이름 : getLectureCompileMetrics
기능 : 컴파일 결과로 컴파일 시간, fallback 비율, 잘못된 role 비율을 구한다.
인자 : GetLectureCompileMetricsParams
반환값 : 컴파일 측정값
*/
export const getLectureCompileMetrics = ({
  scenario,
  issues,
  compileMs,
}: GetLectureCompileMetricsParams): LectureCompileMetrics => {
  if (scenario === null) {
    return {
      compileMs,
      cueCount: null,
      defaultDeliveryCueCount: null,
      defaultDeliveryFieldCounts: null,
      invalidRoleCueCount: null,
      fallbackRate: null,
      invalidRoleRate: null,
    };
  }

  const cues = scenario.scenes.flatMap((scene) =>
    scene.beats.flatMap((beat) => beat.cues),
  );
  const defaultDeliveryFieldCounts = Object.fromEntries(
    DELIVERY_FIELDS.map((field) => [
      field,
      cues.filter((cue) => cue.delivery?.[field] === undefined).length,
    ]),
  ) as Record<LectureDeliveryField, number>;
  const defaultDeliveryCueCount = cues.filter((cue) =>
    DELIVERY_FIELDS.some((field) => cue.delivery?.[field] === undefined),
  ).length;
  const invalidRoleCueCount = new Set(
    issues
      .filter(({ stage }) => stage === "node" || stage === "recipe")
      .map(({ path }) => getInvalidRoleCueKey(path))
      .filter((key) => key !== null),
  ).size;

  return {
    compileMs,
    cueCount: cues.length,
    defaultDeliveryCueCount,
    defaultDeliveryFieldCounts,
    invalidRoleCueCount,
    fallbackRate: getRate(defaultDeliveryCueCount, cues.length),
    invalidRoleRate: getRate(invalidRoleCueCount, cues.length),
  };
};
