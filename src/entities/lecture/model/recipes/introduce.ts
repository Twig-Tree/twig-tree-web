import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createEmphasis, createFocus, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
새 개념을 소개한다. 카메라를 주제와 주변 노드에 맞춘 뒤 주제를 강조하고, 주변 노드가 있으면 이어서 함께 드러낸다.
주변 노드를 하나씩 차례로 소개하는 연출은 자식 순회 recipe가 맡는다.
*/
export const introduceRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    subject: recipeRole.one,
    context: recipeRole.optionalMany,
  }),
  defaultDelivery: {
    pace: "normal",
    intensity: "strong",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject, context = [] }, { motion }) =>
    createSequence([
      createFocus([subject, ...context], motion),
      createEmphasis([subject], motion),
      ...(context.length > 0
        ? [createEmphasis(context, motion, { style: "steady" })]
        : []),
    ]),
});
