import { type ShortcutPlatform } from "./nodeActionShortcuts";

export type UndoRedoActionId = "undo" | "redo";

export type UndoRedoShortcut = {
  label: string; // 툴팁·안내에 적는 표기
  ariaKeyShortcuts: string; // aria-keyshortcuts 값. 키가 여럿이면 공백으로 잇는다
};

export type UndoRedoShortcuts = Record<UndoRedoActionId, UndoRedoShortcut>;

/*
Windows의 다시 실행은 Ctrl+Shift+Z와 Ctrl+Y를 모두 받는다. 표기는 실행 취소와 짝을 이루는 Ctrl+Shift+Z 하나만 적고,
Ctrl+Y는 aria-keyshortcuts에만 남긴다. 둘 다 적으면 좁은 안내 패널에서 줄이 넘친다.
*/
const SHORTCUTS_BY_PLATFORM: Record<ShortcutPlatform, UndoRedoShortcuts> = {
  windows: {
    undo: { label: "Ctrl+Z", ariaKeyShortcuts: "Control+Z" },
    redo: {
      label: "Ctrl+Shift+Z",
      ariaKeyShortcuts: "Control+Shift+Z Control+Y",
    },
  },
  mac: {
    undo: { label: "⌘Z", ariaKeyShortcuts: "Meta+Z" },
    redo: { label: "⌘⇧Z", ariaKeyShortcuts: "Meta+Shift+Z" },
  },
};

/*
함수 이름 : getUndoRedoShortcuts
기능 : 운영체제에 맞는 실행 취소·다시 실행 단축키 표기를 돌려준다.
인자 : ShortcutPlatform platform -> 표기를 정할 운영체제
반환값 : 동작별 표기와 aria-keyshortcuts 값
*/
export const getUndoRedoShortcuts = (
  platform: ShortcutPlatform,
): UndoRedoShortcuts => SHORTCUTS_BY_PLATFORM[platform];

type PressedKey = Pick<
  KeyboardEvent,
  "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/*
함수 이름 : getPressedLetter
기능 : 누른 키의 라틴 글자를 소문자로 돌려준다.
인자 : PressedKey pressed -> 누른 키
반환값 : 글자, 글자 키가 아니면 null

글자는 key로 읽는다. code는 자판의 물리 위치라, Dvorak·AZERTY처럼 배치가 다른 자판에서 code로 읽으면 다른 글자 키가 실행 취소가 된다.
한글 입력 상태에서는 ⌘Z의 key가 "ㅋ"처럼 올 수 있어, key가 ASCII 밖의 글자일 때만 code로 읽는다.
";"처럼 ASCII 기호는 다른 자판의 실제 글자이므로 code로 바꿔 읽지 않는다.
Shift를 함께 누르면 key가 대문자로 오는 브라우저가 있어 소문자로 맞춘다.
*/
const getPressedLetter = ({ key, code }: PressedKey): string | null => {
  if (/^[a-z]$/i.test(key)) return key.toLowerCase();
  if (key.length !== 1 || key.charCodeAt(0) <= 0x7f) return null;

  const codeMatch = /^Key([A-Z])$/.exec(code);

  return codeMatch ? codeMatch[1].toLowerCase() : null;
};

/*
함수 이름 : getUndoRedoActionForKey
기능 : 누른 키가 실행 취소·다시 실행 단축키인지 찾는다.
인자 : PressedKey pressed -> 누른 키와 수정키 상태
ShortcutPlatform platform -> 지금 기기의 운영체제
반환값 : 맞는 동작, 없으면 null

맥은 ⌘, Windows는 Ctrl만 받는다. 맥의 Ctrl+Z와 Windows의 Win+Z는 그 기기의 실행 취소 키가 아니다.
⌥(Alt)가 붙으면 다른 단축키이므로 받지 않는다.
*/
export const getUndoRedoActionForKey = (
  pressed: PressedKey,
  platform: ShortcutPlatform,
): UndoRedoActionId | null => {
  const isPrimaryModifier =
    platform === "mac"
      ? pressed.metaKey && !pressed.ctrlKey
      : pressed.ctrlKey && !pressed.metaKey;

  if (!isPrimaryModifier || pressed.altKey) return null;

  const letter = getPressedLetter(pressed);

  if (letter === "z") return pressed.shiftKey ? "redo" : "undo";
  if (letter === "y" && platform === "windows" && !pressed.shiftKey) {
    return "redo";
  }

  return null;
};
