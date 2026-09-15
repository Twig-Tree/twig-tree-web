# #66 워크스페이스 상세 조회 API 연동

상위 이슈: #64

## 목표

`app/(main)/workspace/[workspaceId]/page.tsx`가 URL의 `workspaceId`로 워크스페이스를 조회해

- 헤더 바에 이름을 표시하고
- 조회한 `treeId`로 트리 에디터를 그린다 (`treeId = "1"` 하드코딩 제거).

이후 #67(이름 수정)이 이 조회 결과와 헤더 바를 그대로 쓴다.

## 현황

### 백엔드 (`BE-twig-tree` develop, `ea36b09`)

`GET /workspaces/{workspaceId}` — 구현 완료.

```java
record GetWorkspace(Long workspaceId, String name, Long folderId, Long treeId, LocalDateTime updatedAt)
```

- 목록·생성·이름 수정 응답과 **같은 DTO**다.
- `treeId`는 트리가 없으면 `null`이다. 버튼으로 만든 워크스페이스(#72)는 트리가 없어 항상 `null`이다.
- 오류
  - 없는 ID → `404 WORKSPACE404-1`
  - 남의 워크스페이스 → `403 WORKSPACE403-1`
  - 숫자가 아닌 ID(`/workspaces/abc`) → 타입 불일치 핸들러가 없어 `Exception` 핸들러로 떨어진다 (500 추정)

### 프론트엔드

- `entities/workspace`에 목록 조회·생성까지 있다. 이번 작업은 여기에 상세 조회를 더한다.
- `WorkspaceDTO`에 `treeId`가 없다.
- 워크스페이스 페이지는 `workspaceId`를 읽지 않고, `treeId = "1"`로 하드코딩된 트리 에디터만 그린다. 헤더 영역이 없다.
- 전역 `QueryClient`는 `retry: 1`이다.

## 결정 사항

### 1. ID 검증은 하지 않는다

`useGetWorkspaceQuery`에 `enabled: isValid...`를 두지 않는다.

`enabled: false`는 요청만 막고 상태를 만들지 않는다. query가 `pending` + `fetchStatus: idle`로 남아 `isLoading`·`isError`가 모두 `false`이므로, 페이지가 따로 분기하지 않으면 로딩도 오류도 아닌 빈 화면이 된다. 링크나 주소창으로 들어온 잘못된 ID를 처리하는 데는 소용이 없다. 검증 경계는 #53에서 정한다.

따라서 잘못된 ID도 요청을 보내고, 서버 오류를 그대로 아래 안내로 보여준다.

`enabled`는 트리 조회에만 쓴다. 검증이 아니라 앞 query 결과에 의존하는 조회라서다 — `treeId`가 `null`이면 조회할 트리가 없다.

### 2. 이름은 에디터 위 얇은 헤더 바에 표시한다

### 3. 조회 실패 안내

| 경우 | 제목 | 설명 | 버튼 |
| --- | --- | --- | --- |
| 404, 403 | 워크스페이스를 찾을 수 없습니다 | 삭제되었거나 접근할 수 없는 워크스페이스입니다. | 대시보드로 이동 |
| 그 외 (5xx, 네트워크) | 워크스페이스를 불러오지 못했습니다 | 잠시 후 다시 시도해주세요. | 다시 시도 |

- 403은 404와 합친다. 남의 워크스페이스가 존재한다는 사실을 따로 알려 줄 이유가 없다.
- 두 경우 모두 헤더 바와 트리 에디터를 그리지 않는다.
- 4xx는 재시도해도 결과가 같으므로 이 query는 4xx에서 재시도하지 않는다.
- 숫자가 아닌 ID는 500으로 떨어져 두 번째 안내가 뜬다. #53 전까지는 이대로 둔다.

### 4. `treeId`가 `null`이면 빈 캔버스

- 트리 조회를 보내지 않고 노드 없는 에디터를 그린다.
- 빈 워크스페이스에서 루트 노드를 추가하는 기능은 #83에서 다룬다.

## 단계

### 1단계 — entity: 상세 조회 query

- `api/types.ts`
  - `WorkspaceDTO`에 `treeId: number | null` 추가
  - `GetWorkspaceResponse = ApiResponse<WorkspaceDTO>` 추가
- 도메인 모델
  - 목록 카드용 `WorkspaceItem`은 그대로 두고, 상세용 타입에 `treeId: string | null`을 싣는다 (이름은 구현 시 확정)
  - 상세 mapper 추가. 목록 mapper는 기존대로 `treeId`를 버린다
- `api/workspaceApi.ts` — `getWorkspace(workspaceId: number)`
- `model/queryKeys.ts` — `details()`, `detail(workspaceId)`
- `model/queries.ts` — `useGetWorkspaceQuery(workspaceId: string)`
  - `enabled` 없음
  - 4xx 재시도 안 함
- `index.ts` 공개 API에 노출
- 테스트
  - `tests/mocks/data.ts`의 `RAW_WORKSPACE_DATA`에 `treeId` 추가 (`null`인 것과 아닌 것)
  - `tests/mocks/handlers.ts`에 `GET */api/workspaces/:workspaceId` — 없는 ID는 404
  - `queries.test.ts`: 도메인 모델 변환(`treeId` 문자열·`null`), 404면 `isError`
  - `mappers.test.ts`: 상세 mapper

확인: `vitest`, `tsc`, lint

### 2단계 — 페이지: 조회한 treeId로 에디터 렌더링

- `page.tsx`에서 `use(params)`로 `workspaceId`를 읽는다
- `useGetWorkspaceQuery(workspaceId)` 결과의 `treeId`를 에디터에 넘긴다
- `treeId = "1"` 하드코딩 제거
- `treeId`가 `null`이면
  - `useGetTreeQuery`를 보내지 않는다 (`enabled: treeId !== null`)
  - `useInitializeTree`·`useTreeEditorActions`·`MemoSidePanel`이 `treeId: string`을 전제하므로 `null`일 때의 처리를 확인하고 필요한 만큼 조정한다 — 조정 범위가 크면 이 시점에 알린다
- 워크스페이스 ID가 바뀌면 에디터 store가 이전 트리를 들고 있지 않도록 `key`로 재마운트한다 (디렉토리 페이지 선례)

확인: 로컬 백엔드에서 트리가 있는 워크스페이스·없는 워크스페이스 각각 접속

### 3단계 — 헤더 바와 이름 표시

- 페이지 레이아웃을 `flex-col`로 바꿔 에디터 위에 헤더 바를 둔다
- 헤더 컴포넌트는 `widgets/workspace`에 둔다 (#67에서 이름 수정 feature UI를 조합하게 된다)
- 로딩 중에는 이름 자리만 스켈레톤

확인: 이름 표시 스크린샷

### 4단계 — 조회 실패 안내

- 결정 3의 두 안내 화면
- 4xx 판별 함수가 필요하면 `shared/api`에 status만 보는 범용 함수로 둔다
- "다시 시도"는 query `refetch`

확인: `/workspace/999999`, 다른 계정의 워크스페이스, `/workspace/abc`

## 범위 밖

- 빈 워크스페이스의 루트 노드 추가 — #83
- URL ID 검증 경계 — #53
- 이름 수정 UI — #67
- `notFound()`·에러 바운더리 전환 — #73
