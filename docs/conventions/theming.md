# 테마 규칙

제품 화면의 색과 형태는 테마 파일이 정한다. 컴포넌트는 값을 모르고 역할 이름만 쓴다.

```text
컴포넌트  bg-surface, text-content, rounded-card
    ↓
app/themes/tokens.css   역할 이름을 --theme-* 에 잇는다
    ↓
app/themes/<이름>.css   :root[data-theme="<이름>"] 에서 --theme-* 값을 정한다
```

지금 테마는 Neutral, Soft, Dark이고 기본값은 Neutral이다.

## 테마 선택

사용자는 설정 페이지에서 테마를 고른다. 고른 값은 `localStorage`에 기기별로 저장한다.

```text
설정 페이지        features/theme/select-theme
    ↓
현재 테마와 저장   shared/lib/theme
    ↓
<html data-theme>  CSS가 읽는 현재 테마의 단일 원본
```

`shared/lib/theme`에 두는 이유는 선택 UI와 `features/tree-editor`의 연결선이 함께 쓰기 때문이다. feature에 두면 같은 계층끼리 의존하게 된다.

`시스템 설정 따르기`를 고르면 저장값은 `system`이고, `data-theme`에는 OS 색상 모드에 맞는 실제 테마가 들어간다. 다크면 Dark, 라이트면 Neutral이다. CSS는 `data-theme`만 읽으므로 `system`을 몰라도 된다. `system`을 골랐다는 사실은 `<html data-theme-preference>`에 남겨, OS 색상 모드가 바뀔 때 따라갈지 판단한다.

서버는 저장값을 모르므로 `app/layout.tsx`가 기본 테마로 HTML을 그린다. `<head>`의 인라인 스크립트가 첫 페인트 전에 저장값을 적용해, 다른 테마를 고른 사용자에게 기본 테마가 잠깐 보이지 않게 한다. `next/script`의 `beforeInteractive`는 실행이 hydration을 막지 않으므로 쓰지 않는다. 스크립트가 서버 HTML의 속성을 바꾸므로 `<html>`에 `suppressHydrationWarning`이 필요하다.

JS에서 현재 테마가 필요하면 `useTheme`의 `theme`을 쓴다. `preference`는 사용자가 고른 값이라 `system`일 수 있어 선택 UI에서만 쓴다. CSS 토큰으로 정할 수 있는 값은 토큰으로 정한다.

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
| `success`        | `on-success`                                    |
| `warning`        | `on-warning`                                    |
| `danger`         | `on-danger`                                     |
| `node`, `root`   | `node-content`, `root-content`                  |

패널처럼 바탕이 `surface-muted`인 곳에서는 hover에 같은 색을 쓰면 보이지 않는다. 한 단계 진한 `surface-hover`를 쓴다.

필요한 역할이 없으면 비슷한 이름을 빌리지 말고 토큰을 추가한다. 무엇을 위한 색인지가 이름에 드러나야 다음 테마에서 값을 정할 수 있다.

## React Flow

React Flow는 자기 CSS 변수를 읽으므로 `app/xy-theme.css`가 그 변수에 `--theme-*` 를 넣는다. 이 파일은 Tailwind 유틸리티를 거치지 않고 `--theme-*` 를 직접 참조한다.

## 새 테마 추가

1. 기존 테마 파일을 복사해 `app/themes/<이름>.css`를 만들고, 선택자를 `:root[data-theme="<이름>"]`로 바꿔 값을 정한다.
2. `app/globals.css`에 import를 추가한다.
3. `pnpm exec vitest run app/themes`를 실행한다. `themes.test.ts`가 `app/themes`의 CSS를 모두 찾아, 빠진 값과 글자 대비(4.5:1 미만)를 알려 준다. 대비를 계산하는 색은 `#rrggbb`로 적는다.
4. `shared/lib/theme/themes.ts`의 `THEME_IDS`에 추가한다. 타입 검사가 선택지 이름(`ThemeSelector`)과 연결선 경로(`CustomEdge`)의 빈자리를 알려 준다.
5. 설정 페이지에서 테마를 골라 화면을 확인한다. 트리 캔버스는 끌어서 옮기기, undo/redo, 제목 편집, 접기, 검색 강조까지 본다.

테스트의 글자 대비 목록(`textPairs`)은 화면에서 실제로 겹치는 조합만 담는다. 새로운 조합이 생기면 목록에 추가한다.

## CSS로 정할 수 없는 값

아래 값은 JS가 읽거나 좌표 계산에 쓰여 테마 파일로 바꿀 수 없다.

연결선 경로는 테마별 설정이 있고, 지금은 두 테마의 값이 같다.

| 값                  | 위치                                         |
| ------------------- | -------------------------------------------- |
| 연결선 곡률, offset | `src/features/tree-editor/ui/CustomEdge.tsx` |

아래 값은 모든 테마가 함께 쓴다. 다른 값을 쓰는 테마가 생길 때 테마 설정으로 뺀다. 쓰는 곳이 하나인 동안 미리 추상화하지 않는다.

노드 크기를 테마별로 나누면 테마를 바꿀 때 트리를 다시 배치해야 하고, 노드 위치가 움직인다.

| 값                         | 위치                                               |
| -------------------------- | -------------------------------------------------- |
| 노드 크기 (168×60)         | `src/features/tree-editor/lib/layout.ts`           |
| 노드 간격 (형제 32, 층 64) | `src/features/tree-editor/lib/layout.ts`           |
| 연결선 굵기                | `src/features/tree-editor/ui/CustomEdge.tsx`       |
| 화살촉 크기와 모양         | `src/features/tree-editor/ui/CustomEdge.tsx`       |
| 캔버스 도트 간격, 크기     | `app/(main)/workspace/[workspaceId]/page.tsx`      |
| 축소 하한 (0.3)            | `src/features/tree-editor/constants/flowConfig.ts` |

화살촉의 채움, 도트 색, 접기 버튼의 모양과 위치는 테마 파일에서 정한다.

강의 연출의 시간과 곡선도 모든 테마가 함께 쓴다. `app/xy-theme.css`의 `--lecture-*` 변수에 있고, 테마별로 나누는 방법은 [강의 motion token](../specs/lecture-motion-tokens.md#테마별-값으로-나누기)에 적었다.
