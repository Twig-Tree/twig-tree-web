import { defineLectureRecipe } from "./getLectureRecipeAnimation";
import { createFocus, createSequence } from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";
import { createSpotlight } from "./spotlight";

/*
숨어 있던 노드를 드러낸다. 카메라를 대상에 맞추면 런타임이 대상의 접힌 조상을 펼치므로,
컴파일러가 접힘 상태를 몰라도 대상이 화면에 나온다. 그 뒤 spotlight처럼 주변을 흐리고 대상을 강조한다.
*/
export const revealNodesRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({ subject: recipeRole.many }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) =>
    createSequence([
      createFocus(subject, motion),
      createSpotlight(subject, motion),
    ]),
});
