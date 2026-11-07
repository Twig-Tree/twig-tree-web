import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createDim, createEmphasis, createParallel } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
대상만 남기고 주변을 흐려 시선을 모은다. 흐림과 강조가 함께 시작한다.
tone이 neutral이면 강조가 다시 흐림이 되므로 흐림 하나만 남긴다.
*/
export const spotlightRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.many }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) =>
    createParallel([
      createDim(subject, motion),
      ...(motion.highlightTone === null
        ? []
        : [createEmphasis(subject, motion)]),
    ]),
});
