import { LECTURE_TONE_TOKENS } from "../motionTokens";
import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createEmphasis, createPause, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
정답과 오답을 판정한다. 오답이 있으면 먼저 흔들고, 잠깐 쉰 뒤 정답을 튀어 오르게 한다.
색과 움직임은 판정이라는 의미에서 오므로 delivery의 tone과 관계없이 오답은 danger, 정답은 positive를 쓴다.
intensity가 subtle이면 움직이지 않고 색으로만 판정한다.
*/
export const verdictRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    correctAnswer: recipeRole.many,
    incorrectAnswer: recipeRole.optionalMany,
  }),
  defaultDelivery: {
    pace: "normal",
    intensity: "strong",
    tone: "positive",
    continuity: "transient",
  },
  create: ({ correctAnswer, incorrectAnswer }, { motion }) => {
    const isStill = motion.highlightStyle === "steady";
    const correct = createEmphasis(
      correctAnswer,
      { ...motion, highlightTone: LECTURE_TONE_TOKENS.positive },
      { style: isStill ? "steady" : "bounce" },
    );

    if (incorrectAnswer === undefined) return correct;

    return createSequence([
      createEmphasis(
        incorrectAnswer,
        { ...motion, highlightTone: LECTURE_TONE_TOKENS.danger },
        { style: isStill ? "steady" : "shake", persist: false },
      ),
      createPause(motion),
      correct,
    ]);
  },
});
