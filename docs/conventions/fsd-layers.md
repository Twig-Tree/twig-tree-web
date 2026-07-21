# FSD 계층 책임 규칙

이 프로젝트는 Feature-Sliced Design의 의존 방향을 따르며, 서버 데이터 접근과 사용자 유스케이스 조합을 분리한다.

```text
app
 ↓
widgets
 ↓
features
 ↓
entities
 ↓
shared
```

아래 계층은 위 계층을 import하지 않는다. 예를 들어 `entities`는 `features`를 import할 수 없다.

## Entity 계층

Entity는 도메인의 핵심 데이터와 해당 데이터에 대한 기본 서버 작업을 소유한다.

Entity에 작성하는 항목은 다음과 같다.

- 도메인 모델과 타입
- 백엔드 요청·응답 DTO
- DTO와 도메인 모델 사이의 mapper
- CRUD API 함수
- query key
- 단일 조회 목적의 query
- 단일 변경 목적의 mutation
- 도메인 객체를 표현하는 기본 UI

폴더 entity의 예시는 다음과 같다.

```text
src/entities/folder/
├─ api/
│  ├─ folderApi.ts
│  └─ types.ts
├─ lib/
│  └─ mappers.ts
├─ model/
│  ├─ queryKeys.ts
│  ├─ queries.ts
│  ├─ mutations/
│  │  └─ useCreateFolderMutation.ts
│  └─ types.ts
├─ ui/
│  └─ FolderCard.tsx
└─ index.ts
```

Entity query와 mutation은 하나의 서버 작업에 집중한다.

```ts
export function useGetFolderListQuery(folderParentId: string | null) {
  return useQuery({
    queryKey: folderQueryKeys.childrenByParent(folderParentId),
    queryFn: () => folderApi.getFolderList(/* API ID */),
  });
}
```

```ts
export function useCreateFolderMutation() {
  return useMutation({
    mutationFn: folderApi.createFolder,
    onSuccess: /* 관련 entity query cache 갱신 */,
  });
}
```

Entity mutation에는 해당 entity의 캐시 갱신, optimistic update, rollback처럼 서버 상태와 직접 관련된 처리를 둘 수 있다. 특정 화면의 알림, 모달 제어, 사용자 입력 조합은 entity에 두지 않는다.

## Feature 계층

Feature는 사용자가 수행하는 하나의 유스케이스를 구현한다. Entity의 query와 mutation을 조합하고, 입력 검증과 UI 상태를 더해 화면에서 바로 사용할 수 있는 handler hook을 제공한다.

Feature에 작성하는 항목은 다음과 같다.

- Entity query와 mutation의 조합
- 사용자 입력 및 비즈니스 규칙 검증
- 버튼 활성화 조건과 같은 파생 UI 상태
- 여러 단계의 동작을 하나로 묶는 handler
- 유스케이스에만 필요한 순수 함수
- 유스케이스를 실행하는 UI

폴더 생성 feature의 예시는 다음과 같다.

```text
src/features/folder/create-folder/
├─ hooks/
│  └─ useCreateFolder.ts
├─ lib/
│  └─ getAvailableFolderName.ts
├─ ui/
│  └─ NewFolderButton.tsx
└─ index.ts
```

Handler hook은 entity mutation에 화면의 데이터와 규칙을 결합한다.

```ts
export function useCreateFolder({
  folders,
  folderParentId,
}: UseCreateFolderParams) {
  const { mutateAsync, isPending } = useCreateFolderMutation();

  const numericFolderParentId =
    folderParentId === null ? null : Number(folderParentId);

  const isValidFolderParentId =
    numericFolderParentId === null ||
    (Number.isSafeInteger(numericFolderParentId) && numericFolderParentId > 0);

  const isCreateFolderDisabled =
    isPending || !isValidFolderParentId || folders === undefined;

  const createFolder = async () => {
    if (isCreateFolderDisabled || !folders) return;

    await mutateAsync({
      name: getAvailableFolderName(folders),
      folderParentId,
    });
  };

  return {
    createFolder,
    isCreateFolderDisabled,
  };
}
```

이 hook은 다음을 조합한다.

- 폴더 생성 mutation
- 부모 폴더 ID 검증
- 형제 폴더 이름을 이용한 기본 이름 결정
- 요청 중 중복 실행 방지
- 버튼 비활성화 상태

ID를 실제 API 요청 타입으로 변환하는 작업은 entity mutation이 담당한다. Feature는 검증을 위해 숫자로 해석할 수 있지만 mutation에는 프론트엔드 ID를 전달한다.

## Widget과 Page 계층

Widget은 여러 entity와 feature UI를 조합한다. Page는 라우트 파라미터와 페이지 데이터를 준비하고 widget과 feature hook을 연결한다.

```ts
const folderListQuery = useGetFolderListQuery(folderParentId);

const { createFolder, isCreateFolderDisabled } = useCreateFolder({
  folders: folderListQuery.data,
  folderParentId,
});
```

```tsx
<DirectoryHeader
  onCreateFolder={() => void createFolder()}
  isCreateFolderDisabled={isCreateFolderDisabled}
/>

<DirectoryContentsGrid
  folders={folderListQuery.data ?? []}
  workspaces={workspaces}
/>
```

Page가 API 함수를 직접 호출하거나 CRUD 요청의 세부 구현을 소유하지 않도록 한다.

## 서버 상태와 클라이언트 상태

서버에서 가져온 데이터는 TanStack Query를 단일 원본으로 사용한다.

```ts
const folderListQuery = useGetFolderListQuery(folderParentId);
```

Query 결과를 다시 `useState`에 복사하지 않는다.

```ts
// 사용하지 않는다.
const { data } = useGetFolderListQuery(parentId);
const [folders, setFolders] = useState(data);
```

`useState`와 store는 화면에서만 필요한 클라이언트 상태에 사용한다.

- 열려 있는 모달
- 현재 편집 중인 카드
- 아직 서버에 저장하지 않은 입력값
- 드래그 상태와 선택 상태

Query와 mutation은 다음 서버 상태 및 메타데이터를 관리한다.

- 조회 데이터
- 캐시
- 로딩 및 pending 상태
- 오류 상태
- 재조회와 무효화

## 순수 함수 위치

React와 서버 요청에 의존하지 않는 유스케이스 규칙은 feature의 `lib`에 둔다.

```ts
getAvailableFolderName(folders);
```

여러 feature와 entity에서 재사용되는 범용 함수만 `shared/lib`로 이동한다.

## 공개 API

각 slice 외부에서는 가능한 한 `index.ts`의 공개 API를 통해 import한다.

```ts
import {
  useGetFolderListQuery,
  useCreateFolderMutation,
} from "@/src/entities/folder";

import { useCreateFolder } from "@/src/features/folder/create-folder";
```

## 판단 기준

코드 위치가 불분명할 때 다음 질문을 사용한다.

1. 도메인 데이터 자체의 CRUD인가? → `entities`
2. 하나의 query 또는 mutation인가? → `entities`
3. query와 mutation에 검증·입력·UI 조건을 결합하는가? → `features`
4. 여러 entity와 feature를 하나의 화면 영역으로 조합하는가? → `widgets`
5. 라우트 파라미터를 해석하고 페이지를 구성하는가? → `app`
6. 특정 도메인에 속하지 않는 공통 기능인가? → `shared`
