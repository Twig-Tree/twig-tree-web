# #83 빈 워크스페이스에서 루트 노드 추가

상위 이슈: #64 · 선행: #66 (PR #84) · 브랜치: `feat/add-node-in-empty-workspace` (#66 브랜치 위)

## 진행 상황 (다른 곳에서 이어갈 때 먼저 읽기)

| 단계                                               | 상태                      | 커밋      |
| -------------------------------------------------- | ------------------------- | --------- |
| 1. entity: 트리 생성 API·루트 노드 요청 타입       | 완료                      | `87ac523` |
| 2. 페이지: 트리 없는 워크스페이스도 `LayoutFlow`로 | 완료                      | `85d19c1` |
| 3. 노드 0개 트리에서 루트 추가                     | 완료                      | `b45bd9b` |
| 4. 트리가 없으면 트리부터 만들기                   | 완료 (브라우저 확인 남음) | `4056ce3` |

- 모든 단계가 커밋되었다. `vitest`(211개), `tsc`, lint 통과.
- **남은 일**
  - 4단계 브라우저 확인 (아래 4단계 "확인" 항목). 1~3단계 중 사용자가 브라우저로 확인한 것은 3단계의 루트 추가뿐이다
  - PR 작성 — 이 계획서는 PR 전에 삭제한다 (CLAUDE.md 규칙)
  - PR #84(#66)가 먼저 머지되어야 한다. 이 브랜치는 #66 커밋 위에 있다
- 구현 중 계획과 달라진 점은 각 단계의 **구현 결과**에 적었다. 결정 사항 본문은 확정된 내용으로 고쳐 두었다.

## 목표

노드가 하나도 없는 워크스페이스에서 노드 추가 버튼으로 루트 노드를 만들어 편집을 시작할 수 있게 한다.

- 트리가 없는 워크스페이스(`treeId: null`)와 트리는 있지만 노드가 0개인 워크스페이스를 같은 흐름으로 처리한다.
- 조건은 "트리가 없을 때"가 아니라 **"노드가 없을 때"**다. 루트를 지워 노드가 0개가 된 트리도 여기에 들어온다.

## 현황 (착수 전 기준)

### 백엔드 (`BE-twig-tree` develop, `7ee128d`)

- `POST /workspaces/{workspaceId}/trees` — 빈 트리 생성
  - 응답 `data`: `{ treeId }` (노드 없음)
  - 워크스페이스당 트리 하나. 이미 있으면 `409 TREE409-1` (`TREE_ALREADY_EXISTS`). 응답에 기존 `treeId`는 없다
  - 없는 워크스페이스 → `404 WORKSPACE404-1`
- `POST /trees/{treeId}/nodes` — `parentId`가 `null`이면 루트 노드
  - `name`: `@NotBlank @Size(max = 30)`
  - `orderId`: `@Min(1) @NotNull`
  - 한 트리에 루트는 하나다. 서비스 코드가 아니라 DB 유니크 인덱스 `uk_nodes_root_per_tree`(`V2__init_nodes_index.sql`)가 막고, `ConstraintErrorCodeMapper`가 `409 NODE409-2`(`ONE_ROOT_PER_TREE`)로 바꿔 준다
  - 프론트는 "노드가 0개일 때"만 루트 추가를 연다. 그래도 다른 탭에서 먼저 루트를 만든 경우처럼 409가 올 수 있다 (결정 5)
- `POST /workspaces`는 트리를 만들지 않는다 (`treeId: null` 반환).

### 프론트엔드

- `treeApi.createTree`는 AI 트리 생성 경로(`/tree-request?scenario=small`, `ChatController`)를 부른다. #6의 범위이므로 이번 작업에서 건드리지 않고, 워크스페이스 기준 트리 생성은 별도 함수로 둔다.
- `CreateNodeRequest.parentId`와 `useAddNodeMutation`의 `parentId`가 `number`·`string`으로 루트를 표현할 수 없다.
- `useAddNode`는 선택한 노드의 자식만 만든다. 페이지의 Add Node 버튼은 `!selectedNode`이면 비활성이다.
- `treeStore.addNodeToStore(newNode, newEdge)`는 엣지를 반드시 받는다. 루트는 들어오는 엣지가 없다.
- 워크스페이스 페이지는 `treeId === null`이면 `LayoutFlow` 대신 버튼 패널 없는 빈 `<ReactFlow>`를 그린다. 그래서 지금은 버튼 자체가 없다.
- `LayoutFlow`의 하위 hook·UI 중 `treeId`를 받는 곳
  - prop으로 받음: `useTreeEditorActions`(→ `useAddNode`, `useDeleteNode`), `useInitializeTree`, `useGetTreeQuery`, `MemoSidePanel`
  - store에서 읽음: `CustomNode`(`useTreeStore((s) => s.treeId)`)
- `useInitializeTree`는 store의 `treeId`가 prop과 같으면 초기화를 건너뛴다. store가 트리당 한 번만 cache로 채워진다.

## 결정 사항 (확정)

### 1. 트리는 첫 루트 노드를 추가할 때 만든다 (이슈의 A안)

`treeId`가 `null`이면 트리 생성 → 루트 노드 생성을 이어서 요청한다.

- B안(워크스페이스 생성 직후 트리 생성)은 실패·트리 삭제로 `null`이 남아 A의 처리가 어차피 필요하고, 빈 트리라 노드 문제도 그대로다.
- C안(백엔드 트랜잭션)은 백엔드 변경이 필요하고 기존 `null` 워크스페이스도 여전히 처리해야 한다.
- 트리 생성 후 노드 생성이 실패하면 빈 트리가 남는다. 다음 시도는 "트리 있음 + 노드 0개" 흐름으로 그대로 이어지므로 정리하지 않는다.

### 2. 루트 추가는 optimistic update 없이 요청 결과로 store에 넣는다

- 캔버스가 비어 있어 먼저 그려서 얻는 이득이 작다. 요청 중에는 버튼만 pending으로 막는다.
- 트리까지 새로 만드는 경우 요청이 둘이라, optimistic 노드를 넣으면 중간 실패 시 되돌릴 경로가 둘로 갈린다.
- 실패 시 store를 건드린 적이 없으므로 `undo()`도 직접 복구도 필요 없다.

### 3. 트리 생성 mutation은 `entities/workspace`에 둔다

- 이 요청이 바꾸는 캐시는 워크스페이스 상세의 `treeId`뿐이다. 새 트리의 노드 캐시는 아직 없다.
- FSD 규칙의 "누가 캐시를 소유하는가" 기준이고, 경로도 `/workspaces/{id}/trees`다. `entities/tree`에 두면 워크스페이스 query key를 가져오려고 entity 간 import가 생긴다.
- 이름: `workspaceApi.createWorkspaceTree`, `useCreateWorkspaceTreeMutation`

### 4. 워크스페이스 상세 캐시는 `setQueryData`로 `treeId`만 채우고, store 반영 **뒤에** 한다

트리 생성 응답에 `treeId`가 있으므로 무효화로 다시 조회하지 않고 캐시를 직접 확정한다. 컨벤션상 무효화는 응답 본문으로 캐시를 확정할 수 없을 때 쓴다.

캐시에 `treeId`가 들어가는 순간 페이지가 새 `treeId`로 다시 그려지고 `LayoutFlow`가 새 트리를 조회한다. 조회 결과가 오면 `useInitializeTree`가 store의 `treeId`와 비교해, 다르면 store를 덮는다.

- 무효화를 써도 이 흐름은 같다. `invalidateQueries`의 기본 `refetchType`은 `'active'`라, 페이지가 구독 중인 상세 query는 즉시 다시 조회된다 (query-core 5.100.14 `queryClient.ts`에서 확인).
- 캐시를 트리 생성 직후에 채우면, 트리 조회와 루트 노드 생성 요청이 동시에 진행된다. 서버가 루트를 먼저 저장하고 조회 응답이 먼저 도착하면 `useInitializeTree`가 루트를 새 클라이언트 ID로 store에 채우고, 뒤이어 온 루트 생성 응답으로 feature가 같은 루트를 한 번 더 넣는다.

  ```text
  1. 트리 생성 응답 → 캐시에 treeId "5"
  2. 페이지 재렌더 → GET /trees/5/nodes 시작    ┐ 동시에 진행
  3. feature → POST /trees/5/nodes (루트) 시작   ┘
  4. 서버: 루트 저장 → 조회 처리 (루트 포함)
  5. 조회 응답 먼저 도착 → store treeId(null) ≠ "5" → useInitializeTree가 루트를 채움
  6. 루트 생성 응답 도착 → feature가 같은 루트를 또 추가 → 중복
  ```

- 따라서 순서는 feature hook이 쥔다: 트리 생성 → 루트 노드 생성 → store에 `treeId`와 루트 반영 → 상세 캐시에 `treeId` 채움. 조회는 루트 생성이 끝난 뒤에야 시작되고, store의 `treeId`가 이미 같아 `useInitializeTree`는 건너뛴다.
- 캐시 모양을 아는 것은 entity이므로, 상세 캐시의 `treeId`를 채우는 함수는 `entities/workspace`가 제공하고(`useSetWorkspaceTreeIdInCache`) feature는 호출 시점만 정한다.
- **컨벤션 예외:** 이 프로젝트는 캐시 갱신을 mutation 선언부(`useMutation({ onSuccess })`)에, store 반영을 호출부(`mutate(vars, { onSuccess })`)에 둔다. 트리 생성 mutation은 선언부 `onSuccess`가 응답 직후 실행되어 위 순서를 지킬 수 없으므로 선언부에 캐시 처리를 두지 않는다. 구현 시 mutation 선언부와 캐시 함수에 이 예외와 이유를 주석으로 남긴다.
- 루트 노드 생성이 실패해도 트리는 생겼으므로 `treeId`는 채운다. 이때 store에는 루트가 없어 `useInitializeTree`가 빈 트리로 채워도 겹칠 노드가 없다.

### 4-1. 트리를 새로 만들지는 워크스페이스 상세 캐시의 `treeId`로 판단한다

루트 노드 생성이 실패한 뒤 다시 누르면, 트리는 이미 있으므로 루트 노드 생성만 해야 한다.

- 판단 기준은 store의 `treeId`가 아니라 페이지가 넘기는 `treeId`(워크스페이스 상세 캐시)다.
  - 실패 시 캐시에 `treeId`를 채우면 페이지가 바로 새 `treeId`로 다시 그려진다.
  - store의 `treeId`는 새 트리 조회가 끝나 `useInitializeTree`가 실행된 뒤에야 채워진다. store로 판단하면 그 사이에 누른 경우 트리를 또 만들려다 `409 TREE409-1`이 난다.
- 새 트리 조회 중에는 `LayoutFlow`가 로딩 화면을 그려 버튼이 없으므로, 조회가 끝나기 전에 루트 추가가 눌리지 않는다.
- 흐름: `treeId`가 `null` → 트리 생성 + 루트 생성 / `treeId`가 있음 → 루트 생성만 (3단계 흐름)

### 5. 두 409는 실패로 안내한다

- `409 TREE409-1` (`TREE_ALREADY_EXISTS`)
  - 다른 탭에서 먼저 트리를 만든 경우다. 응답에 기존 `treeId`가 없어 이어서 노드를 만들 수 없다.
  - 응답에 `treeId`가 없어 `setQueryData`로 채울 수 없으므로 이 경우만 워크스페이스 상세를 무효화한다. `treeId`를 받아 오면 다음 시도가 "트리 있음" 흐름으로 간다.
  - 무효화는 `useCreateWorkspaceTreeMutation` 선언부 `onError`에 둔다. store가 비어 있어 순서를 feature가 쥘 필요가 없고, 캐시 처리는 선언부라는 컨벤션에 맞다. 다만 actions README의 "선언부에 `onError`를 두지 않는다"와는 어긋나며, 이 점은 README의 Add Root Node 절에 적었다.
  - store는 비어 있어 무효화 후 `useInitializeTree`가 기존 트리로 채워도 겹칠 노드가 없다.
- `409 NODE409-2` (`ONE_ROOT_PER_TREE`)
  - 다른 탭에서 먼저 루트를 만든 경우다. 이 화면의 store는 트리당 한 번만 초기화되므로 무효화로는 그 루트가 보이지 않는다.
  - 새로고침을 안내하는 문구로 알린다. 자동으로 store를 다시 채우는 처리는 하지 않는다.

### 6. 루트 노드 이름은 `Root Node`

- 자식 노드의 `Added node N`처럼 고정 문구를 쓴다.
- 백엔드 계약값이 아니라 편집기의 기본값이므로 `features/tree-editor`에 상수로 둔다. (`constants/node.ts`의 `ROOT_NODE_LABEL`)

### 7. 루트 추가 직후 undo 기록을 비운다 (3단계 테스트 중 추가)

- 사용자가 브라우저에서 확인: 루트 추가 후 Undo가 활성화되고, 누르면 store에서만 사라지고 서버 요청은 가지 않는다.
- undo는 원래 서버와 연결되어 있지 않다(`useTreeHistory`의 `undo`는 zundo 기록만 되돌린다). 자식 노드 추가·삭제도 같지만, 루트는 되돌리면 노드 0개 → 버튼이 다시 루트 추가 → `409 NODE409-2`로 막히고 "루트는 지울 수 없다"는 정책과도 충돌한다.
- 그래서 루트 추가 성공 직후 `useTreeStore.temporal.getState().clear()`로 기록을 비운다. 트리 초기화(`useInitializeTree`)와 같은 방식으로, 루트 추가를 편집의 시작점으로 둔다.
- undo/redo를 서버와 맞추는 문제 전체는 범위 밖이다 (아래 "범위 밖").

## 단계

### 1단계 — entity: 워크스페이스 트리 생성 API와 루트 노드 요청 타입

- `entities/workspace`
  - `api/types.ts` — `CreateWorkspaceTreeResponse = ApiResponse<{ treeId: number }>`
  - `api/workspaceApi.ts` — `createWorkspaceTree(workspaceId: number): Promise<string>` (도메인 `treeId` 문자열 반환)
  - `model/mutations/useCreateWorkspaceTreeMutation.ts` — 인자 `workspaceId: string`, 선언부 캐시 처리 없음 (결정 4)
  - 상세 캐시의 `treeId`만 `setQueryData`로 채우는 함수 (결정 4, 이름·형태는 구현 시 확정). 캐시가 없으면 건드리지 않는다
  - `index.ts` 공개 API
- `entities/tree`
  - `CreateNodeRequest.parentId: number | null`
  - `useAddNodeMutation` 변수 `parentId: string | null`, `null`을 숫자 변환 전에 확인 (`Number(null) === 0`)
- 테스트
  - msw `POST */api/workspaces/:workspaceId/trees` — 성공, 이미 있으면 409
  - 루트 노드 생성 msw — 이미 루트가 있으면 `409 NODE409-2`
  - mutation 테스트: `treeId` 문자열 변환, 409면 오류
  - 캐시 함수 테스트: 상세 캐시의 `treeId`만 바뀌고 나머지 필드는 유지
  - `useAddNodeMutation`: `parentId: null`이 요청 body에 `null`로 가는지

확인: `vitest`, `tsc`, lint

**구현 결과** (`87ac523`)

- 캐시 함수는 `entities/workspace/model/useSetWorkspaceTreeIdInCache.ts` — `(workspaceId, treeId) => void`를 돌려주는 hook
- `useCreateWorkspaceTreeMutation`과 캐시 함수에 컨벤션 예외 주석을 남겼다 (결정 4)
- msw: 트리 생성은 `treeId`가 이미 있는 워크스페이스 1번이면 409, 아니면 `treeId: 20`. 노드 생성은 10번 트리에 루트를 만들면 `409 NODE409-2`, 그 외엔 body를 그대로 `nodeId: 500`으로 응답

### 2단계 — 페이지: 트리 없는 워크스페이스도 `LayoutFlow`로 그리기

동작 변화 없이 구조만 바꾼다. 빈 워크스페이스에도 버튼 패널이 보이게 된다.

- `LayoutFlow`의 `treeId`를 `string | null`로 받고, 빈 `<ReactFlow>` 분기를 없앤다
- `useGetTreeQuery`는 `treeId`가 `null`이면 보내지 않는다 (지금 `enabled: !!treeId`)
- `treeId`를 prop으로 받는 곳 정리 — `CustomNode`처럼 store의 `treeId`를 읽게 할지, `null`을 받게 할지 이 시점에 코드를 보고 정한다. 범위가 크면 알린다
  - 노드가 없으면 삭제·메모 action은 호출될 수 없지만 타입은 맞춰야 한다
- `useInitializeTree` — `treeId`가 `null`이면 초기화할 데이터가 없으므로 건너뛴다

확인: 트리 없는 워크스페이스에서 버튼 패널이 보이고 콘솔 오류가 없다. 트리 있는 워크스페이스는 기존대로 동작한다

**구현 결과** (`85d19c1`)

- `treeId`는 store에서 읽지 않고 **페이지 prop을 `string | null`로 넓혀** 내려보낸다. 4단계에서 트리 생성 여부를 페이지의 `treeId`로 판단하므로(결정 4-1) 같은 값이 흐르게 맞췄다
- `useGetTreeQuery(treeId: string | null)` — `enabled` 대신 `skipToken`. `queryFn` 안에서 `treeId`가 `null`이 아님을 타입으로 보장받기 위해서다. `treeQueryKeys.detail`도 `string | null`을 받는다
- `useInitializeTree`, `useTreeEditorActions`, `useAddNode`, `useDeleteNode`가 `null`을 받고 핸들러 첫 줄에서 막는다 (타입 좁히기, 동작 변화 없음)
- 메모 패널은 `treeId !== null`일 때만 그린다
- 브라우저 확인은 하지 못했다 (로그인 필요)

### 3단계 — 노드 0개 트리에서 루트 노드 추가

트리가 이미 있는 경우만 먼저 연결한다.

- store — 루트 노드를 엣지 없이 넣는 방법 (`addNodeToStore`의 엣지를 선택으로 할지, 별도 action을 둘지는 구현 시 확정)
- `features/tree-editor/model/actions/add-root-node/useAddRootNode.ts`
  - 조건: store 노드가 0개이고 요청 중이 아님
  - `createNode(treeId, { parentId: null, orderId: 1, name })` → 응답으로 editor 노드 생성(`serverId` 채움) → store에 추가
  - 실패 시 alert만 (결정 2). `409 NODE409-2`는 새로고침 안내 문구 (결정 5)
- `useTreeEditorActions`에서 버튼 조건 변경 — "노드를 선택했거나, 노드가 하나도 없을 때"
  - 노드가 0개면 루트 추가, 아니면 기존 자식 추가로 나눈다
  - 요청 중 편집 잠금(`isMutating`)에 루트 추가 pending을 합친다
- 테스트: 버튼 조건·분기 순수 함수가 생기면 단위 테스트

확인: Swagger로 빈 트리를 만든 워크스페이스(또는 루트를 삭제한 트리)에서 루트 추가 → 새로고침 후에도 남아 있는지

**구현 결과** (`b45bd9b`)

- `useAddRootNode` — `add-root-node/useAddRootNode.ts`, 테스트 포함
- 버튼 조건은 순수 함수 `lib/add-node/isAddNodeAvailable.ts`. `useTreeEditorActions`가 `isAddNodeEnabled`를 내보내고 페이지 버튼이 `!isAddNodeEnabled || isMutating`으로 막는다
- 백엔드 오류 코드는 계약값이라 `entities/tree/model/constants.ts`의 `NODE_ERROR_CODE`에 두고, 판별은 `shared/api/authErrorCodes.ts`의 `getApiErrorCode`를 쓴다
- 결정 7(undo 기록 비우기)을 여기서 추가했다
- actions README에 "예시: Add Root Node" 절을 추가했다 (optimistic update 규칙의 예외)
- store에 엣지 없이 넣으려고 `addNodeToStore`의 엣지를 선택으로 바꿨으나, 4단계에서 `initializeTree`로 바꾸며 원래대로 되돌렸다
- 사용자가 브라우저에서 루트 추가를 확인했다. undo 기록 비우기 이후 동작은 확인하지 못했다

### 4단계 — 트리가 없으면 트리부터 만들기

- 3단계 hook에 `workspaceId`를 받아, 페이지가 넘긴 `treeId`가 `null`이면 트리 생성부터 한다 (결정 4-1)
- 트리 생성 mutation 선언부와 캐시 함수에 컨벤션 예외 주석 (결정 4)
- store에 `treeId`와 루트 노드를 함께 반영한 뒤 상세 캐시에 `treeId`를 채운다 (결정 4)
- 루트 노드 생성이 실패해도 상세 캐시에 `treeId`는 채운다
- 409는 결정 5대로 처리 (`TREE409-1`만 무효화)

확인: 루트 노드 생성만 실패시킨 뒤(예: 요청 차단) 다시 눌러 트리 생성 없이 루트 생성만 가는지. 버튼으로 만든 워크스페이스(#72)에서 루트 추가 → 헤더·캔버스 유지, 네트워크 탭에 워크스페이스 상세 재조회가 없는지, 루트가 한 번만 그려지는지, 새로고침 후 루트 노드 표시. 연속 클릭해도 요청이 한 번만 가는지

**구현 결과** (`4056ce3`)

- store 반영은 `addNodeToStore`가 아니라 **`initializeTree({ treeId, nodes: [루트], edges: [] })`** 로 한다. 노드가 0개라 결과가 같고, `treeId`까지 한 번에 채워 트리 있음·없음이 같은 코드를 탄다
- 흐름은 `mutateAsync` 두 번을 이어 쓴다: 트리 생성(`treeId`가 `null`일 때만) → 루트 생성 → `initializeTree` → undo 기록 비우기. 상세 캐시 채우기는 `finally`에서 하므로 루트 생성이 실패해도 트리를 새로 만들었다면 채운다
- `TREE409-1` 무효화는 mutation 선언부 `onError` (결정 5). 오류 코드는 `entities/workspace/model/constants.ts`의 `TREE_ERROR_CODE`
- 안내 문구: `TREE409-1` "이미 트리가 만들어진 워크스페이스입니다. 잠시 후 다시 시도해주세요." / `NODE409-2` "이미 루트 노드가 있습니다. 새로고침 후 다시 시도해주세요." / 그 외 "노드 추가에 실패했습니다."
- `isAddNodeAvailable`에서 `treeId` 인자를 뺐다. 노드가 0개면 항상 누를 수 있다
- `useTreeEditorActions`와 `LayoutFlow`가 `workspaceId`를 받는다
- 테스트에서 호출을 감시하려고 `entities/workspace`가 `workspaceApi`를 공개한다 (`entities/tree`의 `treeApi`와 같은 방식)
- "상세 캐시는 store 반영 뒤에 바뀐다" 테스트는 캐시 채우기를 트리 생성 직후로 옮기면 실패하는 것을 확인했다
- actions README의 Add Root Node 절에 흐름, 경쟁 타임라인, 컨벤션 예외, 실패 케이스를 적었다
- 위 "확인" 항목은 모두 아직 하지 못했다 (로그인 필요)

## 범위 밖

- AI 트리 생성 경로(`treeApi.createTree`) — #6
- 워크스페이스 생성 시 트리를 함께 만드는 백엔드 변경 (C안)
- undo/redo를 서버와 맞추는 문제 — 자식 노드 추가·삭제를 되돌려도 store만 바뀌고 서버에는 남는다. 이번 작업 전부터 있던 상태이며, 루트 추가만 결정 7로 막았다. 필요하면 별도 이슈로 만든다 (아직 만들지 않음)
