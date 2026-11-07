import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import {
  createEmphasisSteps,
  createFocus,
  createSequence,
} from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";
import { getSelectedChildIds } from "./recipeTreeChecks";

/*
부모와 자식으로 카메라를 맞춘 뒤 자식을 하나씩 차례로 강조한다. 하나의 개념을 구성 요소로 나눠 설명할 때 쓴다.
children을 주면 그 순서로(모두 parent의 자식이어야 한다), 없으면 화면에 보이는 자식 순서로 돈다.
*/
export const tourChildrenRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    parent: recipeRole.one,
    children: recipeRole.optionalMany,
  }),
  defaultDelivery: {
    pace: "quick",
    intensity: "strong",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ parent, children }, { motion, tree }) => {
    const tourIds = getSelectedChildIds(
      parent,
      children,
      tree,
      "차례로 소개할 자식이 없습니다.",
    );

    if (!Array.isArray(tourIds)) return tourIds;

    return createSequence([
      createFocus([parent, ...tourIds], motion),
      ...createEmphasisSteps(
        tourIds.map((childId) => ({ nodeIds: [childId] })),
        motion,
      ),
    ]);
  },
});
