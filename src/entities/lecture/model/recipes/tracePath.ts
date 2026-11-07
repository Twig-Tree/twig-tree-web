import {
  createRecipeFailure,
  defineLectureRecipe,
} from "./getLectureRecipeAnimation";
import {
  createEmphasis,
  createFocus,
  createSequence,
  createTrace,
} from "./recipeActions";
import { createRecipeInputSchema, recipeRole } from "./recipeInputSchema";

/*
출발 노드에서 도착 노드까지 연결선을 따라간다. 경로 전체로 카메라를 맞추고, 연결선을 하나씩 그린 뒤 도착 노드를 강조한다.
대본의 trace는 부모→자식 순서로 노드를 받으므로, 도착 노드가 위에 있으면 같은 경로를 거꾸로 그린다.
두 노드가 조상·자손 관계가 아니면 한 줄의 경로가 없어 만들지 않는다.
*/
export const tracePathRecipe = defineLectureRecipe({
  inputSchema: createRecipeInputSchema({
    source: recipeRole.one,
    destination: recipeRole.one,
  }),
  defaultDelivery: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  create: ({ source, destination }, { motion, tree }) => {
    const downwardPath = tree.getPathNodeIds(source, destination);
    const upwardPath =
      downwardPath === null ? tree.getPathNodeIds(destination, source) : null;
    const path = downwardPath ?? upwardPath;

    if (path === null) {
      return createRecipeFailure(
        ["destination"],
        "출발 노드와 조상·자손 관계가 아니라 따라갈 경로가 없습니다.",
      );
    }

    return createSequence([
      createFocus(path, motion),
      createTrace(path, motion, downwardPath === null ? "reverse" : "forward"),
      createEmphasis([destination], motion),
    ]);
  },
});
