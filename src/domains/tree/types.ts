// 순수 비즈니스 로직 데이터
export type TreeNodeData = {
  label: string;
  isRoot?: boolean;
  order_index: number;
};

// 도메인 로직(ELK 등)이 요구하는 노드 구조
export interface BaseTreeNode {
  id: string;
  position?: { x: number; y: number };
  data: TreeNodeData;
}

export interface BaseTreeEdge {
  id: string;
  source: string;
  target: string;
}
