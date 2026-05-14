import { CustomEditorEdge, CustomEditorNode } from "../model/types";

export const hasCycle = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): boolean => {
  // 1. 인접 리스트 생성
  const adj = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = adj.get(edge.source) || [];
    list.push(edge.target);
    adj.set(edge.source, list);
  });

  const visited = new Set<string>(); // 완전히 탐색 종료된 노드
  const recStack = new Set<string>(); // 현재 탐색 경로에 포함된 노드

  // 2. DFS 함수 정의
  const isCyclic = (nodeId: string): boolean => {
    // 현재 경로에 이미 있다면 순환
    if (recStack.has(nodeId)) return true;
    // 이미 탐색이 끝난 노드라면 통과
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (isCyclic(neighbor)) return true;
    }

    // 3. 역추적: 현재 경로에서 제거
    recStack.delete(nodeId);
    return false;
  };

  // 4. 모든 노드에 대해 검사 (끊어진 그래프가 있을 수 있으므로)
  for (const node of nodes) {
    if (isCyclic(node.id)) return true;
  }
  return false;
};
