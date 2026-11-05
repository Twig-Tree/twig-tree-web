# 테마 규칙

제품 화면의 색과 형태는 테마 파일이 정한다. 컴포넌트는 값을 모르고 역할 이름만 쓴다.

```text
컴포넌트  bg-surface, text-content, rounded-card
    ↓
app/themes/tokens.css   역할 이름을 --theme-* 에 잇는다
    ↓
app/themes/soft.css     :root[data-theme="soft"] 에서 --theme-* 값을 정한다
```

테마는 `app/layout.tsx`의 `<html data-theme="soft">`로 고른다. 지금은 Soft 하나뿐이고 사용자가 바꾸는 화면은 없다.

## 컴포넌트에서

Tailwind 기본 팔레트와 색 값을 직접 쓰지 않는다.

```tsx
// 사용하지 않는다.
<div className="border-slate-200 bg-white text-slate-900" />

// 역할 이름을 쓴다.
<div className="border-line bg-surface text-content" />
```

`app/themes/rawColors.test.ts`가 제품 코드의 기본 색 클래스와 CSS의 색 값을 찾아 CI에서 실패시킨다. Workspace UI Lab(`src/widgets/workspace-lab`)은 여러 테마를 비교하는 실험실이라 제외한다. 이 테스트는 문자열을 읽으므로 `style` prop에 넣은 색이나 형태 클래스(`rounded-lg`, `shadow-md`)는 잡지 못한다. 이런 값도 같은 규칙을 따른다.

바탕과 글자는 이름이 짝을 이룬다.

| 바탕             | 글자                                            |
| ---------------- | ----------------------------------------------- |
| `surface` 계열   | `content`, `content-secondary`, `content-muted` |
| `accent`         | `on-accent`                                     |
| `inverse`        | `on-inverse`                                    |
| `danger-subtle`  | `danger`                                        |
| `warning-subtle` | `warning`, `warning-strong`                     |
| `node`, `root`   | `node-content`, `root-content`                  |

패널처럼 바탕이 `surface-muted`인 곳에서는 hover에 같은 색을 쓰면 보이지 않는다. 한 단계 진한 `surface-hover`를 쓴다.

필요한 역할이 없으면 비슷한 이름을 빌리지 말고 토큰을 추가한다. 무엇을 위한 색인지가 이름에 드러나야 다음 테마에서 값을 정할 수 있다.

## React Flow

React Flow는 자기 CSS 변수를 읽으므로 `app/xy-theme.css`가 그 변수에 `--theme-*` 를 넣는다. 이 파일은 Tailwind 유틸리티를 거치지 않고 `--theme-*` 를 직접 참조한다.

## 새 테마 추가

1. `app/themes/soft.css`를 복사해 `app/themes/<이름>.css`를 만들고, 선택자를 `:root[data-theme="<이름>"]`로 바꿔 값을 정한다.
2. `app/globals.css`에 import를 추가한다.
3. `pnpm exec vitest run app/themes`를 실행한다. `themes.test.ts`가 `app/themes`의 CSS를 모두 찾아, 빠진 값과 글자 대비(4.5:1 미만)를 알려 준다. 대비를 계산하는 색은 `#rrggbb`로 적는다.
4. `<html data-theme>`를 바꿔 화면을 확인한다. 트리 캔버스는 끌어서 옮기기, undo/redo, 제목 편집, 접기, 검색 강조까지 본다.

테스트의 글자 대비 목록(`textPairs`)은 화면에서 실제로 겹치는 조합만 담는다. 새로운 조합이 생기면 목록에 추가한다.

## CSS로 정할 수 없는 값

아래 값은 JS가 읽거나 컴포넌트 구조에 묶여 있어 테마 파일로 바꿀 수 없다. 지금은 Soft 값이 코드에 직접 있고, 다른 값을 쓰는 테마가 생길 때 테마 설정으로 뺀다. 쓰는 곳이 하나인 동안 미리 추상화하지 않는다.

| 값                        | 위치                                                   |
| ------------------------- | ------------------------------------------------------ |
| 노드 크기 (168×60)        | `src/features/tree-editor/lib/layout.ts`               |
| 노드 간격 (80)            | `src/features/tree-editor/lib/layout.ts`               |
| 연결선 곡선, 굵기, 화살촉 | `src/features/tree-editor/ui/CustomEdge.tsx`           |
| 접기 버튼 모양과 위치     | `src/features/tree-editor/ui/CollapseToggleButton.tsx` |
| 축소 하한 (0.3)           | `src/features/tree-editor/constants/flowConfig.ts`     |
