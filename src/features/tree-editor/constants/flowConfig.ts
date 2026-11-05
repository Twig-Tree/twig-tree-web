import { CustomNode } from "@/src/features/tree-editor/ui/CustomNode";
import { GhostNode } from "@/src/features/tree-editor/ui/GhostNode";
import { CustomEdge } from "@/src/features/tree-editor/ui/CustomEdge";

export const nodeTypes = {
  custom: CustomNode,
  ghost: GhostNode,
};

export const edgeTypes = {
  custom: CustomEdge,
};

/*
Fit View가 이 값 아래로는 줄이지 않는다. 기본값(0.5)에서는 노드가 많은 트리가 낮은 창에 다 들어가지 못해
위쪽 노드가 도구 버튼에 가리고 아래쪽 노드가 잘린다.
*/
export const MIN_ZOOM = 0.3;
