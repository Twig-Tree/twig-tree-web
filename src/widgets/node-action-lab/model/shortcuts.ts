import { type NodeActionId } from "./nodeActions";

export type ShortcutPlatform = "mac" | "windows";

export type NodeActionShortcut = {
  keys: string[]; // KeyboardEvent.key 값. 하나라도 맞으면 그 동작을 실행한다
  label: string; // 메뉴·툴팁·안내에 적는 표기
};

export type NodeActionShortcuts = Record<NodeActionId, NodeActionShortcut>;

/*
Windows는 F2가 탐색기의 이름 바꾸기다. 맥은 F1~F12가 기본으로 밝기·볼륨 같은 시스템 키라 fn 없이는 F2가 앱에 오지 않으므로
Finder와 같이 Return으로 이름을 바꾼다. 맥의 delete 키는 브라우저에 Backspace로 오고, fn+delete가 Delete로 온다.

맥은 Return을 이름 편집에 쓰므로 메모는 Finder 미리 보기처럼 Space로 연다. Space는 React Flow에서 누르고 있으면 캔버스 이동 키지만,
노드가 선택되어 있을 때만 메모 열기로 가로채므로 선택이 없으면 캔버스 이동은 그대로다.

자식 추가는 두 운영체제 모두 →다. 트리가 오른쪽으로 자라므로 자식이 생기는 방향과 같다. 마인드맵 도구는 흔히 Tab을 쓰지만,
Tab은 키보드 사용자가 화면 요소 사이를 옮겨 다니는 키라 가로채면 캔버스 밖으로 나갈 수 없다.
*/
const SHORTCUTS_BY_PLATFORM: Record<ShortcutPlatform, NodeActionShortcuts> = {
  windows: {
    openMemo: { keys: ["Enter"], label: "Enter" },
    addChild: { keys: ["ArrowRight"], label: "→" },
    rename: { keys: ["F2"], label: "F2" },
    delete: { keys: ["Delete", "Backspace"], label: "Delete" },
  },
  mac: {
    openMemo: { keys: [" "], label: "Space" },
    addChild: { keys: ["ArrowRight"], label: "→" },
    rename: { keys: ["Enter"], label: "Return" },
    delete: { keys: ["Backspace", "Delete"], label: "⌫" },
  },
};

/*
함수 이름 : getNodeActionShortcuts
기능 : 운영체제에 맞는 노드 동작 단축키 표를 돌려준다.
인자 : ShortcutPlatform platform -> 단축키를 정할 운영체제
반환값 : 동작별 단축키와 표기
*/
export const getNodeActionShortcuts = (
  platform: ShortcutPlatform,
): NodeActionShortcuts => SHORTCUTS_BY_PLATFORM[platform];

type PressedKey = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/*
함수 이름 : getNodeActionForKey
기능 : 누른 키가 어느 노드 동작의 단축키인지 찾는다. 단축키는 모두 수정키 없이 누르는 키다.
인자 : PressedKey pressed -> 누른 키와 수정키 상태
NodeActionShortcuts shortcuts -> 지금 쓰는 단축키 표
반환값 : 맞는 동작, 없으면 null

Shift+→나 ⌘→처럼 수정키가 붙은 키를 맞다고 보면 텍스트 선택이나 브라우저 단축키까지 노드 동작으로 가로챈다.
*/
export const getNodeActionForKey = (
  pressed: PressedKey,
  shortcuts: NodeActionShortcuts,
): NodeActionId | null => {
  if (
    pressed.metaKey ||
    pressed.ctrlKey ||
    pressed.altKey ||
    pressed.shiftKey
  ) {
    return null;
  }

  const entry = Object.entries(shortcuts).find(([, shortcut]) =>
    shortcut.keys.includes(pressed.key),
  );

  return entry ? (entry[0] as NodeActionId) : null;
};
