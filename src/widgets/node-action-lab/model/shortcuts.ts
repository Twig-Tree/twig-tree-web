import { type NodeActionId } from "./nodeActions";

export type ShortcutPlatform = "mac" | "windows";

/*
맥의 메모 열기 후보. 맥은 Return이 이름 편집(Finder와 같음)이라 메모에 쓸 키를 실험실에서 바꿔 보며 정한다.
- space: Finder 미리 보기와 비슷하다. 다만 React Flow에서 누르고 있으면 캔버스 이동, 강의 중에는 일시정지 키다
- metaEnter: ⌘Return
- metaArrowDown: ⌘↓. Finder에서 항목을 여는 키다
*/
export type MacMemoKey = "space" | "metaEnter" | "metaArrowDown";

type KeyBinding = {
  key: string; // KeyboardEvent.key 값
  meta?: boolean; // ⌘를 함께 눌러야 하는지 여부
};

export type NodeActionShortcut = {
  bindings: KeyBinding[]; // 하나라도 맞으면 그 동작을 실행한다
  label: string; // 메뉴·툴팁·안내에 적는 표기
};

export type NodeActionShortcuts = Record<NodeActionId, NodeActionShortcut>;

const MAC_MEMO_SHORTCUTS: Record<MacMemoKey, NodeActionShortcut> = {
  space: { bindings: [{ key: " " }], label: "Space" },
  metaEnter: { bindings: [{ key: "Enter", meta: true }], label: "⌘Return" },
  metaArrowDown: {
    bindings: [{ key: "ArrowDown", meta: true }],
    label: "⌘↓",
  },
};

/*
Windows는 F2가 탐색기의 이름 바꾸기다. 맥은 F1~F12가 기본으로 밝기·볼륨 같은 시스템 키라 fn 없이는 F2가 앱에 오지 않으므로
Finder와 같이 Return으로 이름을 바꾼다. 맥의 delete 키는 브라우저에 Backspace로 오고, fn+delete가 Delete로 온다.

자식 추가는 두 운영체제 모두 →다. 트리가 오른쪽으로 자라므로 자식이 생기는 방향과 같다. 마인드맵 도구는 흔히 Tab을 쓰지만,
Tab은 키보드 사용자가 화면 요소 사이를 옮겨 다니는 키라 가로채면 캔버스 밖으로 나갈 수 없다.
*/
const WINDOWS_SHORTCUTS: NodeActionShortcuts = {
  openMemo: { bindings: [{ key: "Enter" }], label: "Enter" },
  addChild: { bindings: [{ key: "ArrowRight" }], label: "→" },
  rename: { bindings: [{ key: "F2" }], label: "F2" },
  delete: {
    bindings: [{ key: "Delete" }, { key: "Backspace" }],
    label: "Delete",
  },
};

/*
함수 이름 : getNodeActionShortcuts
기능 : 운영체제와 맥 메모 키 후보에 맞는 노드 동작 단축키 표를 만든다.
인자 : ShortcutPlatform platform -> 단축키를 정할 운영체제
MacMemoKey macMemoKey -> 맥에서 메모 열기에 쓸 키. Windows에서는 쓰지 않는다
반환값 : 동작별 단축키와 표기
*/
export const getNodeActionShortcuts = (
  platform: ShortcutPlatform,
  macMemoKey: MacMemoKey,
): NodeActionShortcuts => {
  if (platform === "windows") return WINDOWS_SHORTCUTS;

  return {
    openMemo: MAC_MEMO_SHORTCUTS[macMemoKey],
    addChild: { bindings: [{ key: "ArrowRight" }], label: "→" },
    rename: { bindings: [{ key: "Enter" }], label: "Return" },
    delete: {
      bindings: [{ key: "Backspace" }, { key: "Delete" }],
      label: "⌫",
    },
  };
};

type PressedKey = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/*
함수 이름 : getNodeActionForKey
기능 : 누른 키가 어느 노드 동작의 단축키인지 찾는다. 수정키는 단축키에 적힌 것과 정확히 같아야 한다.
인자 : PressedKey pressed -> 누른 키와 수정키 상태
NodeActionShortcuts shortcuts -> 지금 쓰는 단축키 표
반환값 : 맞는 동작, 없으면 null

Shift+→처럼 수정키가 더 붙은 키를 맞다고 보면 텍스트 선택 같은 다른 키 조합까지 자식 추가로 가로챈다.
*/
export const getNodeActionForKey = (
  pressed: PressedKey,
  shortcuts: NodeActionShortcuts,
): NodeActionId | null => {
  if (pressed.ctrlKey || pressed.altKey || pressed.shiftKey) return null;

  const entry = Object.entries(shortcuts).find(([, shortcut]) =>
    shortcut.bindings.some(
      (binding) =>
        binding.key === pressed.key &&
        (binding.meta ?? false) === pressed.metaKey,
    ),
  );

  return entry ? (entry[0] as NodeActionId) : null;
};
