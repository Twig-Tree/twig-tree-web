import * as z from "zod/mini";
import { LECTURE_TONE_TOKENS } from "../motionTokens";
import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createEmphasis, createPause, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
정답과 오답을 판정한다. 오답이 있으면 먼저 흔들고, 잠깐 쉰 뒤 정답을 튀어 오르게 한다.
correct는 정답을, incorrect는 오답을 반드시 주고 다른 쪽은 선택이라, 둘 다 선택으로 받고 하나 이상만 요구한다.
색과 움직임은 판정이라는 의미에서 오므로 delivery의 tone과 관계없이 오답은 danger, 정답은 positive를 쓴다.
intensity가 subtle이면 움직이지 않고 색으로만 판정한다.
*/
export const verdictRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    correctAnswer: recipeRole.optionalMany,
    incorrectAnswer: recipeRole.optionalMany,
  }).check(
    z.refine(
      ({ correctAnswer, incorrectAnswer }) =>
        correctAnswer !== undefined || incorrectAnswer !== undefined,
      { message: "정답과 오답 중 하나 이상이 필요합니다." },
    ),
  ),
  defaultDelivery: {
    pace: "normal",
    intensity: "strong",
    tone: "positive",
    continuity: "transient",
  },
  create: ({ correctAnswer, incorrectAnswer }, { motion }) => {
    const isStill = motion.highlightStyle === "steady";
    const createCorrect = (nodeIds: string[]) =>
      createEmphasis(
        nodeIds,
        { ...motion, highlightTone: LECTURE_TONE_TOKENS.positive },
        { style: isStill ? "steady" : "bounce" },
      );
    const createIncorrect = (nodeIds: string[], persist?: boolean) =>
      createEmphasis(
        nodeIds,
        { ...motion, highlightTone: LECTURE_TONE_TOKENS.danger },
        { style: isStill ? "steady" : "shake", persist },
      );

    if (incorrectAnswer === undefined) return createCorrect(correctAnswer!);
    if (correctAnswer === undefined) return createIncorrect(incorrectAnswer);

    /*
    정답이 뒤에 오므로 오답 표시는 남기지 않는다. 남기면 정답과 오답이 함께 강조된 채로 끝난다.
    */
    return createSequence([
      createIncorrect(incorrectAnswer, false),
      createPause(motion),
      createCorrect(correctAnswer),
    ]);
  },
});
