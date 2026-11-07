import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import {
  createEmphasis,
  createExpand,
  createFocus,
  createSequence,
} from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";
import { getSelectedChildIds } from "./recipeTreeChecks";

/*
가지를 펼쳐 자식을 드러낸다. 펼친 뒤 부모와 자식으로 카메라를 맞추고 자식을 함께 강조한다.
children을 주면 그 자식만 강조하고(모두 parent의 자식이어야 한다), 없으면 부모의 모든 자식을 강조한다. 펼치는 대상은 부모라 children과 관계없이 모든 자식이 나타난다.
*/
export const revealBranchRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    parent: recipeRole.one,
    children: recipeRole.optionalMany,
  }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ parent, children }, { motion, tree }) => {
    const revealedIds = getSelectedChildIds(
      parent,
      children,
      tree,
      "펼쳐 보여줄 자식이 없습니다.",
    );

    if (!Array.isArray(revealedIds)) return revealedIds;

    return createSequence([
      createExpand([parent], motion),
      createFocus([parent, ...revealedIds], motion),
      createEmphasis(revealedIds, motion),
    ]);
  },
});
