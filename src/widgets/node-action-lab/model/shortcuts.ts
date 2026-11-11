import { type NodeActionId } from "./nodeActions";

type NodeActionShortcut = {
  keys: string[]; // KeyboardEvent.key 값. 하나라도 맞으면 그 동작을 실행한다
  label: string; // 메뉴·툴팁·안내에 적는 표기
};

/*
노드 동작의 단축키 초안. 메뉴·툴팁·안내가 모두 이 표를 읽으므로, 키를 바꿔 볼 때는 여기만 고친다.
Delete와 Backspace는 #169에서 React Flow 기본 삭제 키로 끈 키를 삭제 동작에 다시 잇는 모습이다.
*/
export const NODE_ACTION_SHORTCUTS: Record<NodeActionId, NodeActionShortcut> = {
  openMemo: { keys: ["Enter"], label: "Enter" },
  addChild: { keys: ["Tab"], label: "Tab" },
  rename: { keys: ["F2"], label: "F2" },
  delete: { keys: ["Delete", "Backspace"], label: "Delete" },
};
