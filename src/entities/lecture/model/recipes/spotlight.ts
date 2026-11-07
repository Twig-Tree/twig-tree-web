import { type LectureMotion } from "../lectureMotion";
import { type LectureAnimation } from "../types";
import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createDim, createEmphasis, createParallel } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
함수 이름 : createSpotlight
기능 : 대상만 남기고 주변을 흐리면서 대상을 강조한다. 흐림과 강조가 함께 시작한다.
tone이 neutral이면 강조가 다시 흐림이 되므로 흐림 하나만 남긴다.
인자 : string[] subject -> 시선을 모을 노드
LectureMotion motion -> 표시 시간, 스타일, 색, 유지 여부
반환값 : 흐림과 강조의 병렬 그룹
*/
export const createSpotlight = (
  subject: string[],
  motion: LectureMotion,
): LectureAnimation =>
  createParallel([
    createDim(subject, motion),
    ...(motion.highlightTone === null ? [] : [createEmphasis(subject, motion)]),
  ]);

/*
대상만 남기고 주변을 흐려 시선을 모은다. 카메라는 움직이지 않으므로 이미 보이는 노드에 쓴다.
접혀 있을 수 있는 노드를 드러낼 때는 reveal-nodes를 쓴다.
*/
export const spotlightRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.many }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) => createSpotlight(subject, motion),
});
