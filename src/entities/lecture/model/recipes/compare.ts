import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createEmphasis, createFocus, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
두 대상을 한 화면에 모은 뒤 왼쪽과 오른쪽을 번갈아 강조한다. 어느 쪽이 맞는지 판정하는 연출은 정답·오답 recipe가 맡는다.
*/
export const compareRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    left: recipeRole.many,
    right: recipeRole.many,
  }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ left, right }, { motion }) =>
    createSequence([
      createFocus([...left, ...right], motion),
      createEmphasis(left, motion),
      createEmphasis(right, motion),
    ]),
});
