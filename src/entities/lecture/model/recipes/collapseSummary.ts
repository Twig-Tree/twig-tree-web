import {
  createRecipeFailure,
  defineLectureRecipe,
} from "./getLectureRecipeAnimation";
import {
  createCollapse,
  createEmphasis,
  createFocus,
  createSequence,
} from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
세부 내용을 접고 상위 개념에 시선을 모은다. 접히기 전의 가지 전체로 카메라를 맞춘 뒤 접고, 남은 부모를 강조한다.
접을 자식이 없으면 연출이 성립하지 않아 만들지 않는다.
*/
export const collapseSummaryRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.one }),
  defaultDelivery: {
    pace: "slow",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject }, { motion, tree }) => {
    const childIds = tree.getChildIds(subject);

    if (childIds.length === 0) {
      return createRecipeFailure(["subject"], "접을 자식이 없습니다.");
    }

    return createSequence([
      createFocus([subject, ...childIds], motion),
      createCollapse([subject], motion),
      createEmphasis([subject], motion),
    ]);
  },
});
