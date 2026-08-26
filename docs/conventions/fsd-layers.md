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
- 백엔드 계약에서 오는 제약값

이름 길이나 파일 크기 상한처럼 초과 시 백엔드가 거절하는 값은 계약의 일부다. 계약을 소유하는 계층이 entity이므로 상한값도 entity가 소유한다.

```ts
// src/entities/folder/model/constants.ts
export const MAX_FOLDER_NAME_LENGTH = 30;
```

검증 로직 자체는 `shared/lib`에 둘 수 있지만, 그때도 값은 인자로 받는다. `shared`는 도메인을 모르는 계층이므로 세는 규칙만 갖는다.

```ts
validateNameLength(name, "폴더", MAX_FOLDER_NAME_LENGTH);
```

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
├─ model/
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

### 복합 Feature의 model 구성

하나의 Feature 안에 여러 사용자 행동과 화면 생명주기 로직이 함께 있다면 `model` 내부를 책임별 하위 디렉터리로 나눌 수 있다. 구체적인 디렉터리 이름과 경계는 해당 Feature의 복잡도와 도메인에 따라 결정하고, 선택한 구조와 이유는 Feature 내부 README에 기록한다.

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

화면을 store가 그리는 경우, query cache에는 낙관적 업데이트를 하지 않는다.

즉시 반영은 store가 담당하고 cache는 서버 응답으로만 갱신한다. cache가 화면에 도달하지 않는 구조에서 cache를 낙관적으로 조작하면 화면에 기여하지 않는 정합성 유지 비용만 남는다. 임시 ID 대응, rollback, 요청 취소와 백업이 모두 여기서 생긴다.

```ts
// 사용하지 않는다. 화면은 store에서 그려지므로 cache의 임시 값은 보이지 않는다.
onMutate: async (variables) => {
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, /* 추측한 결과 */);
  return { previous };
},
```

응답 본문이 없어 cache를 확정할 수 없는 작업은 `onSuccess`에서 무효화한다. 실패한 경우에는 cache를 건드린 적이 없으므로 `onSettled`에 두지 않는다.

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

### 부수효과가 있는 슬라이스의 예외

`index.ts`는 슬라이스의 모든 모듈을 한 그래프로 묶는다. 슬라이스 안에 import 시점부터 동작하는 모듈이 있으면, 그 슬라이스에서 값 하나만 가져와도 전부 함께 로드된다.

`entities/tree`와 `entities/folder`가 이 경우다. 공개 API를 거치면 `api/` → `shared/api/axiosInstance` → `shared/config`까지 이어지고, `shared/config`는 모듈 로드 시점에 환경변수를 검사하며 없으면 예외를 던진다. vitest는 `.env`를 읽지 않으므로 단위 테스트가 이 지점에서 죽는다.

따라서 **부수효과 없는 값을 이런 슬라이스에서 가져올 때는 해당 모듈을 직접 짚는다.**

```ts
import { MAX_MEMO_LENGTH } from "@/src/entities/tree/model/constants";
import { mapNodesDtoToDomain } from "@/src/entities/tree/lib/mappers";
```

이때 상수 모듈은 `index.ts`로 내보내지 않는다. 내보내 두면 공개 API 쪽이 정답처럼 보여 같은 문제가 되풀이된다.

타입은 이 예외에 해당하지 않는다. `import type`은 컴파일 시 지워져 런타임 그래프를 만들지 않으므로 공개 API를 그대로 쓴다.

```ts
import type { TreeNode } from "@/src/entities/tree";
```

**테스트 파일만 깊은 경로로 바꾸는 방법은 통하지 않는다.** 테스트가 검사하는 대상 모듈이 공개 API를 import하면 그 경로로 그대로 끌려온다. 경로를 정하는 쪽은 테스트가 아니라 검사 대상이다.

```text
validateMemoContent.test.ts
├─ "@/src/entities/tree/model/constants"   깊은 경로. 안전
└─ "./validateMemoContent"                 검사 대상
      └─ "@/src/entities/tree"             공개 API. 여기서 예외가 발생한다
```

## Entity와 Feature는 서로 다른 축으로 나눈다

한 도메인이 여러 슬라이스로 갈릴 때, entity와 feature는 각각 다른 기준으로 위치를 정한다.

| 계층    | 분리 축                       |
| ------- | ----------------------------- |
| entity  | 누가 캐시를 소유하는가        |
| feature | 어떤 상태 맥락에서 동작하는가 |

트리와 노드가 이 경우에 해당한다. 기획상 트리는 노드 간 구조와 계층을, 노드는 개별 노드의 속성과 내용을 담당한다.

그러나 두 도메인의 데이터는 `GET /trees/{treeId}/nodes` 하나에 함께 담겨 온다. 캐시가 하나뿐이므로 소유자도 `entities/tree` 하나다. 따라서 슬라이스를 도메인별로 나누지 않고, 기획서의 도메인 구분은 슬라이스 경계가 아니라 내부 파일 이름으로 표현한다.

```text
src/entities/tree/api/
├─ treeApi.ts   구조 — 트리 조회, 노드 생성·삭제
├─ nodeApi.ts   속성 — 노드 제목 수정
└─ memoApi.ts   내용 — 메모 생성·삭제
```

반면 노드 제목 편집의 유스케이스 코드는 `features/tree-editor`에 둔다. 이 코드가 하는 일이 editor store의 label을 조작하고 실패 시 되돌리는 것이기 때문이다. 노드 속성이라서가 아니라 트리 편집기 안에서 일어나는 편집이라 필요한 로직이다.

`features/node/...`로 분리하면 그 feature가 `features/tree-editor`의 store를 참조해야 해서 같은 계층 간 의존이 생긴다. Feature를 나눌 때는 "이 로직이 어느 store와 화면 흐름에 묶여 있는가"를 먼저 본다.

## 한 응답을 여러 도메인이 나눠 쓸 때

백엔드가 여러 도메인의 데이터를 한 응답에 담아 주면, 프론트엔드에서 도메인을 나눠도 캐시는 하나로 남는다.

```text
GET /trees/{treeId}/nodes  →  { nodeId, parentId, orderId, name, memo }
                                └─ 구조 ─┘   └── 속성 ──┘
```

캐시는 그 응답을 조회하는 슬라이스가 소유한다. 이때 도메인별로 슬라이스를 나누면, 캐시를 갱신해야 하는 mutation이 전부 캐시 소유자를 향한다.

```text
entities/node ──(treeQueryKeys, NodeDTO)──▶ entities/tree
entities/memo ──(treeQueryKeys, NodeDTO)──▶ entities/tree
```

이 의존은 캐시 소유권에서 나오므로 제거할 수 없다. 슬라이스를 나눠 둔 채로는 경계를 가로지르는 import를 계속 관리해야 하고, 응답 DTO를 어디에 둘지 같은 문제가 반복된다. 따라서 **캐시를 공유하는 도메인은 한 슬라이스에 둔다.**

백엔드가 조회 API를 도메인별로 쪼개면 캐시도 함께 갈라지므로 그때 슬라이스를 다시 나눌 수 있다. 도메인별 파일을 유지해 두면 추출 비용이 낮다.

## 판단 기준

코드 위치가 불분명할 때 다음 질문을 사용한다.

1. 도메인 데이터 자체의 CRUD인가? → `entities`
2. 하나의 query 또는 mutation인가? → `entities`
3. 다른 도메인과 한 응답·한 캐시를 공유하는가? → 캐시를 소유한 `entities` 슬라이스
4. query와 mutation에 검증·입력·UI 조건을 결합하는가? → `features`
5. 여러 entity와 feature를 하나의 화면 영역으로 조합하는가? → `widgets`
6. 라우트 파라미터를 해석하고 페이지를 구성하는가? → `app`
7. 특정 도메인에 속하지 않는 공통 기능인가? → `shared`
