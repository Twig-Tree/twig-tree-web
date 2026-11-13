import { type NodeActionId } from "../lib/shortcuts/nodeActionShortcuts";

/*
노드 옆 버튼·우클릭 메뉴·단축키 안내가 같은 이름을 쓴다. 진입점마다 이름이 다르면 같은 동작으로 알아보기 어렵다.
*/
export const NODE_ACTION_LABELS: Record<NodeActionId, string> = {
  openMemo: "메모 열기",
  addChild: "자식 노드 추가",
  rename: "이름 편집",
  delete: "노드 삭제",
};
