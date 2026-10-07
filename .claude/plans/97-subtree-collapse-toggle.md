# #97 서브트리 접기·펼치기 토글

브랜치: `feat/toggle-subtree-collapse` (main에서 분기)

## 진행 상황 (다른 곳에서 이어갈 때 먼저 읽기)

| 단계                                                  | 상태 | 커밋 |
| ----------------------------------------------------- | ---- | ---- |
| 1. 접힘 계산·저장 순수 함수                           | 완료 | `e166fb5` |
| 2. 접힘 store                                         | 완료 | `b483679` |
| 2-1. 편집기에 들어올 때 접힘 상태 복원 연결           | 완료 | `b03e21a` |
| 2-2. 다른 탭과 접힘 상태 동기화                       | 완료 | `0ae84d3` |
| 3. 접힌 노드의 하위 노드 숨김과 레이아웃 반영         | 대기 |      |
| 4. 토글 버튼, 숨겨진 노드의 선택 해제와 메모 패널 닫기 | 대기 |      |
| 5. 자식 추가 시 자동 펼치기                           | 대기 |      |
| 6. README·`handleSet` 주석 정리, undo history 확인    | 대기 |      |

### 다른 곳에서 이어갈 때

- 커밋한 코드는 모두 테스트(`vitest`)와 `tsc`를 통과했다. 브라우저 확인은 아직 하지 않았다. 숨김이 화면에 반영되는 3단계부터 한다.
- **작업 방식:** 사용자 요청으로 단계를 잘게 나눠 진행한다. 한 번에 바뀌는 코드를 줄이고, 커밋 전에 사용자와 코드를 덩어리별로 같이 읽는다. 보고는 줄임말 없이 "무엇을 바꿨고 화면에서 어떻게 달라지는지" 위주로 쓴다.
- **멈춘 지점:** 2-2를 같이 읽던 중이다. ① `getExternalCollapsedServerIds`(이벤트를 받을지 판정)까지 설명했고, ② `useSyncCollapseAcrossTabs`(이벤트를 받는 리스너), ③ 페이지에 리스너를 붙인 한 줄(`page.tsx`, `index.ts`)이 남았다. 이어서 ②부터 설명한 뒤 3단계로 넘어간다.
- 2단계는 처음에 한 번에 구현했다가 사용자 요청으로 2(store), 2-1(복원 연결), 2-2(탭 간 동기화)로 나눠 커밋했다.

## 목표

노드 오른쪽의 삼각형 버튼(▶ / ◀)으로 그 노드의 하위 트리를 접고 펼친다. API 연동 없이 브라우저 안에서만 동작하고, 새로고침해도 사용자가 조작한 접힘 상태가 유지된다.

- 버튼은 자식이 있는 노드에만 보인다. 접혔을 때 숨긴 자식 수는 표시하지 않는다.
- 저장된 접힘 상태가 없는 트리는 루트부터 3단계(루트 - 노드 - 노드)까지만 펼친다.
- 접힌 노드에 자식을 추가하면 그 노드를 자동으로 펼친다.
- 같은 트리를 연 다른 탭에도 토글이 바로 반영된다.
- 선택된 노드나 메모 패널이 열린 노드가 접혀서 숨겨지면 선택을 해제하고 메모 패널을 닫는다.

## 현황 (착수 전 기준)

- **편집기 노드의 신원:** React Flow 노드의 `id`(clientId)는 편집기를 초기화할 때마다 `createClientNodeId`로 새로 만든다. 서버가 확정한 ID는 `data.serverId`에 있고, 아직 서버에 저장되지 않은 노드는 `null`이다. 따라서 새로고침한 뒤에도 같은 노드를 가리키는 값은 `serverId`뿐이다.
- **트리 구조는 엣지가 들고 있다.** 편집기 노드에는 부모 정보가 없다. `edges`의 각 엣지에서 `source`가 부모, `target`이 자식이다. `useDeleteNode`도 이 엣지를 너비 우선으로 따라가 삭제할 서브트리를 모은다.
- **`treeStore`는 zundo의 `temporal`로 감싸져 있다.** `partialize`가 `nodes`와 `edges`만 undo history의 기록 대상으로 고르고, `handleSet`은 노드·엣지 개수나 노드의 `orderIndex`가 바뀌었을 때만 history에 한 칸을 쌓는다.
- **레이아웃:** `useEditorLayout(nodes, edges, setNodes)`는 `getLayoutStructureSignature`가 만드는 구조 문자열(노드 ID 목록과 엣지 연결 관계)이 바뀔 때마다 ELK로 배치를 다시 계산하고, 끝나면 `fitView`로 화면을 맞춘다. 계산 결과는 `mergeLayoutResult`가 store 노드에 좌표만 얹는데, 계산 결과에 없는 노드는 기존 좌표를 그대로 둔다.
- **선택:** 선택된 노드(`selectedNode`)는 `useTreeEditorActions`가 store 노드 중 `selected`가 `true`인 것을 찾아 구한다. 메모 패널이 열려 있는지는 워크스페이스 페이지의 `isMemoPanelOpen` state가 갖고 있다.
- **`CustomNode`:** 노드 오른쪽(`sourcePosition`)에 자식으로 이어지는 source 핸들이 있다. 레이아웃 방향은 `RIGHT`로 고정되어 있다.
- 프로젝트에 `localStorage`를 쓰는 코드는 아직 없다.

## 결정 사항

### 1. 접힘 상태는 `treeStore`가 아닌 별도 store에 둔다

`src/features/tree-editor/model/collapse/collapseStore.ts`에 zustand store를 따로 만든다.

접힘 상태를 `treeStore`에 넣고 `partialize`에서 빼도 동작은 맞다. 토글은 `nodes`와 `edges`를 바꾸지 않으므로 `handleSet`의 기록 조건에 걸리지 않는다. 또 undo는 `partialize`가 고른 `{ nodes, edges }`만 이전 값으로 되돌리므로 접힘 상태를 건드리지 않는다(zundo 2.3.0의 `temporal` 소스에서 확인). 그래도 별도 store에 두는 이유는 다음과 같다.

- **토글이 history에 들어가지 않는다는 보장이 `handleSet` 조건 하나에 기대지 않는다.** `treeStore`에 두면 이 보장은 `handleSet` 조건이 지금 모양일 때만 성립한다. 조건이 바뀌거나 zundo의 `equality`·`diff` 옵션이 추가되면 토글이 history에 기록될 수 있다. 별도 store는 zundo를 아예 거치지 않는다.
- **생명주기와 부수효과가 다르다.** 접힘 상태는 `localStorage`와 다른 탭의 `storage` 이벤트를 따라 바뀌고, 노드 편집과 무관하게 유지된다. `treeStore`는 서버 데이터와 맞춰 가는 편집 상태다.
- **토글할 때 `handleSet`의 비교 비용이 들지 않는다.** `handleSet`은 `treeStore`의 `set`이 불릴 때마다 노드마다 `find`로 짝을 찾아 비교한다(노드 수의 제곱에 비례). 별도 store면 토글할 때 이 비교가 돌지 않는다.

React Flow 노드의 `hidden` 속성을 `treeStore`의 `nodes`에 써 넣는 방식도 쓰지 않는다. `nodes`는 `partialize`의 기록 대상이라 `hidden` 값이 history 스냅숏에 함께 들어가고, undo가 노드 편집과 함께 접힘 상태까지 되돌린다.

store의 모양은 다음과 같다.

- 상태: `treeId`(접힘 상태가 속한 트리 ID), `collapsedServerIds`(접힌 노드의 `serverId` 집합, `ReadonlySet<string>`)
- action: `restoreCollapse`(초기화 시 복원), `toggleCollapse`(한 노드 접기·펼치기), `expand`(한 노드 펼치기), `applyExternalCollapse`(다른 탭이 저장한 집합으로 교체), `resetCollapse`(편집기를 벗어날 때 비우기)
- `toggleCollapse`와 `expand`는 바뀐 집합을 바로 `localStorage`에 저장한다. 저장에 실패하면 무시한다. 접힘은 편의 기능이라 저장 실패로 편집을 막을 이유가 없다.

### 2. 접힘 상태는 `serverId`로 식별하고, 트리마다 `localStorage` 키를 하나씩 쓴다

- `localStorage` 키는 `twig-tree:collapsed-nodes:{treeId}`, 값은 접힌 노드의 `serverId` 배열을 JSON으로 직렬화한 문자열이다.
- 메모리의 집합(`collapsedServerIds`)도 clientId가 아니라 `serverId`로 둔다. clientId로 두면 저장할 때마다 `serverId`로 바꿔야 한다. `serverId`가 `null`인 노드는 자식을 가질 수 없어 토글 대상이 아니므로, `serverId`로 식별해도 빠지는 노드가 없다.
- `localStorage` 읽기와 쓰기는 `try/catch`로 감싼다. 시크릿 창이나 사이트 데이터 차단으로 예외가 나거나 저장된 값이 깨져 있으면 "저장된 접힘 상태 없음"으로 본다.

### 3. "저장된 접힘 상태 없음"과 "모두 펼침"을 구분한다

- 트리의 `localStorage` 키가 없으면 기본 접힘 상태를 계산하고 **바로 저장한다.** 처음 들어간 시점의 접힘 모양이 다음 방문에도 유지되어야 하므로, 이후 노드가 늘어나도 기본값을 다시 계산하지 않는다.
- 기본 접힘 상태: 루트를 깊이 0으로 셀 때 깊이 2인 노드 중 자식이 있는 노드를 접는다. 그 결과 깊이 0·1·2의 노드가 보이고, 깊이 3부터는 숨겨진다.
- 사용자가 모든 노드를 펼치면 빈 배열 `[]`이 저장된다. 키가 없는 경우와 구분되므로 다음 방문에 기본값으로 다시 접히지 않는다.

### 4. 삭제된 노드의 `serverId`는 초기화 시 복원할 때만 저장값에서 지운다

**"초기화 시 복원"의 시점:** 워크스페이스 페이지에서 서버에서 받은 트리로 `treeStore`를 처음 채울 때, `localStorage`의 접힘 목록도 읽어 접힘 store를 함께 채우는 것을 말한다. 코드로는 `useInitializeTree`의 effect가 `initializeTree`를 부른 직후다. 이 effect는 트리 조회 결과가 도착했고 `treeStore`의 `treeId`가 페이지의 `treeId`와 다를 때만 실행된다.

- 복원이 일어나는 경우
  - 대시보드나 디렉터리에서 워크스페이스를 눌러 편집기에 처음 들어갈 때
  - 편집기에서 새로고침할 때
  - 다른 페이지로 갔다가 편집기에 다시 들어올 때 (편집기를 벗어날 때 `resetTree`가 `treeStore`를 비우므로 다시 초기화된다)
  - 다른 워크스페이스로 이동할 때 (페이지가 `workspaceId`를 `key`로 새로 마운트된다)
- 복원이 일어나지 않는 경우
  - 편집기에 머무는 동안 창 포커스 등으로 트리 조회 캐시가 다시 조회될 때 (`treeStore`의 `treeId`가 이미 같아 건너뛴다)
  - 노드 추가·삭제·제목 수정, 접기·펼치기를 할 때
  - 노드가 없는 워크스페이스에서 루트 노드를 처음 추가할 때 (루트 추가 응답으로 `treeStore`를 직접 채워 초기화를 거치지 않는다. 2단계 마지막 항목에서 따로 처리한다)

저장된 접힘 목록에는 그 사이에 삭제된 노드의 `serverId`가 남아 있을 수 있다. 다른 탭이나 다른 기기에서 지웠을 수도 있고, 이 탭에서 지운 뒤 새로고침했을 수도 있다. 지우지 않으면 쓸모없는 ID가 계속 쌓이므로 정리한다.

- **정리 방법:** 복원할 때 `localStorage`에 저장된 접힘 목록과 서버에서 조회한 트리의 노드 `serverId` 목록의 교집합을 구한다. 즉 저장된 목록에서 지금 트리에 실제로 있는 노드의 ID만 남긴다. 교집합이 저장된 목록보다 작아졌으면 교집합을 다시 저장한다.

  ```text
  localStorage에 저장된 접힘 목록 : ["3", "7", "12"]
  조회한 트리의 노드 serverId      : ["1", "2", "3", "5", "12", ...]   ← 7번 노드는 삭제됨

  교집합                           : ["3", "12"]
  → 저장된 목록보다 작아졌으므로 ["3", "12"]를 다시 저장
  ```

- **세션 중 노드를 삭제할 때는 정리하지 않는다.** 삭제를 undo하면 노드가 돌아오는데, 접힘 목록에서 이미 지웠다면 그 노드는 펼쳐진 채로 돌아온다.
- **다른 탭에서 받은 목록도 정리하지 않는다.** 다른 탭이 `localStorage`에 저장해 이 탭에 `storage` 이벤트로 들어온 접힘 목록(결정 4-1)은, 이 탭의 `treeStore`에 있는 노드 `serverId` 목록과 교집합하지 않고 받은 그대로 메모리 집합으로 쓴다. 이 탭에 없는 `serverId`는 다른 탭에서 방금 만든 노드일 수 있기 때문이다. 다른 탭의 노드 추가는 이 탭의 `treeStore`에 전달되지 않는다(#81).

  같은 트리를 탭 A와 탭 B에 열어 두었고, 두 탭 모두 노드 1~12를 갖고 있으며, 저장된 접힘 목록이 `["3"]`인 상황이다.

  ```text
  1. 탭 B: 노드 20을 추가하고 그 아래에 자식도 추가한 뒤 20을 접음
     → 탭 B가 저장: ["3", "20"]

  2. 탭 A: storage 이벤트로 ["3", "20"]을 받음. 탭 A의 treeStore에는 노드 20이 없음
     교집합으로 걸러 내면   → 메모리 집합 ["3"]
     받은 그대로 쓰면       → 메모리 집합 ["3", "20"]

  3. 탭 A: 노드 12를 접음 → 메모리 집합 전체를 저장
     걸러 냈다면           → 저장 ["3", "12"]        ← 탭 B가 접은 20이 사라짐
     받은 그대로 썼다면    → 저장 ["3", "20", "12"]  ← 두 탭의 변경이 모두 남음

  4. 탭 B: storage 이벤트로 3의 값을 받음
     걸러 냈다면           → 탭 B 화면에서 20이 갑자기 펼쳐지고, 새로고침해도 펼쳐진 상태
     받은 그대로 썼다면    → 탭 B의 20은 계속 접혀 있음
  ```

  받은 그대로 써도 문제가 없는 이유는 두 가지다. 탭 A가 들고 있는 `"20"`은 숨길 노드를 계산할 때 탭 A의 어떤 노드와도 맞지 않아 탭 A 화면에 영향이 없다. 그리고 정말 삭제된 노드의 ID라면 다음 복원 때 조회한 트리의 노드 `serverId` 목록과의 교집합으로 걸러진다. 노드 20처럼 실제로 있는 노드는 그때도 남는다.

### 4-1. 다른 탭의 접힘 변경은 `storage` 이벤트로 받는다

탭마다 접힘 집합을 메모리에 들고 있고 저장할 때 집합 전체를 덮어쓴다. 다른 탭의 변경을 받지 않으면 두 탭이 서로의 변경을 덮어쓴다.

```text
탭 A: X 노드 접음 → 저장 ["X"]
탭 B: (메모리는 아직 [] 상태) Y 노드 접음 → 저장 ["Y"]   ← 탭 A가 접은 X가 사라짐
```

- `window`의 `storage` 이벤트는 같은 출처의 **다른** 탭이 `localStorage`를 바꿨을 때만 발생한다. 이 탭이 저장할 때는 이 탭에서 발생하지 않으므로, 자기 변경을 다시 받는 일은 없다.
- 이벤트의 `key`가 지금 열린 트리의 키일 때만 `applyExternalCollapse`로 메모리 집합을 이벤트의 `newValue`로 교체한다. 받은 값은 다시 저장하지 않는다. 이미 `localStorage`에 들어 있는 값이고, 다시 쓰면 다른 탭들에 이벤트를 또 일으킨다.
- 다음 경우에는 이벤트를 무시하고 메모리 집합을 그대로 둔다.
  - `key`가 `null`: 다른 탭이 `localStorage.clear()`를 불렀다.
  - `newValue`가 `null`: 다른 탭이 이 키를 지웠다.
  - `newValue`가 JSON 문자열 배열로 읽히지 않는다.
  - 접힘 store의 `treeId`가 이벤트 키의 트리 ID와 다르다: 아직 초기화 전이거나 다른 트리를 보고 있다.
- 리스너는 `src/features/tree-editor/model/collapse/useSyncCollapseAcrossTabs.ts` hook에 두고, 워크스페이스 페이지가 인자 없이 호출한다. 이벤트가 어느 트리의 것인지는 페이지의 `treeId`가 아니라 접힘 store의 `treeId`로 판단하므로 넘길 값이 없다. 컴포넌트가 마운트될 때 리스너를 붙이고 언마운트될 때 뗀다.
- 무시할지 판정하는 부분은 `getExternalCollapsedServerIds`(순수 함수)에 있고, 판정을 통과한 목록만 `applyExternalCollapse(serverIds)`에 넘긴다. 그래서 `applyExternalCollapse`는 `treeId`를 받지 않고 집합만 교체한다.
- 다른 탭의 접기로 이 탭의 선택된 노드가 숨겨지면 결정 6의 선택 해제와 메모 패널 닫기가 그대로 동작한다.
- 이 리스너는 #81이 해결되어도 필요하다. 두 동기화는 맞추는 대상이 다르다.
  - #81은 같은 트리를 여러 탭에서 편집할 때 탭마다 따로 가진 트리 조회 캐시와 `treeStore`, 즉 **서버 데이터**가 어긋나는 문제다. 탭끼리 query cache를 공유하든(`broadcastQueryClient` 등), 다른 탭이 서버에서 다시 조회하든, 다시 조회한 결과로 편집기를 다시 초기화하든, 다른 탭이 움직이는 계기는 서버 데이터의 변경이다.
  - 토글은 접힘 store(메모리)와 `localStorage`만 바꾼다. 서버 요청을 보내지 않으므로 query cache와 서버 데이터는 그대로이고, #81의 어떤 해결 방식도 감지할 변경이 없다.

  ```text
  탭 A에서 노드 3을 접음
   → 탭 A의 접힘 store와 localStorage만 바뀜
   → 서버 요청 없음, query cache 변화 없음
   → #81의 해결 방식으로는 탭 B가 알 수 없음 → storage 이벤트로만 전달됨
  ```

  따라서 이 리스너는 #81을 기다리지 않고 이번 작업에서 만들고, #81이 해결된 뒤에도 그대로 둔다.

### 5. 숨길 노드는 페이지에서 계산하고, 레이아웃도 보이는 노드만으로 계산한다

- `getHiddenClientIds(nodes, edges, collapsedServerIds)`가 숨길 노드의 clientId 집합을 구한다. `src/features/tree-editor/model/collapse/useVisibleElements.ts` hook이 이 집합으로 보이는 노드 배열과 보이는 엣지 배열을 `useMemo`로 만든다. 엣지는 양 끝 노드가 모두 보일 때만 남긴다.
- `<ReactFlow>`와 `useEditorLayout` 모두에 보이는 배열을 넘긴다. 숨긴 노드까지 ELK에 넣으면 접힌 서브트리가 차지하던 자리가 빈 공간으로 남는다.
- 접거나 펼치면 보이는 노드 ID 목록이 바뀌므로 `getLayoutStructureSignature`의 결과가 달라지고, 레이아웃이 다시 계산된다. #50에서 정한 "구조 문자열이 바뀔 때만 레이아웃을 다시 계산한다"는 조건에 그대로 걸리므로 이 함수는 고치지 않는다.
- `useEditorLayout`은 계산 결과를 `setNodes((currentNodes) => mergeLayoutResult(currentNodes, layoutedNodes))`로 store의 **전체** 노드에 얹는다. 숨긴 노드는 계산 결과에 없으므로 숨기기 전 좌표가 그대로 남는다. 펼친 직후 다음 레이아웃 계산이 끝날 때까지 잠깐 예전 좌표에 보일 수 있다.
- React Flow 노드의 `hidden` 속성을 붙이지 않고 배열에서 걸러 낸다. 이유는 페이지에서 노드 배열을 받는 곳이 두 군데이기 때문이다.

  ```tsx
  useEditorLayout(nodes, edges, setNodes);   // 레이아웃용: ELK가 좌표를 계산할 노드
  <ReactFlow nodes={nodes} edges={edges} />  // 표시용: React Flow가 화면에 그릴 노드
  ```

  - 배열에서 걸러 내면, 걸러 낸 배열 하나를 레이아웃용과 표시용에 함께 넘긴다.
  - `hidden` 속성을 쓰면 표시용 배열에는 숨긴 노드에 `hidden: true`를 붙여 넘긴다. 그런데 ELK는 React Flow의 `hidden`을 모르므로, 이 배열을 레이아웃용으로 넘기면 숨긴 노드까지 자리를 잡아 접힌 자리에 빈 공간이 남는다. 결국 레이아웃용으로 걸러 낸 배열을 따로 만들어야 해서 배열이 두 개가 된다.

  ```tsx
  const nodesWithHidden = nodes.map((node) =>
    hiddenIds.has(node.id) ? { ...node, hidden: true } : node,
  ); // 표시용
  const visibleNodes = nodes.filter((node) => !hiddenIds.has(node.id)); // 레이아웃용

  useEditorLayout(visibleNodes, visibleEdges, setNodes);
  <ReactFlow nodes={nodesWithHidden} edges={edges} />
  ```

  렌더 비용은 두 방식이 사실상 같다. React Flow는 `nodes`가 바뀌면 노드마다 이전 객체와 같은 참조인지 비교해서(`@xyflow/system`의 `adoptUserNodes`), 같으면 그 노드를 다시 그리지 않는다(React Flow 12.10.2에서 확인). 위처럼 숨길 노드만 새 객체로 만들면 보이는 노드는 store의 객체 그대로이고, 새 객체가 된 숨긴 노드는 화면에 그려지지 않는다.
- `onNodesChange`와 `onEdgesChange`는 React Flow가 넘긴 변경을 노드·엣지 `id`로 찾아 store의 전체 배열에 적용한다. 그래서 `<ReactFlow>`에 걸러 낸 배열을 넘겨도 숨긴 노드가 store에서 사라지지 않는다.

### 6. 숨겨진 노드의 선택 해제와 메모 패널 닫기는 페이지 쪽 한 곳에서 한다

선택된 노드(`selectedNode`)는 `treeStore`의 노드 중 `selected`가 `true`인 것을 찾아 구하고, 화면에 보이는지는 따지지 않는다. 접기로 노드를 숨겨도 `treeStore`의 노드는 그대로이므로, 처리하지 않으면 숨긴 노드가 계속 선택된 상태로 남는다.

```text
1. 노드 7을 선택하고 Add Memo로 메모 패널을 엶
2. 노드 7의 조상인 노드 3을 접음 → 노드 7이 화면에서 사라짐
3. 처리하지 않으면
   - 메모 패널이 보이지 않는 노드 7의 메모를 계속 보여 줌
   - Delete Node가 켜져 있고, 누르면 보이지 않는 노드 7과 그 서브트리가 삭제됨
   - Add Node를 누르면 보이지 않는 노드 7 아래에 자식이 추가됨
```

이 처리는 이 탭에서 선택된 노드의 조상을 접을 때와, 다른 탭의 접기가 `storage` 이벤트로 이 탭에 들어올 때(결정 4-1) 모두 일어난다.

- 토글 버튼은 `CustomNode` 안에 있어서 페이지의 `isMemoPanelOpen` state에 접근할 수 없다. 그래서 선택 해제와 메모 패널 닫기는 토글 action이 아니라, 숨길 노드 집합을 계산하고 페이지와 연결된 `useVisibleElements`에서 한다.
- `useVisibleElements`는 `onSelectedNodeHidden` 콜백을 인자로 받는다. 선택된 노드가 숨길 노드 집합에 들어가면 `treeStore`에서 그 노드의 `selected`를 `false`로 바꾸고 콜백을 부른다. 페이지는 이 콜백에서 메모 패널을 닫는다(`setIsMemoPanelOpen(false)`).
- 선택 해제는 노드의 `selected`만 바꾸고 노드·엣지 개수와 `orderIndex`는 그대로이므로, `handleSet`의 기록 조건에 걸리지 않아 undo history에 들어가지 않는다.

### 7. 자식 추가 시 자동 펼치기는 노드 추가 handler(`useAddNode`)에서 한다

- `useAddNode`의 `handleAddNode`가 새 노드를 store에 넣기 전에, 부모가 될 선택된 노드(`selectedNode`)의 `serverId`로 접힘 store의 `expand`를 부른다. 부모의 `serverId`가 `null`이면 그보다 앞에서 알림과 함께 요청이 막히므로, `expand`는 그 검사 뒤에 둔다.
- 노드 추가 요청이 실패해 undo로 노드를 되돌려도 펼친 상태는 되돌리지 않는다. 사용자는 그 노드에 자식을 붙이려 했으므로 펼친 채로 두는 것이 자연스럽다.
- 이슈의 "접힌 노드 아래로 노드를 옮겨 오면 펼친다"는 이번에 하지 않는다. 지금 노드 이동(`treeStore`의 `onReconnect`)은 서버에 저장되지 않으므로, #98에서 노드 이동 API를 붙일 때 함께 다룬다.

### 8. 접고 펼친 뒤의 `fitView`는 지금처럼 둔다

- `useEditorLayout`은 레이아웃 계산이 끝날 때마다 `fitView`로 화면을 트리 전체에 맞춘다. 노드를 추가할 때도 같은 동작이므로 토글만 예외로 두지 않는다.
- 접을 때마다 화면이 확대·축소되는 것이 거슬리면, 레이아웃을 왜 다시 계산하는지 구분해야 해서 범위가 커진다. 브라우저에서 확인한 뒤 필요하면 별도 이슈로 뺀다.

## 단계

### 1. 접힘 계산·저장 순수 함수

위치: `src/features/tree-editor/lib/collapse/`

- `getHiddenClientIds(nodes, edges, collapsedServerIds)`: 접힌 노드들의 모든 자손 노드의 clientId 집합을 돌려준다. 접힌 노드 자신은 숨기지 않는다.
- `getDefaultCollapsedServerIds(nodes, edges, expandedDepth)`: 루트를 깊이 0으로 셀 때 깊이가 `expandedDepth`인 노드 중 자식이 있는 노드의 `serverId` 배열을 돌려준다. 결정 3의 기본값은 `expandedDepth`를 2로 부른다.
- `collapsedNodesStorage.ts`
  - `readCollapsedServerIds(treeId)`: 저장된 `serverId` 배열을 돌려준다. 키가 없거나, 값이 깨져 있거나, `localStorage` 접근에서 예외가 나면 `null`을 돌려준다.
  - `writeCollapsedServerIds(treeId, serverIds)`: 배열을 JSON으로 저장한다. 예외는 삼킨다.
- 노드에 자식이 있는지 판정하는 함수는 4단계에서 버튼을 그릴 때 필요하면 추가한다.
- 테스트할 경우
  - `getHiddenClientIds`: 접힌 노드 아래에 또 접힌 노드가 있는 경우, 루트를 접은 경우, 접힌 노드가 없는 경우, 트리에 없는 `serverId`가 섞인 경우
  - `getDefaultCollapsedServerIds`: 깊이가 3 이상인 트리, 깊이 2 이하인 트리(접을 노드 없음), 깊이 2인 노드 중 자식이 없는 노드는 접지 않는지
  - `readCollapsedServerIds`: 키 없음, 깨진 JSON, 배열이 아닌 값, 문자열이 아닌 원소, `localStorage` 접근 예외

**확인:** `vitest`, `tsc`

### 2. 접힘 store, 초기화 시 복원, 탭 간 동기화

- `src/features/tree-editor/model/collapse/collapseStore.ts` 작성 (결정 1)
- 복원은 `useInitializeTree`에서 `initializeTree`를 부른 직후에 `restoreCollapse`로 한다. `useInitializeTree`에 이미 있는 "트리당 한 번만 초기화" 가드를 그대로 따르므로 복원도 트리당 한 번만 일어난다. 노드와 접힘 상태가 같은 렌더에 채워지므로 첫 레이아웃 계산부터 접힌 모양으로 돈다.
  - `localStorage`에 저장된 접힘 목록이 있으면: 저장된 목록과 조회한 트리의 노드 `serverId` 목록의 교집합을 메모리 집합으로 쓰고, 교집합이 저장된 목록보다 작으면 교집합을 다시 저장한다 (결정 4).
  - 저장된 접힘 목록이 없으면: 기본 접힘 상태를 계산해 메모리 집합으로 쓰고 바로 저장한다 (결정 3).
- `useInitializeTree`가 편집기를 벗어날 때 `resetTree`를 부르는 곳에서 `resetCollapse`도 함께 부른다.
- `useSyncCollapseAcrossTabs` 작성: 다른 탭의 `storage` 이벤트를 받아 `applyExternalCollapse`를 부른다 (결정 4-1). 이벤트를 무시할지 판정하는 부분은 순수 함수로 빼서 테스트한다.
- 노드가 없는 워크스페이스에서 루트 노드를 처음 추가하는 흐름(#83)에서는 루트 추가 응답으로 store를 직접 채우므로 `useInitializeTree`의 초기화와 복원을 거치지 않는다. 그러면 접힘 store의 `treeId`가 비어 있는 채로 남는다. `toggleCollapse`와 `expand`는 접힘 store의 `treeId`가 인자로 받은 트리 ID와 다르면 빈 집합에서 시작하도록 처리한다.

**확인:** `vitest`(store action, 이벤트 무시 판정), `tsc`. 탭 간 동기화의 화면 동작은 숨김이 화면에 반영되는 4단계에서 브라우저로 확인한다.

### 3. 접힌 노드의 하위 노드 숨김과 레이아웃 반영

- `src/features/tree-editor/model/collapse/useVisibleElements.ts` 작성: 보이는 노드·엣지 배열을 계산한다 (결정 5).
- 워크스페이스 페이지에서 `<ReactFlow>`의 `nodes`·`edges`와 `useEditorLayout`의 인자를 보이는 배열로 바꾼다.
- 이 단계에는 아직 토글 버튼이 없다. 그래도 저장된 접힘 상태가 없는 트리는 기본값이 적용되므로, 깊이 3 이상의 노드가 있는 트리에서 숨김이 동작하는지 볼 수 있다.

**확인 (브라우저):** 깊이 3 이상의 노드가 있는 트리를 처음 열면 깊이 2까지만 보이고 숨긴 노드 자리에 빈 공간이 없는지, 개발자 도구에서 `localStorage`에 `twig-tree:collapsed-nodes:{treeId}` 키가 생겼는지

### 4. 토글 버튼, 숨겨진 노드의 선택 해제와 메모 패널 닫기

- `CustomNode`의 오른쪽에 토글 버튼을 추가한다. 노드에 자식이 있고 `serverId`가 `null`이 아닐 때만 그린다. 접힌 상태는 ▶, 펼친 상태는 ◀로 표시한다.
  - 버튼에 `nodrag nopan` 클래스를 붙여 버튼을 누를 때 노드 드래그나 화면 이동이 시작되지 않게 하고, 클릭 이벤트 전파를 막아 노드가 선택되지 않게 한다.
  - 자식이 있는지는 `useTreeStore((state) => state.edges.some((edge) => edge.source === id))` 셀렉터로 구한다. 셀렉터 결과가 boolean이므로 다른 노드가 바뀌어도 이 노드는 결과가 같으면 다시 그려지지 않는다.
  - 버튼이 source 핸들과 겹치지 않는 위치는 브라우저에서 보며 정한다.
  - 접근성: `aria-label`은 접힌 상태에서 "하위 노드 펼치기", 펼친 상태에서 "하위 노드 접기"로 하고, `aria-expanded`로 펼침 여부를 알린다.
- 워크스페이스 페이지에서 `useVisibleElements`에 `onSelectedNodeHidden`으로 메모 패널 닫기를 넘긴다 (결정 6).
- 노드 추가·삭제 요청이 진행 중일 때(페이지의 `isMutating`이 `true`일 때)는 토글 버튼도 막는다. 토글은 undo로 실패를 복구하는 전제와 관계가 없지만, 요청 중에는 편집 입력을 모두 막는 지금 규칙과 맞춘다.

**확인 (브라우저)**

- 접기와 펼치기가 동작하고, 새로고침한 뒤에도 접힘 상태가 유지되는지
- 선택된 노드의 조상을 접으면 선택이 해제되고 메모 패널이 닫히는지
- 모든 노드를 펼친 뒤 새로고침해도 기본값으로 다시 접히지 않는지
- 같은 트리를 두 탭에 열고 한쪽에서 토글하면 다른 탭에 바로 반영되는지
- 두 탭에서 서로 다른 노드를 번갈아 토글한 뒤 새로고침하면 양쪽 변경이 모두 남아 있는지

### 5. 자식 추가 시 자동 펼치기

- `useAddNode`의 `handleAddNode`에서 부모 노드의 `serverId`로 접힘 store의 `expand`를 부른다 (결정 7).

**확인 (브라우저):** 접힌 노드를 선택하고 Add Node를 누르면 그 노드가 펼쳐지고 새 자식 노드가 보이는지

### 6. README·`handleSet` 주석 정리, undo history 확인

- `src/features/tree-editor/README.md`의 "model 책임" 목록에 `collapse`를 추가하고, 접힘 상태를 `treeStore` 밖에 두는 이유(결정 1)와 삭제된 노드의 ID를 복원할 때만 정리하는 이유(결정 4)를 적는다.
- undo history 확인
  - 토글한 뒤 Undo 버튼의 활성 상태가 바뀌지 않는지
  - 노드 추가 → 다른 노드 접기 → Undo 순서로 했을 때 노드 추가만 되돌아가고 접힘 상태는 그대로인지
- `treeStore`의 `handleSet` 주석과 변수 이름을 실제 동작에 맞게 고친다. 동작은 바꾸지 않는다.
  - zundo는 `set`으로 상태를 바꾼 **뒤에** `handleSet`을 부르고, 인자로는 바뀌기 **전** 상태(`partialize`가 고른 `pastState`)를 넘긴다. 지금 코드는 인자를 "다음 상태"로, `useTreeStore.getState()`를 "현재 상태"로 읽고 있어서 변수 이름(`partialNextState`, `nextNodes`, `nextEdges`)과 주석이 실제와 반대다.
  - 인자는 항상 `partialize` 결과인 객체이고 함수형 업데이터일 수 없으므로 `typeof state === "function"` 분기도 지운다.
  - 노드·엣지 개수 비교와 `orderIndex` 비교는 어느 쪽을 이전 상태로 보든 결과가 같으므로, 이름·주석·불필요한 분기만 고쳐도 동작은 그대로다.
  - 결정 1의 근거가 이 동작을 전제로 하므로 같은 작업에서 맞춰 둔다. 커밋은 접힘 기능 커밋과 분리한다(`refactor(tree-editor): ...`).

**확인:** `vitest`, `tsc`, lint, 브라우저

## 범위 밖

- 접힌 노드 아래로 노드를 옮겨 왔을 때 자동 펼치기 → #98 (결정 7)
- 접거나 펼칠 때 `fitView` 생략 → 브라우저 확인 후 필요하면 별도 이슈 (결정 8)
