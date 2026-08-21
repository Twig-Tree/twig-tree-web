/**
 * 서비스 전반에서 사용하는 순수 노드 데이터 (Entity)
 * UI 관련 속성(position 등)이 없는 순수 지식 모델입니다.
 */
export type TreeNodeData = {
  label: string;
  orderIndex: number;
  memo: string | null; // 백엔드는 빈 문자열을 주고받지 않으므로 메모 없음은 null로만 표현한다.
};

// Zustand 등에서 관리할 평면화된 노드 타입
export interface TreeNode {
  id: string;
  parentId: string | null;
  data: TreeNodeData;
}
