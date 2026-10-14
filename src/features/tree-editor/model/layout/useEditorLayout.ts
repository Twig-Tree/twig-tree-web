import {
  useCallback,
  useLayoutEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { type FitViewOptions, useReactFlow } from "@xyflow/react";
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

/*
노드가 한두 개뿐인 트리에 맞추면 기본 최대 배율(2)까지 확대되므로 100%보다 크게 확대하지 않는다.
*/
const FIT_TREE_VIEW_OPTIONS: FitViewOptions = { maxZoom: 1 };

/*
함수 이름 : useEditorLayout
기능 : 노드·엣지 구조가 바뀔 때마다 ELK로 배치를 다시 계산해 store에 얹는다. 트리 전체를 화면에 맞추는 것은
트리를 처음 열었을 때의 첫 배치 뒤에만 하고, 그 뒤에는 사용자가 요청할 때만 한다.
인자 : CustomEditorNode[] nodes -> 배치를 계산할 노드 목록(화면에 보이는 노드)
CustomEditorEdge[] edges -> 배치를 계산할 엣지 목록(화면에 보이는 엣지)
Dispatch<SetStateAction<CustomEditorNode[]>> setNodes -> 계산 결과를 얹을 store setter
반환값 : 배치를 다시 계산하는 함수와 트리 전체를 화면에 맞추는 함수
*/
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

  /*
  트리 전체를 화면에 맞추는 것은 처음 열 때 한 번뿐이다. 레이아웃이 다시 돌 때마다 맞추면 노드를 추가하거나
  접을 때마다 배율과 위치가 바뀌어 사용자가 보던 지점을 잃는다. 다른 워크스페이스로 이동하면 페이지가 새로
  마운트되므로 이 기록도 새로 시작한다.
  */
  const hasFittedTreeViewRef = useRef(false);

  const fitTreeView = useCallback(() => {
    void fitView(FIT_TREE_VIEW_OPTIONS);
  }, [fitView]);

  const onLayout = useCallback(
    ({ direction }: { direction: Direction }) => {
      const opts = { "elk.direction": direction, ...elkOptions };

      latestLayoutRunIdRef.current += 1;
      const runId = latestLayoutRunIdRef.current; // 이 계산이 최신인지 판단할 때 사용한다.

      // ELK 레이아웃 계산 후 노드 위치를 업데이트한다.
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

          /*
          노드가 없는 첫 계산(트리 조회 전, 빈 워크스페이스)은 맞출 대상이 없으므로 건너뛴다. 빈 워크스페이스에서
          루트를 처음 추가하면 그때가 첫 배치가 되어, 원점 근처에 놓인 루트가 화면 밖에 남지 않는다.
          React Flow가 새 좌표로 노드를 그린 뒤에 맞추도록 다음 프레임으로 미룬다.
          */
          if (!hasFittedTreeViewRef.current && layoutedNodes.length > 0) {
            hasFittedTreeViewRef.current = true;
            window.requestAnimationFrame(fitTreeView);
          }
        })
        .catch((error) => {
          console.error(error);

          // 이미 더 새로운 계산이 시작되었다면 그쪽이 결과를 책임진다.
          if (runId !== latestLayoutRunIdRef.current) return;

          requestedStructureRef.current = null;
        });
    },
    [nodes, edges, setNodes, fitTreeView],
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

  return { onLayout, fitTreeView };
}
