import { getResolvedDelivery } from "../lectureMotion";
import { getLectureRecipeAnimation } from "../recipes/getLectureRecipeAnimation";
import {
  getLectureRecipe,
  type LectureRecipeId,
  type LectureRecipeRegistryVersion,
} from "../recipes/registry";
import {
  type LectureRecipeIssue,
  type LectureRecipeTree,
} from "../recipes/types";
import { type ScenarioCue, type SemanticIntent } from "../scenario/types";
import { type LectureAnimation } from "../types";

type CueRoles<Intent extends SemanticIntent> = Extract<
  ScenarioCue,
  { intent: Intent }
>["roles"];

type CueRoleName<Intent extends SemanticIntent> = keyof CueRoles<Intent> &
  string;

/*
intent 하나를 recipe로 보내는 방법.
inputRoles는 recipe 입력 이름에서 cue role 이름으로 가는 표다. 표에 없는 role은 recipe에 넘기지 않는다.
recipe가 실패하면 같은 표를 거꾸로 써서 입력 위치를 cue의 role 위치로 옮긴다.
*/
type IntentRecipeBinding<
  Version extends LectureRecipeRegistryVersion,
  Intent extends SemanticIntent,
> = {
  recipeId: LectureRecipeId<Version>;
  inputRoles: Record<string, CueRoleName<Intent>>;
};

type IntentRecipeTable<Version extends LectureRecipeRegistryVersion> = {
  [Intent in SemanticIntent]: IntentRecipeBinding<Version, Intent>;
};

/*
recipe registry 버전별 intent → recipe 연결표. 연결을 바꾸면 같은 시나리오의 연출이 달라지므로,
배포된 버전의 표는 고치지 않고 recipe registry와 함께 새 버전을 더한다.
intent를 추가하면 모든 버전에서 타입 오류가 나므로 빠뜨릴 수 없다.

- emphasize, reveal → spotlight: reveal에 맞는 recipe가 따로 없다. spotlight의 focus가 대상의 조상을 펼쳐 숨은 노드를 드러낸다.
- decompose → reveal-branch: 이미 펼쳐진 가지에도 쓸 수 있다.
- correct, incorrect → verdict: 판정 색은 의미로 정하므로 두 intent가 같은 연출을 쓴다.
- transition → introduce: 장소를 옮기는 recipe가 없어 도착점을 소개한다. source는 쓰지 않는다.
- summarize → collapse-summary: context는 쓰지 않는다.
*/
export const LECTURE_INTENT_RECIPES: {
  [Version in LectureRecipeRegistryVersion]: IntentRecipeTable<Version>;
} = {
  1: {
    introduce: {
      recipeId: "introduce",
      inputRoles: { subject: "subject", context: "context" },
    },
    emphasize: { recipeId: "spotlight", inputRoles: { subject: "subject" } },
    compare: {
      recipeId: "compare",
      inputRoles: { left: "left", right: "right" },
    },
    decompose: {
      recipeId: "reveal-branch",
      inputRoles: { parent: "parent", children: "children" },
    },
    trace: {
      recipeId: "trace-path",
      inputRoles: { source: "source", destination: "destination" },
    },
    reveal: { recipeId: "spotlight", inputRoles: { subject: "subject" } },
    warn: { recipeId: "warn", inputRoles: { subject: "subject" } },
    correct: {
      recipeId: "verdict",
      inputRoles: {
        correctAnswer: "correctAnswer",
        incorrectAnswer: "incorrectAnswer",
      },
    },
    incorrect: {
      recipeId: "verdict",
      inputRoles: {
        correctAnswer: "correctAnswer",
        incorrectAnswer: "incorrectAnswer",
      },
    },
    transition: {
      recipeId: "introduce",
      inputRoles: { subject: "destination" },
    },
    recap: { recipeId: "recap", inputRoles: { subject: "subject" } },
    summarize: {
      recipeId: "collapse-summary",
      inputRoles: { subject: "subject" },
    },
  },
};

export type CueRecipeResult =
  | {
      success: true;
      recipeId: LectureRecipeId;
      animation: LectureAnimation;
    }
  | {
      success: false;
      recipeId: LectureRecipeId;
      issues: LectureRecipeIssue[]; // cue 안의 위치. 예: ["roles", "children", 1]
    };

/*
함수 이름 : getCueRecipeAnimation
기능 : cue의 intent로 recipe를 고르고, role을 recipe 입력으로 옮겨 실행한다.
delivery는 recipe 기본값이 아니라 intent 기본값으로 채운다. 같은 recipe라도 intent마다 알맞은 분위기가 다르기 때문이다.
인자 : ScenarioCue cue -> 컴파일할 cue
LectureRecipeRegistryVersion version -> 시나리오의 recipe registry 버전
LectureRecipeTree tree -> 트리 조회 함수
반환값 : 고른 recipe와 애니메이션, 또는 cue 안의 위치별 문제
*/
export const getCueRecipeAnimation = (
  cue: ScenarioCue,
  version: LectureRecipeRegistryVersion,
  tree: LectureRecipeTree,
): CueRecipeResult => {
  /*
  intent마다 role 타입이 달라 표의 항목을 cue와 함께 좁히지 못한다. 표가 intent별로 타입 검사를 받았으므로 넓혀 읽는다.
  */
  const { recipeId, inputRoles } = LECTURE_INTENT_RECIPES[version][
    cue.intent
  ] as IntentRecipeBinding<typeof version, SemanticIntent>;
  const roles: Record<string, string | string[] | undefined> = cue.roles;

  const input = Object.fromEntries(
    Object.entries(inputRoles)
      .map(([inputName, roleName]) => [inputName, roles[roleName]] as const)
      .filter(([, value]) => value !== undefined),
  );

  const result = getLectureRecipeAnimation(
    getLectureRecipe(version, recipeId),
    input,
    {
      delivery: getResolvedDelivery(cue.intent, cue.delivery),
      tree,
    },
  );

  if (result.success) {
    return { success: true, recipeId, animation: result.animation };
  }

  return {
    success: false,
    recipeId,
    issues: result.issues.map(({ path, message }) => {
      const [inputName, ...rest] = path;
      const roleName =
        typeof inputName === "string" ? inputRoles[inputName] : undefined;

      /*
      입력 전체에 대한 문제처럼 role로 옮길 수 없는 위치는 roles 아래에 그대로 둔다.
      */
      return {
        path:
          roleName === undefined
            ? ["roles", ...path]
            : ["roles", roleName, ...rest],
        message,
      };
    }),
  };
};
