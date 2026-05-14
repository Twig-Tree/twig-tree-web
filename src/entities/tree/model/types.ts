/**
 * 서비스 전반에서 사용하는 순수 노드 데이터 (Entity)
 * UI 관련 속성(position 등)이 없는 순수 지식 모델입니다.
 */
export type TreeNodeData = {
  label: string;
  orderIndex: number;
  memo?: string;
};

// Zustand 등에서 관리할 평면화된 노드 타입
export interface TreeNode {
  id: string;
  parentId: string | null;
  data: TreeNodeData;
}
