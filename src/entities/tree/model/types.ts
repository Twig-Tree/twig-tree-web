/**
 * 서비스 전반에서 사용하는 순수 노드 데이터 (Entity)
 * UI 관련 속성(position 등)이 없는 순수 지식 모델입니다.
 *
 * 필드를 중첩하지 않고 평평하게 둔다. 중첩은 React Flow의 Node가 id·position을 최상위에 두고
 * 나머지를 data에 담도록 정한 모양이므로, 화면 라이브러리를 아는 features 쪽에서 만든다.
 */
export interface TreeNode {
  id: string; // 서버가 확정한 노드 ID
  parentId: string | null; // 부모가 없는 루트 노드는 null이다.
  label: string;
  orderIndex: number;
  memo: string | null; // 백엔드는 빈 문자열을 주고받지 않으므로 메모 없음은 null로만 표현한다.
}
