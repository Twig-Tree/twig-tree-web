import {
  useCallback,
  useLayoutEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { useReactFlow } from "@xyflow/react";
import {
  CustomEditorNode,
  CustomEditorEdge,
} from "@/src/features/tree-editor/model/types";
import {
  getLayoutedElements,
  getLayoutStructureSignature,
  mergeLayoutPositions,
  elkOptions,
} from "@/src/features/tree-editor/lib/layout";
import { Direction } from "@/src/features/tree-editor/model/types";

// ELK 레이아웃을 언제 정렬할지 결정하고, 실제로 화면에 적용하는 커스텀 훅
export function useEditorLayout(
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  setNodes: Dispatch<SetStateAction<CustomEditorNode[]>>,
) {
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    ({ direction }: { direction: Direction }) => {
      const opts = { "elk.direction": direction, ...elkOptions };

      // ELK 레이아웃 계산 후 노드 위치를 업데이트하고, 화면에 맞게 뷰를 조정
      getLayoutedElements(nodes, edges, opts).then(
        ({ nodes: layoutedNodes }) => {
          /*
          ELK 계산은 비동기라, 계산이 끝나는 사이에 서버 응답에 따른 임시 ID 교체나
          제목·메모 수정이 store에 반영될 수 있다. 계산 시작 시점의 배열로 store를 교체하면
          그 변경이 사라지므로, 최신 store 노드에 position만 병합한다.
          엣지는 React Flow가 노드 위치로 경로를 계산하므로 ELK 결과를 반영하지 않는다.
          */
          setNodes((currentNodes) =>
            mergeLayoutPositions(currentNodes, layoutedNodes),
          );

          window.requestAnimationFrame(() => {
            fitView();
          });
        },
      );
    },
    [nodes, edges, setNodes, fitView],
  );

  const appliedStructureRef = useRef<string | null>(null);

  /*
  레이아웃 정렬 시점 결정.
  노드·엣지 배열은 좌표 병합이나 제목·메모 수정으로도 새 배열이 되므로, 배열이 바뀔 때마다
  계산하면 레이아웃 결과가 다시 레이아웃을 부르는 순환이 된다. 구조 시그니처가 달라졌을 때만
  계산해, 배치가 달라져야 하는 변화와 좌표를 다시 얹어야 하는 변화에만 반응한다.
  */
  useLayoutEffect(() => {
    const structure = getLayoutStructureSignature(nodes, edges);

    if (appliedStructureRef.current === structure) return;

    appliedStructureRef.current = structure;

    onLayout({ direction: "RIGHT" });
  }, [nodes, edges, onLayout]);

  return { onLayout };
}
