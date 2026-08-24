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
  mergeLayoutResult,
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

  /*
  계산을 시작한 구조를 기록해 같은 구조를 중복 계산하지 않는다. 계산에 실패하면 기록을 지워
  다음 렌더에서 다시 시도한다. 지우지 않으면 노드가 원점에 겹친 채로 남는다.
  */
  const requestedStructureRef = useRef<string | null>(null);

  /*
  마지막으로 시작한 계산을 식별한다. 나중에 시작한 계산일수록 더 나중의 store를 읽었으므로
  입력이 더 최신이다. 먼저 시작한 계산이 늦게 끝나 그 결과를 얹으면 일부 노드만 예전 배치인
  좌표가 섞이므로, 최신 계산의 결과만 적용한다.
  */
  const latestLayoutRunIdRef = useRef(0);

  const onLayout = useCallback(
    ({ direction }: { direction: Direction }) => {
      const opts = { "elk.direction": direction, ...elkOptions };

      latestLayoutRunIdRef.current += 1;
      const runId = latestLayoutRunIdRef.current; // 이 계산이 최신인지 판단할 때 사용한다.

      // ELK 레이아웃 계산 후 노드 위치를 업데이트하고, 화면에 맞게 뷰를 조정
      getLayoutedElements(nodes, edges, opts)
        .then(({ nodes: layoutedNodes }) => {
          if (runId !== latestLayoutRunIdRef.current) return;

          /*
          ELK 계산은 비동기라, 계산이 끝나는 사이에 서버 응답에 따른 serverId 채움이나
          제목·메모 수정이 store에 반영될 수 있다. 계산 시작 시점의 배열로 store를 교체하면
          그 변경이 사라지므로, 최신 store 노드에 배치 값만 병합한다.
          엣지는 React Flow가 노드 위치로 경로를 계산하므로 ELK 결과를 반영하지 않는다.
          */
          setNodes((currentNodes) =>
            mergeLayoutResult(currentNodes, layoutedNodes),
          );

          window.requestAnimationFrame(() => {
            fitView();
          });
        })
        .catch((error) => {
          console.error(error);

          // 이미 더 새로운 계산이 시작되었다면 그쪽이 결과를 책임진다.
          if (runId !== latestLayoutRunIdRef.current) return;

          requestedStructureRef.current = null;
        });
    },
    [nodes, edges, setNodes, fitView],
  );

  /*
  레이아웃 정렬 시점 결정.
  노드·엣지 배열은 좌표 병합이나 제목·메모 수정으로도 새 배열이 되므로, 배열이 바뀔 때마다
  계산하면 레이아웃 결과가 다시 레이아웃을 부르는 순환이 된다. 구조 시그니처가 달라졌을 때만
  계산해, 배치가 달라져야 하는 변화와 좌표를 다시 얹어야 하는 변화에만 반응한다.
  */
  useLayoutEffect(() => {
    const structure = getLayoutStructureSignature(nodes, edges);

    if (requestedStructureRef.current === structure) return;

    requestedStructureRef.current = structure;

    onLayout({ direction: "RIGHT" });
  }, [nodes, edges, onLayout]);

  return { onLayout };
}
