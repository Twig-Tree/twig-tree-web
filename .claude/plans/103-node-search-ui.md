# #103 워크스페이스 노드 검색 UI와 결과 강조·포커싱

브랜치: `feat/node-search-ui` (#109가 머지되기 전이라 `feat/stable-editor-viewport` 위에서 분기)

## 진행 상황 (다른 곳에서 이어갈 때 먼저 읽기)

| 단계                                                         | 상태 | 커밋 |
| ------------------------------------------------------------ | ---- | ---- |
| 1. 검색·조상 계산 순수 함수                                  | 완료 | `a74e693` |
| 2. 강조 store와 노드 강조 스타일                             | 완료 | `c592bee` |
| 3. 워크스페이스 패널, 검색창, 결과 목록, 강조 연결           | 완료 | `2240824` |
| 4. 결과 클릭 시 선택·포커싱·메모 패널 열기 (보이는 노드)     | 완료 | `e7f8312` |
| 5. 접힌 노드로 포커싱: 조상 펼치기와 레이아웃 뒤 이동         | 완료 | `f496d1f` |
| 6. README 정리와 전체 브라우저 확인                           | 대기 |      |

### 다른 곳에서 이어갈 때

- **브랜치 기준:** #109(PR, `feat/stable-editor-viewport`)가 아직 머지되지 않아 그 위에서 분기했다. 4·5단계가 #109의 `useEditorLayout`(처음 열 때만 화면 맞춤)에 기대기 때문이다. main은 머지 커밋 방식이라 #109가 머지되면 그대로 이어진다. PR은 #109 머지 후 main 기준으로 올린다.
- **커밋한 코드는 모두 `vitest`, `tsc`, eslint를 통과했다.** 1~5단계 브라우저 확인은 `리액트 #20` 워크스페이스(트리 11)에서 했다.
- **남은 6단계:** README 정리와, 아직 브라우저에서 확인하지 못한 항목
  - "메모" 배지와 메모 일치 시 메모 패널 열림: 확인한 트리에 메모가 있는 노드가 없었다. 메모를 저장하면 백엔드 데이터가 바뀌므로 사용자가 직접 저장한 뒤 확인하기로 했다.
  - 노드 추가·삭제 요청 중 결과 클릭 막힘: 결과 목록 컴포넌트 테스트로만 확인했다.
- **작업 방식:** 단계마다 구현 → 확인 → 사용자 승인 후 커밋. 4단계에서 사용자가 `useEditorLayout`의 변경이 너무 크다고 해 줄였다(결정 6). 레이아웃 hook에는 최소한만 더하고 화면 이동은 `useFocusNode`에 둔다.
- **브라우저 확인 팁:** 내장 브라우저 탭이 숨김(`document.hidden`) 상태가 되면 `requestAnimationFrame`이 돌지 않아 화면 이동이 일어나지 않는다. 클릭한 뒤 탭을 앞으로 가져와(`tabs_select`) 1초쯤 기다렸다가 확인한다. 접힘 상태를 바꿔 확인했으면 `localStorage`의 `twig-tree:collapsed-nodes:11`을 원래 값(`["101","104"]`)으로 되돌린다.
- stash `stash@{0}`에 #108 3단계(레이아웃 뒤 화면 처리 요청 store) 구현이 남아 있다. 이 계획의 결정 6과 관련 있으니 지우지 않는다. 다른 기기에는 stash가 없다.

## 목표

워크스페이스 화면 왼쪽에 검색창이 있는 워크스페이스 패널을 두고, 검색 결과 목록에서 노드를 골라 그 노드로 이동한다. API 없이 편집기에 있는 노드 데이터로 동작한다. 결과 목록·강조·포커싱은 #105(태그 UI)가 그대로 재사용한다.

- 검색어가 노드 이름이나 메모에 들어 있는 노드를 결과 목록에 보여준다. 메모에서 일치했으면 표시한다.
- 결과 노드들을 캔버스에서 선택과 다른 색(amber) 테두리로 강조한다. 나머지 노드는 흐리게 하지 않는다.
- 결과 항목을 클릭하면 접힌 조상을 펼치고, 그 노드를 선택하고, 화면 가운데로 옮긴다. 메모에서 일치한 노드면 메모 패널도 연다.
- 검색어를 지우면 결과 목록과 강조가 사라진다.

## 현황 (착수 전 기준, #109 머지 가정)

- **페이지 구조:** `app/(main)/workspace/[workspaceId]/page.tsx`의 `LayoutFlow`가 `<ReactFlow>`와 메모 패널(`MemoSidePanel`, 360px)을 가로로 놓는다. `LayoutFlow`는 `ReactFlowProvider` 안에 있어 `useReactFlow`를 쓸 수 있고, 메모 패널이 열려 있는지는 `LayoutFlow`의 `isMemoPanelOpen` state가 갖고 있다. 트리 조회 중·실패 시에는 `LayoutFlow`가 캔버스 대신 안내 문구만 그린다.
- **네비게이션 사이드바:** #43(#107)으로 모든 화면에서 64px 아이콘형이다. `app/(main)/layout.tsx`에 있어 워크스페이스 페이지의 상태에 접근할 수 없다.
- **노드 데이터:** editor store(`treeStore`)의 노드는 `data.label`(이름), `data.memo`(`string | null`), `data.serverId`를 갖는다. 노드 `id`는 clientId다. 트리 구조는 엣지가 들고 있고(`source`가 부모), 노드에는 부모 정보가 없다.
- **선택:** `useTreeEditorActions`가 store 노드 중 `selected`가 `true`인 첫 노드를 `selectedNode`로 쓴다. 메모 패널과 노드 추가·삭제가 이 노드를 기준으로 동작한다. `selected`만 바꾸는 `set`은 `handleSet`의 기록 조건(노드·엣지 개수, `orderIndex`)에 걸리지 않아 undo history에 들어가지 않는다.
- **접힘:** `collapseStore`가 접힌 노드의 `serverId` 집합을 들고, `useVisibleElements`가 그 자손을 걸러 낸 배열을 `<ReactFlow>`와 `useEditorLayout`에 함께 넘긴다. 선택된 노드가 숨겨지면 `useVisibleElements`의 effect가 선택을 풀고 메모 패널을 닫는다. 한 노드를 펼치는 `expand(treeId, serverId)`가 있고, 부를 때마다 `localStorage`에 저장한다.
- **레이아웃과 화면:** `useEditorLayout`은 보이는 구조가 바뀔 때마다 ELK(`mrtree`)로 배치를 비동기로 계산해 `mergeLayoutResult`로 좌표를 얹는다. 트리 전체 맞춤(`fitView({ maxZoom: 1 })`)은 노드가 있는 첫 레이아웃 뒤에 한 번, 그리고 "Fit View" 버튼을 누를 때만 한다. 그 밖에는 레이아웃 뒤 화면을 옮기지 않는다.
- **노드 스타일:** 노드 테두리는 바깥 래퍼 `.react-flow__node`가 그리고(`app/xy-theme.css`), 선택되면 분홍(`--xy-theme-selected: #f57dbd`)으로 바뀐다. `CustomNode`가 그리는 `.custom-node`는 그 안쪽 요소다. React Flow는 노드 객체의 `className`만 래퍼에 붙인다.
- React Flow 12.10.2. `setCenter(x, y, { zoom })`는 `zoom`을 넘기지 않으면 현재 배율이 아니라 **`maxZoom`(기본 2)으로 확대한다.** React Flow의 키보드 처리(노드 삭제 등)는 `input`에서 일어난 키 입력을 무시한다(`isInputDOMNode`).

## 결정 사항

### 1. 검색·강조·포커싱 로직은 `features/tree-editor`에 두고, 패널은 `widgets/workspace`에 둔다

- 강조 상태는 `CustomNode`가 읽어야 한다. `CustomNode`는 `features/tree-editor`에 있으므로 강조 store도 같은 feature에 있어야 한다. 위 계층(`widgets`)에 두면 `CustomNode`가 import할 수 없다.
- 검색(지금은 editor store에서, #104부터는 서버 결과를 editor store 노드에 대응)과 포커싱(펼치기·선택·화면 이동)도 editor store, 접힘 store, 레이아웃에 묶여 있다. FSD 규칙의 "이 로직이 어느 store와 화면 흐름에 묶여 있는가" 기준으로 `tree-editor` 안에 둔다. `features/node-search`로 빼면 `tree-editor`의 store를 참조하는 같은 계층 간 의존이 생긴다.
- `model` 아래 새 책임 디렉터리:
  - `model/search/`: 검색어로 결과를 만들고 강조 store에 반영하는 hook (`useNodeSearch`)
  - `model/highlight/`: 강조 store
  - `model/focus/`: 결과로 이동하는 hook (`useFocusNode`)
- 순수 함수는 `lib/search/`(노드 검색)와 `lib/getAncestorClientIds.ts`(조상 계산)에 둔다.
- 패널(`WorkspacePanel`), 검색창, 결과 목록(`NodeResultList`)은 `widgets/workspace/ui/`에 둔다. 화면 조각을 조합할 뿐 store를 직접 만지지 않는다.

### 2. 임시 데이터는 editor store의 노드에서 프론트가 직접 찾는다

이슈의 "임시 데이터로 동작 확인"을 고정된 가짜 목록 대신 **editor store의 실제 노드를 프론트에서 검색**하는 것으로 한다.

- 가짜 목록은 지금 열린 트리의 clientId와 대응되지 않아 강조·포커싱을 확인할 수 없다. 실제 노드를 검색하면 모든 흐름을 실제 트리로 확인할 수 있다.
- #104에서도 응답에 일치 위치(이름/메모)가 없으면 editor store의 이름·메모와 비교해 프론트에서 판단한다. 그 비교가 이 함수와 같다.
- #104에서는 `useNodeSearch` 안에서 결과의 출처만 서버 query로 바꾼다. 결과 타입과 그 아래(목록·강조·포커싱)는 그대로다.

검색 규칙 (`searchEditorNodes(nodes, keyword)`):

- 검색어는 앞뒤 공백을 지운다. 비면 검색하지 않고 `[]`를 돌려준다. "결과 없음"과 "검색어 없음"은 호출부가 검색어로 구분한다. 결과 목록에서 "일치하는 노드가 없습니다" 안내는 검색어가 있을 때만 보인다.
- 이름 또는 메모에 검색어가 들어 있으면 일치. 대소문자는 무시한다(#104 백엔드 명세와 같다). `memo`가 `null`이면 메모 불일치다.
- **접혀서 숨겨진 노드도 검색한다.** 숨겨진 노드를 찾아 펼쳐 주는 것이 이 기능의 주요 쓰임이다. 그래서 `visibleNodes`가 아니라 store의 전체 `nodes`를 넘긴다.
- 결과 순서는 노드 배열 순서다. 형제끼리는 화면 위→아래 순서와 같다. 트리 전체의 깊이 우선 순서로 정렬하는 것은 브라우저에서 보고 필요하면 한다.
- 결과 타입은 태그 UI에서도 쓰므로 검색에 묶이지 않은 이름으로 둔다.

  ```ts
  export type NodeResult = {
    clientId: string; // 강조·포커싱할 편집기 노드 ID
    label: string; // 목록에 보여 줄 노드 이름
    isMemoMatched: boolean; // 메모에서 일치했는지. 태그 결과는 false
  };
  ```

- 입력 때마다 바로 검색한다. 노드 수가 적고 메모리 안의 비교라 debounce가 필요 없다. 서버 요청이 생기는 #104에서 debounce를 둔다.

### 3. 강조 상태는 별도 store에 두고, 편집기를 벗어날 때 비운다

`model/highlight/highlightStore.ts`에 zustand store를 둔다.

- 상태: `highlightedClientIds: ReadonlySet<string>`
- action: `setHighlight(clientIds: string[])`, `clearHighlight()`
- **`treeStore`에 넣지 않는 이유**는 접힘 store와 같다. 강조는 undo 대상이 아니고, `treeStore`의 `set`마다 도는 `handleSet` 비교를 거치지 않아야 한다. React Flow 노드의 `className`에 써 넣는 방식도 `nodes`가 history 스냅숏에 들어가므로 쓰지 않는다.
- `CustomNode`는 `useHighlightStore((state) => state.highlightedClientIds.has(id))`로 구독한다. 결과가 boolean이라 강조 집합이 바뀌어도 자기 결과가 같은 노드는 다시 그려지지 않는다.
- **편집기를 벗어날 때** `useInitializeTree`의 언마운트 effect에서 `resetTree`·`resetCollapse`와 함께 `clearHighlight`를 부른다. 다른 워크스페이스로 이동해도 페이지가 새로 마운트되므로 여기서 비워진다.
- **누가 강조를 쓰는가:** 이번에는 `useNodeSearch`가 결과가 바뀔 때마다 effect로 `setHighlight`를 부르고, 검색어가 비면 `clearHighlight`를 부른다. #104에서 결과가 비동기 query로 바뀌어도 같은 경로다. 검색과 태그가 강조를 함께 쓸 때의 우선순위는 #105에서 정한다.
- 강조 대상이 접혀서 숨겨져 있으면 화면에 강조가 보이지 않는다. 접힌 조상을 대신 강조할지는 브라우저에서 보고 범위 밖으로 남긴다.

### 4. 강조 스타일은 바깥 래퍼에 `outline`으로, 선택과 함께 보이게 한다

- 테두리는 래퍼 `.react-flow__node`가 그리는데, `CustomNode`는 안쪽 `.custom-node`만 그린다. 노드 객체의 `className`은 결정 3의 이유로 쓰지 않는다.
- 그래서 `CustomNode`의 `.custom-node`에 `data-highlighted` 속성을 붙이고, `app/xy-theme.css`에서 `:has()`로 래퍼를 꾸민다.

  ```css
  .react-flow__node:has(> .custom-node[data-highlighted="true"]) {
    outline: 2px solid var(--xy-theme-highlighted);
    outline-offset: 2px;
  }
  ```

- `border`가 아닌 `outline`을 쓰면 선택(분홍 `border-color`)과 강조(amber `outline`)가 겹쳐도 둘 다 보인다. 강조된 노드를 클릭해 선택해도 강조가 남는다.
- 색은 `--xy-theme-highlighted`(amber 계열)로 기존 테마 변수들과 같은 `.react-flow` 블록에 추가한다. 정확한 값과 두께는 브라우저에서 선택·hover·focus 스타일과 나란히 보고 정한다.

### 5. 결과 클릭은 펼치기·선택·이동 요청을 한 handler에서 동기로 한다

`useFocusNode`의 `focusNode(clientId)`가 다음을 같은 이벤트 안에서 차례로 한다.

1. **접힌 조상 펼치기:** `getAncestorClientIds(edges, clientId)`로 조상을 구하고, 그중 `serverId`가 접힘 집합에 있는 것을 모두 펼친다.
2. **선택:** 대상 노드만 `selected: true`, 나머지는 `false`로 바꾼다.
3. **화면 이동:** 보이는 노드면 바로, 아니면 `useEditorLayout`의 `runAfterNextLayout`에 맡겨 레이아웃 뒤에 옮긴다(결정 6).

페이지는 이 뒤에 `isMemoMatched`이면 `setIsMemoPanelOpen(true)`를 한다.

- **1과 2는 같은 렌더에 반영되어야 한다.** 선택만 먼저 반영되면, 대상이 아직 숨겨진 상태에서 `useVisibleElements`의 effect가 "선택된 노드가 숨겨졌다"고 보고 선택을 풀고 메모 패널을 닫는다. 두 store 변경을 같은 이벤트 handler 안에서 동기로 하면 React가 한 번에 렌더한다. 이 순서와 이유를 handler에 주석으로 남긴다.
- **여러 조상을 한 번에 펼치는 action을 추가한다.** 지금의 `expand`는 부를 때마다 `localStorage`에 쓰고 다른 탭에 `storage` 이벤트를 일으킨다. `collapseStore`에 `expandAll(treeId, serverIds)`를 두고 한 번만 저장한다. 펼친 상태는 저장한다(자식 추가 때의 자동 펼치기와 같다).
- 접힌 조상은 항상 `serverId`가 있다(접힘 집합이 `serverId`로 되어 있다). `serverId`가 없는 조상은 접혀 있을 수 없으므로 건너뛴다.
- **선택 action:** `treeStore`에 `selectOnlyNodeInStore(clientId)`를 둔다. `selected`만 바꾸므로 history에 기록되지 않는다(`useVisibleElements`가 선택을 풀 때와 같다).
- **노드 추가·삭제 요청 중(`isMutating`)에는 결과 클릭을 막는다.** 요청 중에는 `<ReactFlow>`의 선택(`elementsSelectable`)도 막혀 있으므로 선택을 바꾸는 다른 경로도 같이 막는다. 검색 입력과 강조는 막지 않는다.
- 메모 패널은 `MemoEditor`를 `selectedNode.id`로 key를 주어 그린다. 메모를 편집하던 중 다른 결과를 누르면 저장하지 않은 입력이 사라진다. 지금 캔버스에서 다른 노드를 클릭할 때와 같은 동작이라 이번에 바꾸지 않는다.

### 6. 화면 이동은 레이아웃이 대상 노드의 좌표를 얹은 뒤에 한다

대상이 숨겨져 있었다면 펼친 뒤의 레이아웃이 끝나야 좌표가 생긴다. 그 전의 store 좌표는 숨기기 전 좌표거나 원점이다.

4단계 구현 후 사용자 요청으로 `useEditorLayout`의 변경을 줄였다. 처음에는 `centerNode`와 계산 진행 여부 판단까지 `useEditorLayout`에 두었으나, `useEditorLayout`은 "다음 레이아웃 결과를 얹은 뒤 함수 하나를 실행"하는 것만 맡고 화면 이동은 `useFocusNode`가 한다.

- **`useEditorLayout`:** `runAfterNextLayout(callback)`을 제공한다. 맡긴 함수는 ref 하나에 두고, 최신 계산의 결과를 얹은 뒤 꺼내 실행한다. 최신 계산이 실패하면 버린다. 남겨 두면 나중의 관계없는 레이아웃 뒤에 실행된다. 기다리는 사이 새로 맡기면 나중 것으로 덮는다.
- **`useFocusNode`:** 대상이 보이는 노드(`visibleNodes`)에 있고 계산 중이 아니면 바로 옮기고, 아니면 `runAfterNextLayout`에 이동을 맡긴다. 펼치기와 함께 부르면 그 시점의 `visibleNodes`는 펼치기 전 배열이라 대상이 없고, 펼친 렌더에서 시작된 레이아웃 결과를 얹은 뒤 옮긴다.
- **이동 방법:** 다음 프레임(`requestAnimationFrame`)에 `getNodesBounds([clientId])`로 렌더된 노드의 상자를 읽어 그 가운데로 `setCenter(x, y, { zoom: getZoom(), duration })`를 부른다. 그 사이 삭제되었거나 여전히 숨겨진 노드(`getInternalNode`가 없음)는 옮기지 않는다.
- **배율은 바꾸지 않는다.** `setCenter`는 `zoom`을 빼면 `maxZoom`(2)으로 확대하므로 반드시 현재 배율을 넘긴다. 최소 배율을 둘지는 브라우저에서 보고 정한다.
- `duration`은 300ms로 둔다.
- **레이아웃 계산 중이면 보이는 노드도 기다린다 (5단계에서 되살림).** `useEditorLayout`이 `isLayoutRunning()`을 제공한다. 4단계에서는 이 처리를 빼서 diff를 줄였는데, 5단계 브라우저 확인에서 접힌 형제 둘을 연달아 누르면 두 번째 노드가 이미 보이는 것으로 잡혀 바로 옮겨지고, 첫 클릭이 미뤄 둔 이동이 레이아웃 뒤에 실행되어 마지막 클릭을 덮었다. 사용자 확인 후 되살렸다.
- **빼낸 처리 (사용자 확인):** 트리를 연 직후 첫 화면 맞춤 전에 누른 경우의 우선순위 처리를 두지 않는다. 패널은 트리를 불러온 뒤에 보이고 첫 계산도 바로 끝나 겹칠 일이 거의 없다.
- **#108 남은 작업과의 관계:** #108의 "레이아웃 뒤 화면 처리 요청" store(stash에 3단계 구현이 있다)를 진행하면 `runAfterNextLayout`을 그 store의 "가운데로" 요청으로 옮긴다.

### 7. 워크스페이스 패널은 캔버스 왼쪽에 항상 열어 둔다

- `LayoutFlow`의 가로 배치를 `WorkspacePanel` | 캔버스 | 메모 패널로 바꾼다. 패널은 `LayoutFlow` 안에 있어 트리를 다 불러온 뒤에 보인다.
- 너비는 256px(`w-64`)로 시작한다. 네비게이션(64) + 패널(256) + 메모 패널(360) = 680px이라 1280px 화면에서도 캔버스가 600px 남는다.
- 모양은 메모 패널과 맞춘다(흰 배경, `border-r border-slate-200`, slate 계열 글자). 상단에 검색창, 그 아래에 결과 목록이 세로로 스크롤된다. 패널 하단은 #105의 태그 목록 자리로 비워 둔다.
- 패널을 접는 버튼은 이번에 넣지 않는다.
- 패널의 props:

  ```ts
  type WorkspacePanelProps = {
    onSelectResult: (result: NodeResult) => void; // 결과 항목을 눌렀을 때 페이지가 할 일. 포커싱과 메모 패널 열기
    isResultSelectDisabled: boolean; // 노드 추가·삭제 요청 중이면 true
  };
  ```

  검색어 입력 state와 `useNodeSearch` 호출은 패널 안에 둔다. 검색어는 서버에 저장하지 않는 화면 상태이고 페이지가 알 필요가 없다.

### 8. 검색창과 결과 목록

- **검색창:** `aria-label="노드 검색"`인 text input과 검색어가 있을 때만 보이는 지우기 버튼. Escape로도 지운다. 지우면 결과 목록과 강조가 함께 사라진다(결정 3). 한글 조합 중에도 입력값이 바뀌는 대로 검색한다.
- **결과 목록(`NodeResultList`):** 태그 UI가 재사용하므로 검색을 모르는 표시 전용 컴포넌트로 만든다.

  ```ts
  type NodeResultListProps = {
    results: NodeResult[]; // 보여 줄 결과
    emptyMessage: string; // 결과가 없을 때 안내. 검색과 태그가 문구를 다르게 쓴다
    onSelect: (result: NodeResult) => void; // 항목을 눌렀을 때
    isSelectDisabled: boolean; // 항목 클릭을 막을지
  };
  ```

  - 항목은 버튼이고 노드 이름을 한 줄로 보여 준다(넘치면 말줄임, 전체 이름은 `title`). `isMemoMatched`이면 이름 오른쪽에 "메모" 표시를 붙인다.
  - 검색어가 비면 목록 자체를 그리지 않는다. 검색어가 있는데 결과가 없으면 `emptyMessage`("일치하는 노드가 없습니다")를 보여 준다.
  - 결과 개수를 목록 위에 보여 준다.

## 단계

### 1. 검색·조상 계산 순수 함수

- `lib/search/searchEditorNodes.ts`: 결정 2의 규칙. 결과 타입 `NodeResult`는 `model/types.ts`에 둔다.
- `lib/getAncestorClientIds.ts`: 엣지를 따라 대상의 부모부터 루트까지 clientId를 모은다. 순환이 없다는 전제지만, 이미 본 노드를 만나면 멈춰 무한 반복을 막는다.
- 테스트할 경우
  - `searchEditorNodes`: 이름만 일치, 메모만 일치(`isMemoMatched: true`), 둘 다 일치, 대소문자 무시, 앞뒤 공백 검색어, 빈·공백뿐인 검색어, `memo`가 `null`, 결과 순서가 노드 배열 순서인지
  - `getAncestorClientIds`: 루트(조상 없음), 깊은 노드, 트리에 없는 clientId

**확인:** `vitest`, `tsc`

### 2. 강조 store와 노드 강조 스타일

- `model/highlight/highlightStore.ts` (결정 3)
- `useInitializeTree`의 언마운트 effect에서 `clearHighlight` 호출
- `CustomNode`에 `data-highlighted`, `app/xy-theme.css`에 강조 스타일과 색 변수 (결정 4)
- 테스트할 경우: `setHighlight`가 집합을 교체하는지, `clearHighlight`
- 화면에서 강조를 일으키는 곳은 3단계에서 생긴다.

**확인:** `vitest`, `tsc`

### 3. 워크스페이스 패널, 검색창, 결과 목록, 강조 연결

- `model/search/useNodeSearch.ts`: 검색어를 받아 store 전체 노드로 결과를 만들고(`useMemo`), 결과의 clientId 목록이 바뀔 때 강조 store에 반영한다. 검색어가 비면 강조를 지운다.
- `widgets/workspace/ui/`의 `WorkspacePanel`, 검색창, `NodeResultList` (결정 7, 8). 이 단계에서는 결과 클릭이 아무것도 하지 않도록 페이지에서 빈 handler를 넘긴다.
- `features/tree-editor/index.ts`에 `useNodeSearch`와 `NodeResult` 타입, `widgets/workspace/index.ts`에 `WorkspacePanel`을 공개한다.
- 페이지 `LayoutFlow`의 배치 변경
- 테스트할 경우: `NodeResultList`(항목 이름과 "메모" 표시, 결과 없음 안내, 클릭 시 `onSelect` 호출, 막혔을 때 클릭 불가)

**확인 (브라우저):** 검색어를 넣으면 결과 목록과 캔버스 강조가 함께 바뀌는지, 메모에서 일치한 항목에 "메모" 표시가 붙는지, 일치가 없을 때 안내 문구, 지우기 버튼·Escape로 목록과 강조가 사라지는지, 강조 노드를 선택해도 강조가 보이는지(결정 4), 검색창에서 Backspace를 눌러도 선택된 노드가 지워지지 않는지, 메모 패널까지 열었을 때 캔버스 폭

### 4. 결과 클릭 시 선택·포커싱·메모 패널 열기 (보이는 노드)

- `treeStore`에 `selectOnlyNodeInStore` (결정 5)
- `useEditorLayout`에 `runAfterNextLayout` (결정 6)
- `model/focus/useFocusNode.ts`: 선택 → 화면 이동. 조상 펼치기는 5단계에서 넣는다.
- 페이지에서 `onSelectResult`로 `focusNode`와 메모 패널 열기를 연결하고, `isMutating`을 `isResultSelectDisabled`로 넘긴다.

**확인 (브라우저):** 화면 밖에 있는 보이는 노드를 누르면 배율은 그대로인 채 그 노드가 가운데로 오고 선택되는지, 메모 일치 항목은 메모 패널이 열리고 그 노드의 메모가 보이는지, 이름만 일치한 항목은 메모 패널을 새로 열지 않는지(이미 열려 있으면 열린 채로 대상만 바뀜), 결과를 누른 뒤 Undo 버튼 상태가 바뀌지 않는지, 노드 추가 요청 중에 항목이 막히는지

### 5. 접힌 노드로 포커싱: 조상 펼치기와 레이아웃 뒤 이동

- `collapseStore`에 `expandAll(treeId, serverIds)` (결정 5)
- `useFocusNode`에 펼치기를 선택 앞에 추가하고, 1·2가 같은 렌더에 반영되어야 하는 이유를 주석으로 남긴다.
- 테스트할 경우: `expandAll`이 여러 노드를 한 번에 펼치고 `localStorage`에 한 번만 쓰는지, 이미 펼쳐진 노드만 넘기면 저장하지 않는지

**확인 (브라우저):** 두 단계 이상 접힌 노드를 누르면 조상이 모두 펼쳐지고 레이아웃이 끝난 뒤 그 노드가 가운데로 오는지, 선택과 메모 패널이 풀리지 않는지, 새로고침해도 펼친 상태가 남는지, 레이아웃이 끝나기 전에 다른 항목을 연달아 누르면 마지막 것으로 이동하는지, 다른 탭에 펼침이 반영되는지

### 6. README 정리와 전체 브라우저 확인

- `src/features/tree-editor/README.md`
  - "model 책임"에 `search`, `highlight`, `focus` 추가
  - "강조와 포커싱" 절: 선택·강조·포커싱의 구분(#102 표), 강조를 별도 store에 두는 이유(결정 3), 펼치기와 선택을 한 렌더에 반영하는 이유(결정 5), 이동을 레이아웃 뒤로 미루는 규칙(결정 6)
- 이슈 TODO 체크, #105가 재사용할 공개 API(`NodeResultList`, `NodeResult`, 강조 store, `focusNode`) 정리

**확인:** `vitest`, `tsc`, lint, 위 단계들의 브라우저 확인 항목 전체

## 범위 밖

- 서버 검색 API 연결, debounce, 로딩·오류 표시 → #104
- 태그 목록과 태그 클릭 강조, 검색과 태그의 강조 우선순위 → #105
- 숨겨진 결과 노드 대신 접힌 조상을 강조하기 → 브라우저에서 보고 필요하면 별도 이슈
- 워크스페이스 패널 접기 버튼
- 메모 일치 위치 미리보기(메모 본문 일부를 결과에 표시)
- 결과로 이동할 때 최소 배율 보장 → 브라우저에서 보고 결정 (결정 6)
- #108의 남은 작업(기준 노드 고정, 새 노드 화면 안으로)과 그 요청 store로의 통합 (결정 6)
