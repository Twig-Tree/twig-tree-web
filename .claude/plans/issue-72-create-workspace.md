# #72 워크스페이스 생성 API 연동 — 수행 계획

상위 이슈: #64 · 다음 작업: #67(이름 인라인 수정)

## 이슈 본문과 현재 코드의 차이

| 이슈 본문 | 현재 코드 |
| --- | --- |
| `WorkspaceDTO`, mapper, `workspaceQueryKeys` 작성 필요 | #65에서 이미 작성됨 |
| 디렉토리 화면이 `workspaces={[]}`를 받아 형제 목록이 없음 | #65 머지 완료. 두 디렉토리 페이지 모두 `useGetWorkspaceListQuery`를 쓰므로 처음부터 번호가 이어진다 |
| `updatedAt` 표시 규칙을 #62와 공유 | `formatUpdatedAt`이 이미 있다. #62는 백엔드 엔드포인트가 없어 대기 중이라 이번 범위 밖이다 |

남은 실작업은 생성 요청 DTO, API 함수, mutation, feature hook, 두 화면 연결과 `getAvailableFolderName` 일반화다.

## 결정 사항

### 기본 이름에 쓸 형제 목록은 캐시에서 읽는다

`queryClient.getQueryData(workspaceQueryKeys.listByFolder(folderId))`로 읽는다. 목록을 모르면 만들지 않는다. 백엔드가 같은 위치의 이름 중복을 거절하므로, 목록 없이 `Workspace`를 그대로 시도하면 그 폴더에 같은 이름이 있을 때 실패하고, 캐시가 비어 있는 채로 재시도해도 같은 이름이라 계속 실패한다. 폴더 생성도 목록이 도착하기 전에는 버튼을 비활성으로 두고 있어 규칙이 같아진다.

두 진입점 모두 그 시점에 목록을 알고 있다. 디렉토리 화면은 목록을 그리고 있고, 최신순 화면은 1단계에서 경로 선택 모달이 그 폴더의 워크스페이스를 조회한다. 모달의 확정 버튼은 두 목록이 도착한 뒤에만 열리므로 확정 시점에는 캐시가 있다.

`ensureQueryData`로 그 자리에서 가져오는 안을 먼저 세웠으나 택하지 않았다. 1단계로 캐시가 차게 되어 가져올 일이 없어졌고, 이 API 자체도 공식 문서에서 deprecated로 표시되어 다음 major에서 제거된다고 안내한다. 대체 API인 `queryClient.query()`는 설치된 `@tanstack/query-core@5.100.14`에 아직 없다.

### 위치는 렌더 시점에 알면 파라미터로, 아니면 호출 인자로 받는다

`useCreateFolder`는 폴더 ID를 렌더 시점에 받는다. 디렉토리 화면에서 그 값은 URL 파라미터라 화면이 그려질 때 이미 정해져 있고, 그래서 검사 결과를 `isCreateFolderDisabled`라는 상태로 내보내 버튼을 아예 비활성으로 그린다.

최신순 화면은 그 값이 렌더 시점에 없다. 버튼을 눌러 모달을 열고 폴더를 고른 뒤에야 위치가 정해지는데, 훅은 그보다 먼저 실행된다. 그래서 위치를 호출 인자로도 받게 한다.

```ts
// 디렉토리: 렌더 시점에 알고 있으니 넘긴다. 비활성 판정에 포함된다
const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace({ folderId });
createWorkspace();

// 최신순: 넘기지 않고 확정하는 순간에 준다
const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace();
createWorkspace(pickedFolderId);
```

호출 인자 하나로 통일하는 안도 있었으나 택하지 않았다. 그러면 검사가 항상 클릭 이후에 일어나 잘못된 ID의 결말이 버튼 비활성이 아니라 실패 안내가 된다. `/directory/abc`처럼 URL이 잘못된 화면에서 같은 헤더의 New Folder는 비활성인데 New Workspace만 눌리게 되어, 두 버튼이 다르게 군다.

`folderId`는 넘기지 않은 것(`undefined`)과 루트(`null`)를 구분해야 하므로 선택적 파라미터로 두고 그 의미를 주석에 남긴다.

### 최신순 화면은 생성 후 디렉토리 화면으로 이동한다

최신순 화면에는 아직 워크스페이스 목록이 없어(#62 대기) 생성 결과가 화면에 남지 않는다. 만든 것이 보이는 곳으로 데려간다.

#62로 목록이 붙으면 만든 워크스페이스가 최신순 화면 맨 위에 뜨므로 그 자리에 머무르는 선택지가 생기고, #67의 인라인 편집으로 이름을 바로 고칠 수 있다. 다만 이동이 영구 기획으로도 나쁘지 않다는 판단이 있어, 어느 쪽이 나은지는 목록을 붙인 뒤 직접 써 보고 정한다. 이 논의는 #62 본문에 남겼다.

### 이름은 묻지 않는다

폴더 생성과 같게 기본 이름을 붙여 만들고 이름은 카드에서 인라인으로 고친다(#67). 이름 입력을 받지 않으므로 30자 상한 검증도 이번 범위 밖이고, `MAX_WORKSPACE_NAME_LENGTH`는 #67에서 도입한다.

최신순 모달에서 이름을 입력받는 안은 보류했다. #62가 붙으면 최신순도 디렉토리와 같은 흐름이 되어 그 질문을 다시 걷어내야 하므로, 목록 연동 상태를 보고 판단한다.

## 단계

각 단계는 커밋 하나다. 구현하고 확인한 뒤 커밋하고 다음으로 간다.

### 1단계 — 폴더 경로 선택 모달에 워크스페이스 목록 표시

`src/features/folder/select-folder-path/ui/FolderPathPickerModal.tsx`

- `FolderPathPickerContent`에서 `useGetWorkspaceListQuery(currentFolderId)`를 함께 호출해 폴더 행 아래에 워크스페이스 행을 잇는다.
- 워크스페이스 행은 들어갈 수 없는 항목이므로 `button`이 아니라 `div`로 그린다. 호버 효과와 `ChevronRight` 없이 회색 톤으로 두고 아이콘도 폴더와 구분한다.
- 로딩·에러·확정 버튼 조건을 두 query 기준으로 합친다. 한쪽만 실패했을 때 성공한 쪽만 그리면 실패한 쪽이 "비어 있음"으로 읽힌다. `DirectoryContentsGrid`가 같은 이유로 이미 통합 처리하고 있어 규칙을 맞춘다.
- `EmptyFolderNotice` 문구를 폴더와 워크스페이스를 함께 가리키는 문장으로 고친다.
- 모달 테스트를 추가한다. 폴더와 워크스페이스가 함께 보이는지, 워크스페이스 행으로는 경로가 내려가지 않는지 확인한다. msw 핸들러는 이미 있다.

생성 연결(5~7단계)의 선행 작업이다. 최신순 경로에서 기본 이름 번호를 정할 근거가 이 단계에서 채워지는 캐시이고, 사용자가 모달에서 본 목록과 붙는 번호가 같은 값에서 나오게 된다.

### 2단계 — `getAvailableFolderName`을 `shared/lib`으로 일반화

- `src/shared/lib/naming/getAvailableName.ts`를 만든다. `getAvailableName(baseName, existingNames: string[])` 형태로, shared가 도메인 타입을 모르도록 이름 배열만 받는다.
- `getAvailableName.test.ts`를 작성한다. 기본 이름이 비어 있을 때, 2부터 이어질 때, 중간 번호가 비어 있을 때를 확인한다.
- `features/folder/create-folder`의 `getAvailableFolderName`을 삭제하고 `useCreateFolder`가 `getAvailableName("Folder", folders.map(({ name }) => name))`을 쓰게 한다. 공개 API에서도 제거한다.

### 3단계 — 생성 API

`src/entities/workspace/api/`

- `types.ts`에 `CreateWorkspaceRequest`(`{ name: string; folderId: number | null }`)와 `CreateWorkspaceResponse = ApiResponse<WorkspaceDTO>`를 추가한다.
- `workspaceApi.createWorkspace(body)`를 추가한다. 생성 응답도 조회와 같은 DTO이므로 `mapWorkspaceDtoToDomain`을 그대로 쓴다.
- `src/tests/mocks/handlers.ts`에 `POST */api/workspaces` 핸들러를 추가한다.

### 4단계 — `useCreateWorkspaceMutation`

`src/entities/workspace/model/mutations/useCreateWorkspaceMutation.ts`

- 공개 인자는 `{ name, folderId: string | null }`이고 API 호출 직전에 `number | null`로 바꾼다. `Number(null)`이 0이므로 null 확인이 숫자 변환보다 먼저다.
- `onSuccess`에서 `workspaceQueryKeys.listByFolder(folderId)`를 무효화한다. 최신순 목록 키는 #62에서 생기므로 이번 대상이 아니라는 것을 주석으로 남긴다.
- entity 공개 API에 `useCreateWorkspaceMutation`과 `workspaceQueryKeys`를 추가한다. 5단계에서 feature가 캐시를 읽을 때 이 키를 쓴다.
- 요청 body와 무효화 대상 키를 확인하는 테스트를 작성한다.

### 5단계 — `useCreateWorkspace`

`src/features/workspace/create-workspace/model/useCreateWorkspace.ts`

- 파라미터는 `{ folderId }` 하나이고 선택적이다. 넘기지 않은 `undefined`는 "렌더 시점에 위치를 모른다", `null`은 루트를 뜻한다는 것을 타입 주석에 남긴다.
- `createWorkspace(folderId?)`는 인자가 있으면 그것을, 없으면 파라미터 값을 대상으로 삼는다. 둘 다 없으면 만들지 않고 안내한다.
- 대상 ID를 검증하고, 형제 목록으로 `getAvailableName("Workspace", ...)`을 불러 이름을 정한 뒤 mutation을 호출한다. 실패하면 안내하고 `console.error`를 남긴다.
- 목록은 렌더 시점에 받은 `workspaces`가 있으면 그것을, 없으면 캐시에서 읽는다. 둘 다 없으면 만들지 않고 안내한다. 이름 중복을 백엔드가 거절하므로 목록을 모르는 채로 이름을 추측하지 않는다.
- `isCreateWorkspaceDisabled`는 요청 중이거나, 파라미터로 받은 `folderId`가 유효하지 않거나, 파라미터로 받은 `workspaces`가 아직 없을 때 참이다. 파라미터를 받지 않은 화면에서는 요청 중 여부만 남는다.

### 6단계 — 디렉토리 화면 연결

- `DirectoryHeader`에 `onCreateWorkspace`, `isCreateWorkspaceDisabled`를 받아 `NewWorkspaceButton`에 연결한다.
- `app/(main)/directory/page.tsx`는 `folderId: null`을, `app/(main)/directory/[folderId]/page.tsx`는 라우트 파라미터를 훅에 넘기고 `createWorkspace()`를 인자 없이 호출한다. 두 페이지 모두 `workspaceListQuery.data`를 함께 넘긴다. 잘못된 URL이거나 목록이 아직 없으면 New Folder와 같이 비활성이 된다.
- 폴더 생성과 달리 인라인 편집 진입은 없다(#67).

### 7단계 — 최신순 화면 연결

- `app/(main)/recent/page.tsx`의 `alert`을 생성 호출로 바꾸고, 더 이상 맞지 않는 "단일 생성 API가 없다" 주석을 지운다. 훅에는 `folderId`를 넘기지 않고 모달이 확정한 값을 `createWorkspace(folderId)`로 준다.
- 생성 후 선택한 폴더의 디렉토리 화면으로 이동한다. 루트는 `routes.directoryRoot`, 그 외는 `routes.directory(folderId)`다.
- `RecentHeader`에 `isCreateWorkspaceDisabled`를 넘겨 요청 중에는 버튼을 잠근다. 모달은 그대로 위치만 묻는다.

### 8단계 — 이슈 정리

- #64 TODO에서 #65(폴더별 목록 조회) 완료 체크가 빠져 있어 #72 완료 시 함께 정리한다.
- #62 본문에 생성 후 화면 이동 재판단 논의를 남기는 일은 계획 단계에서 이미 마쳤다.

## 범위 밖

- 워크스페이스 이름 수정과 30자 검증 (#67)
- 최신순 목록 조회와 그 캐시 무효화 (#62)
- 프롬프트로 트리와 함께 만드는 생성 경로 (#6)
- 생성한 워크스페이스로 바로 들어가는 이동. 해당 라우트는 treeId 기준이라 #6·#66이 필요하다
- ID 유효성 검사(`Number.isSafeInteger(id) && id > 0`)가 query와 feature 여러 곳에 반복되고 있으나, 공통 함수 추출은 이번 범위에서 다루지 않는다
