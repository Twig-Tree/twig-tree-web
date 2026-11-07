import goguryeoMisconceptionsScenario from "./valid/goguryeo-misconceptions.json";
import httpRequestFlowScenario from "./valid/http-request-flow.json";
import mammalVsReptileScenario from "./valid/mammal-vs-reptile.json";
import photosynthesisSummaryScenario from "./valid/photosynthesis-summary.json";
import worldGeographyScenario from "./valid/world-geography.json";
import atomicActionInvalid from "./invalid/atomic-action.json";
import duplicateBeatIdInvalid from "./invalid/duplicate-beat-id.json";
import durationFieldInvalid from "./invalid/duration-field.json";
import emptyRoleInvalid from "./invalid/empty-role.json";
import invalidDeliveryInvalid from "./invalid/invalid-delivery.json";
import invalidNodeIdInvalid from "./invalid/invalid-node-id.json";
import missingRoleInvalid from "./invalid/missing-role.json";
import overlappingRolesInvalid from "./invalid/overlapping-roles.json";
import roleCardinalityInvalid from "./invalid/role-cardinality.json";
import roleFromOtherIntentInvalid from "./invalid/role-from-other-intent.json";
import unknownIntentInvalid from "./invalid/unknown-intent.json";
import unknownSchemaVersionInvalid from "./invalid/unknown-schema-version.json";
import unsupportedRecipeVersionInvalid from "./invalid/unsupported-recipe-version.json";
import goguryeoMisconceptionsTree from "./trees/goguryeo-misconceptions.json";
import httpRequestFlowTree from "./trees/http-request-flow.json";
import mammalVsReptileTree from "./trees/mammal-vs-reptile.json";
import photosynthesisSummaryTree from "./trees/photosynthesis-summary.json";
import worldGeographyTree from "./trees/world-geography.json";

/*
fixture가 전제하는 트리의 노드. 형제는 화면 순서대로 놓여 있다.
*/
export type LectureScenarioFixtureTreeNode = {
  id: string; // 서버 노드 ID
  parentId: string | null; // 루트면 null
  name: string;
};

/*
시나리오 fixture와 그 fixture가 전제하는 트리. 시나리오에는 트리가 없어 trees/<이름>.json에 따로 둔다.
invalid fixture는 스키마 오류를 보이려는 것이라 트리 파일이 없고, 제목이 같은 valid fixture의 트리를 쓴다.
*/
export type LectureScenarioFixture = {
  id: string; // 예: "valid/world-geography"
  kind: "valid" | "invalid";
  label: string; // valid는 시나리오 제목, invalid는 거부 이유
  scenario: unknown; // 검사하지 않은 시나리오. 모델 출력처럼 다룬다
  treeName: string; // trees 디렉터리의 파일 이름
  tree: LectureScenarioFixtureTreeNode[];
};

type InvalidFixtureFile = { description: string; scenario: unknown };

const VALID_FIXTURES: [
  string,
  { title: string },
  LectureScenarioFixtureTreeNode[],
][] = [
  [
    "goguryeo-misconceptions",
    goguryeoMisconceptionsScenario,
    goguryeoMisconceptionsTree,
  ],
  ["http-request-flow", httpRequestFlowScenario, httpRequestFlowTree],
  ["mammal-vs-reptile", mammalVsReptileScenario, mammalVsReptileTree],
  [
    "photosynthesis-summary",
    photosynthesisSummaryScenario,
    photosynthesisSummaryTree,
  ],
  ["world-geography", worldGeographyScenario, worldGeographyTree],
];

const INVALID_FIXTURES: [string, InvalidFixtureFile][] = [
  ["atomic-action", atomicActionInvalid],
  ["duplicate-beat-id", duplicateBeatIdInvalid],
  ["duration-field", durationFieldInvalid],
  ["empty-role", emptyRoleInvalid],
  ["invalid-delivery", invalidDeliveryInvalid],
  ["invalid-node-id", invalidNodeIdInvalid],
  ["missing-role", missingRoleInvalid],
  ["overlapping-roles", overlappingRolesInvalid],
  ["role-cardinality", roleCardinalityInvalid],
  ["role-from-other-intent", roleFromOtherIntentInvalid],
  ["unknown-intent", unknownIntentInvalid],
  ["unknown-schema-version", unknownSchemaVersionInvalid],
  ["unsupported-recipe-version", unsupportedRecipeVersionInvalid],
];

const validFixtures: LectureScenarioFixture[] = VALID_FIXTURES.map(
  ([name, scenario, tree]) => ({
    id: `valid/${name}`,
    kind: "valid",
    label: scenario.title,
    scenario,
    treeName: name,
    tree,
  }),
);

/*
개발 도구(애니메이션 랩)가 불러 쓰는 fixture 목록. 디렉터리의 파일과 같은지는 index.test.ts가 확인한다.
*/
export const LECTURE_SCENARIO_FIXTURES: LectureScenarioFixture[] = [
  ...validFixtures,
  ...INVALID_FIXTURES.map(([name, { description, scenario }]) => {
    const treeFixture = validFixtures.find(
      (fixture) =>
        fixture.label === (scenario as { title?: unknown } | null)?.title,
    );

    if (!treeFixture) {
      throw new Error(
        `invalid fixture ${name}와 제목이 같은 valid fixture가 없습니다.`,
      );
    }

    return {
      id: `invalid/${name}`,
      kind: "invalid" as const,
      label: description,
      scenario,
      treeName: treeFixture.treeName,
      tree: treeFixture.tree,
    };
  }),
];
