import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import {
  createEmphasisSteps,
  createFocus,
  createSequence,
} from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
배운 노드를 한 화면에 모은 뒤 짧게 하나씩 되짚는다. 마지막까지 화면에 남기려면 continuity를 persist로 준다.
*/
export const recapRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.many }),
  defaultDelivery: {
    pace: "quick",
    intensity: "subtle",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) =>
    createSequence([
      createFocus(subject, motion),
      ...createEmphasisSteps(
        subject.map((nodeId) => ({ nodeIds: [nodeId] })),
        motion,
      ),
    ]),
});
