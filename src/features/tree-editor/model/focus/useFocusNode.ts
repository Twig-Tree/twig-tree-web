import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { getAncestorClientIds } from "../../lib/getAncestorClientIds";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { CustomEditorNode } from "../types";

const CENTER_NODE_DURATION_MS = 300; // 노드로 화면을 옮기는 애니메이션 시간
const FIT_NODES_MAX_ZOOM = 1; // 여러 노드를 모을 때의 최대 배율. 노드가 하나뿐이면 maxZoom까지 확대되므로 트리 맞춤과 같은 값으로 막는다

type UseFocusNodeParams = {
  visibleNodes: CustomEditorNode[]; // 화면에 보이는 노드 목록. 대상이 없으면 레이아웃이 끝난 뒤에 옮긴다
  runAfterNextLayout: (callback: () => void) => void; // 다음 레이아웃 결과를 얹은 뒤 실행할 함수를 맡기는 함수
  isLayoutRunning: () => boolean; // 레이아웃 계산이 진행 중인지. 진행 중이면 보이는 노드라도 결과를 기다린다
};

type RevealNodesOptions = {
  maxZoom: number; // 대상이 적어도 이 배율을 넘겨 확대하지 않는다
  duration: number; // 화면 이동 애니메이션 시간
};

/*
함수 이름 : useFocusNode
기능 : 결과 목록에서 고른 노드의 접힌 조상을 펼치고, 그 노드를 선택해 현재 배율 그대로 화면 가운데로 옮기는 핸들러와,
여러 노드를 선택은 그대로 둔 채 한 화면에 모으는 함수를 만든다. 강의용 함수는 숨겨진 대상의 조상까지 펼쳐 모은다.
인자 : UseFocusNodeParams
반환값 : 노드로 이동하는 핸들러, 보이는 노드만 한 화면에 모으는 함수, 숨겨진 노드까지 펼쳐 모으는 함수
*/
export const useFocusNode = ({
  visibleNodes,
  runAfterNextLayout,
  isLayoutRunning,
}: UseFocusNodeParams) => {
  const { fitView, getInternalNode, getNodesBounds, getZoom, setCenter } =
    useReactFlow();
  const selectOnlyNodeInStore = useTreeStore(
    (state) => state.selectOnlyNodeInStore,
  );
  const expandAll = useCollapseStore((state) => state.expandAll);

  /*
  대상 노드들의 접힌 조상을 모두 펼친다. 접힘 상태는 serverId로 저장되므로 조상의 clientId를 serverId로 바꿔 넘기고,
  serverId가 없는 조상은 접혀 있을 수 없으므로 건너뛴다. 이미 펼쳐진 조상은 expandAll이 걸러 낸다.
  여러 대상의 조상을 모아 expandAll을 한 번만 부른다. 대상마다 부르면 그때마다 localStorage에 쓴다.
  노드와 엣지는 렌더에 쓰지 않고 이 순간에만 필요하므로 구독하지 않고 store에서 바로 읽는다.
  */
  const expandAncestors = useCallback(
    (clientIds: string[]) => {
      const { treeId, nodes, edges } = useTreeStore.getState();

      if (treeId === null) return;

      const ancestorClientIds = new Set(
        clientIds.flatMap((clientId) => getAncestorClientIds(edges, clientId)),
      );
      const ancestorServerIds = nodes.flatMap((node) =>
        ancestorClientIds.has(node.id) && node.data.serverId !== null
          ? [node.data.serverId]
          : [],
      );

      expandAll(treeId, ancestorServerIds);
    },
    [expandAll],
  );

  /*
  React Flow가 새 좌표로 노드를 그린 뒤에 읽도록 다음 프레임으로 미루고, 렌더된 노드의 실제 상자 가운데로 옮긴다.
  setCenter는 zoom을 넘기지 않으면 maxZoom으로 확대하므로 현재 배율을 그대로 넘긴다.
  */
  const moveToNodeCenter = useCallback(
    (clientId: string) => {
      window.requestAnimationFrame(() => {
        if (!getInternalNode(clientId)) return; // 그 사이 삭제되었거나 여전히 숨겨져 있으면 옮기지 않는다.

        const { x, y, width, height } = getNodesBounds([clientId]);

        void setCenter(x + width / 2, y + height / 2, {
          zoom: getZoom(),
          duration: CENTER_NODE_DURATION_MS,
        });
      });
    },
    [getInternalNode, getNodesBounds, getZoom, setCenter],
  );

  /*
  선택은 메모 패널과 노드 추가·삭제의 기준이 되므로, 고른 노드 하나만 선택된 상태로 만든 뒤 화면을 옮긴다.
  보이지 않는 노드는 아직 좌표가 확정되지 않았으므로 레이아웃이 끝난 뒤에 옮긴다. 보이는 노드라도 레이아웃 계산 중이면
  결과를 얹을 때 움직일 수 있고, 앞서 미뤄 둔 이동이 이 이동을 덮을 수 있으므로 함께 기다린다.

  펼치기와 선택은 같은 렌더에 반영되어야 한다. 선택만 먼저 반영되면 대상이 아직 숨겨진 상태라
  useVisibleElements가 "선택된 노드가 숨겨졌다"고 보고 선택을 풀고 메모 패널을 닫는다.
  두 store 변경을 이 핸들러 안에서 동기로 하면 React가 한 번에 렌더한다.
  */
  const focusNode = useCallback(
    (clientId: string) => {
      expandAncestors([clientId]);
      selectOnlyNodeInStore(clientId);

      const isVisible = visibleNodes.some((node) => node.id === clientId);

      if (isVisible && !isLayoutRunning()) {
        moveToNodeCenter(clientId);
        return;
      }

      runAfterNextLayout(() => moveToNodeCenter(clientId));
    },
    [
      visibleNodes,
      isLayoutRunning,
      expandAncestors,
      selectOnlyNodeInStore,
      moveToNodeCenter,
      runAfterNextLayout,
    ],
  );

  /*
  태그를 고르면 그 태그가 붙은 노드들을 한 화면에 모은다. 접혀서 숨겨진 노드는 펼치지 않고 대상에서 뺀다.
  태그를 고르는 것만으로 사용자의 접힘 상태(localStorage, 다른 탭)를 바꾸지 않기 위해서다. 숨겨진 노드는 결과 목록에서 눌러 focusNode로 찾아간다.
  보이는 노드가 없으면 화면을 옮기지 않는다. 레이아웃 계산 중이면 focusNode와 같은 이유로 결과를 얹은 뒤에 모은다.
  */
  const fitNodes = useCallback(
    (clientIds: string[]) => {
      const fitRenderedNodes = () => {
        window.requestAnimationFrame(() => {
          const renderedNodes = clientIds.flatMap((clientId) =>
            getInternalNode(clientId) ? [{ id: clientId }] : [],
          ); // 화면에 그려진 노드만 남긴다. 숨겨진 노드는 React Flow에 없다.

          if (renderedNodes.length === 0) return;

          void fitView({
            nodes: renderedNodes,
            maxZoom: FIT_NODES_MAX_ZOOM,
            duration: CENTER_NODE_DURATION_MS,
          });
        });
      };

      if (isLayoutRunning()) {
        runAfterNextLayout(fitRenderedNodes);
        return;
      }

      fitRenderedNodes();
    },
    [fitView, getInternalNode, isLayoutRunning, runAfterNextLayout],
  );

  /*
  강의 구간이 시작될 때 설명할 노드들을 한 화면에 모은다. 태그와 달리 숨겨진 대상도 조상을 펼쳐 보여 준다.
  강의가 가리키는 노드가 화면에 없으면 자막과 강조가 가리킬 대상이 사라지기 때문이다. 선택은 바꾸지 않는다.

  펼친 노드는 다음 레이아웃이 끝나야 좌표가 생기므로, 대상이 모두 보이고 계산 중이 아닐 때만 바로 모은다.
  그 사이 삭제된 노드는 React Flow에 없으므로 빼고, 남은 노드가 없으면 화면을 옮기지 않는다.
  */
  const revealNodes = useCallback(
    (clientIds: string[], { maxZoom, duration }: RevealNodesOptions) => {
      expandAncestors(clientIds);

      const fitRenderedNodes = () => {
        window.requestAnimationFrame(() => {
          const renderedNodes = clientIds.flatMap((clientId) =>
            getInternalNode(clientId) ? [{ id: clientId }] : [],
          );

          if (renderedNodes.length === 0) return;

          void fitView({ nodes: renderedNodes, maxZoom, duration });
        });
      };

      const visibleClientIds = new Set(visibleNodes.map((node) => node.id));
      const isAllVisible = clientIds.every((clientId) =>
        visibleClientIds.has(clientId),
      );

      if (isAllVisible && !isLayoutRunning()) {
        fitRenderedNodes();
        return;
      }

      runAfterNextLayout(fitRenderedNodes);
    },
    [
      visibleNodes,
      expandAncestors,
      fitView,
      getInternalNode,
      isLayoutRunning,
      runAfterNextLayout,
    ],
  );

  return { focusNode, fitNodes, revealNodes };
};
