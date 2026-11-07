import {
  getDeliveryWithDefaults,
  getLectureMotionFromDelivery,
} from "../lectureMotion";
import { type ScenarioDelivery } from "../scenario/types";
import {
  type LectureRecipeDefinition,
  type LectureRecipeResult,
  type LectureRecipeTree,
} from "./types";

type GetLectureRecipeAnimationOptions = {
  delivery: ScenarioDelivery | undefined; // 비운 값은 recipe의 기본값으로 채운다
  tree: LectureRecipeTree;
};

/*
함수 이름 : defineLectureRecipe
기능 : recipe 정의의 입력 타입을 inputSchema에서 추론하게 한다. 값은 그대로 돌려준다.
인자 : LectureRecipeDefinition<Input> recipe -> recipe 정의
반환값 : 같은 recipe 정의
*/
export const defineLectureRecipe = <Input>(
  recipe: LectureRecipeDefinition<Input>,
): LectureRecipeDefinition<Input> => recipe;

/*
함수 이름 : getLectureRecipeAnimation
기능 : 입력을 recipe의 스키마로 검사하고, delivery를 motion 값으로 바꿔 recipe의 애니메이션을 만든다.
입력은 시나리오나 랩 JSON처럼 밖에서 오므로 unknown으로 받는다.
인자 : LectureRecipeDefinition<Input> recipe -> 실행할 recipe
unknown input -> recipe 입력
GetLectureRecipeAnimationOptions options -> delivery와 트리 조회 함수
반환값 : 애니메이션, 또는 입력 위치별 오류 목록
*/
export const getLectureRecipeAnimation = <Input>(
  recipe: LectureRecipeDefinition<Input>,
  input: unknown,
  { delivery, tree }: GetLectureRecipeAnimationOptions,
): LectureRecipeResult => {
  const parsed = recipe.inputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    };
  }

  const motion = getLectureMotionFromDelivery(
    getDeliveryWithDefaults(recipe.defaultDelivery, delivery),
  );

  return {
    success: true,
    animation: recipe.create(parsed.data, { motion, tree }),
  };
};
