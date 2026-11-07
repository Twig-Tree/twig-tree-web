import { type SUPPORTED_RECIPE_REGISTRY_VERSIONS } from "../scenario/schema";
import { collapseSummaryRecipe } from "./collapseSummary";
import { compareRecipe } from "./compare";
import { introduceRecipe } from "./introduce";
import { recapRecipe } from "./recap";
import { revealBranchRecipe } from "./revealBranch";
import { revealNodesRecipe } from "./revealNodes";
import { type LectureRecipeDefinition } from "./types";
import { spotlightRecipe } from "./spotlight";
import { tourChildrenRecipe } from "./tourChildren";
import { tracePathRecipe } from "./tracePath";
import { verdictRecipe } from "./verdict";
import { warnRecipe } from "./warn";

export type LectureRecipeRegistryVersion =
  (typeof SUPPORTED_RECIPE_REGISTRY_VERSIONS)[number];

/*
버전별 recipe 모음. 같은 입력과 같은 버전은 항상 같은 애니메이션을 만든다.

- ID는 kebab-case이고, 가르치는 의도가 아니라 연출을 나타낸다(trace-path, spotlight). intent와 recipe를 잇는 일은 컴파일러가 한다.
- 배포된 버전의 recipe 결과를 바꾸는 변경은 새 버전에서 한다. 바뀌지 않는 recipe는 새 버전에서 같은 정의를 다시 가리킨다.
- 버전 1은 아직 배포 전이라 #138 작업 동안 고친다.

SUPPORTED_RECIPE_REGISTRY_VERSIONS의 버전마다 항목이 있어야 하며, 빠뜨리면 타입 오류가 난다.
*/
export const LECTURE_RECIPE_REGISTRIES = {
  1: {
    introduce: introduceRecipe,
    spotlight: spotlightRecipe,
    compare: compareRecipe,
    warn: warnRecipe,
    verdict: verdictRecipe,
    "trace-path": tracePathRecipe,
    "reveal-branch": revealBranchRecipe,
    "reveal-nodes": revealNodesRecipe,
    "tour-children": tourChildrenRecipe,
    "collapse-summary": collapseSummaryRecipe,
    recap: recapRecipe,
  },
} satisfies Record<LectureRecipeRegistryVersion, object>;

export type LectureRecipeId<
  V extends LectureRecipeRegistryVersion = LectureRecipeRegistryVersion,
> = keyof (typeof LECTURE_RECIPE_REGISTRIES)[V];

/*
함수 이름 : getLectureRecipe
기능 : 버전과 ID로 recipe를 찾는다. recipe마다 입력 타입이 달라 ID를 값으로 고르면 TS가 하나로 좁히지 못하므로,
입력을 unknown으로 받는 정의로 돌려준다. getLectureRecipeAnimation이 입력을 그 recipe의 스키마로 먼저 검사하므로 create에는 맞는 값만 닿는다.
인자 : V version -> recipe registry 버전
LectureRecipeId<V> id -> recipe ID
반환값 : recipe 정의
*/
export const getLectureRecipe = <V extends LectureRecipeRegistryVersion>(
  version: V,
  id: LectureRecipeId<V>,
): LectureRecipeDefinition<unknown> =>
  LECTURE_RECIPE_REGISTRIES[version][
    id
  ] as unknown as LectureRecipeDefinition<unknown>;
