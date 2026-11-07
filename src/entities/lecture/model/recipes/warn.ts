import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createEmphasis, createPause, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
주의할 대상을 흔든 뒤 잠깐 쉬고, 멈춘 강조로 남긴다. 흔들림은 강도가 아니라 "주의"라는 의미라 recipe가 고른다.
intensity가 subtle이면 움직임 없이 멈춘 강조만 쓴다. tone이 neutral이면 흔들 강조가 없어 흐림 하나만 쓴다.
*/
export const warnRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.many }),
  defaultDelivery: {
    pace: "normal",
    intensity: "strong",
    tone: "warning",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) =>
    motion.highlightStyle === "steady" || motion.highlightTone === null
      ? createEmphasis(subject, motion)
      : createSequence([
          createEmphasis(subject, motion, { style: "shake", persist: false }),
          createPause(motion),
          createEmphasis(subject, motion, { style: "steady" }),
        ]),
});
