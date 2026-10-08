# API 타입 경계 규칙

프론트엔드 도메인 모델과 백엔드 API DTO는 각 계층에 적합한 타입을 사용한다. 두 타입 사이의 변환은 query 또는 mutation이 API 함수를 호출하는 경계와 API 응답 mapper에서 수행한다.

## 기본 원칙

- 프론트엔드의 ID는 URL, React key, 클라이언트 상태와 일관되도록 `string`을 사용한다.
- 백엔드 요청과 응답의 ID는 API 명세에 맞춰 `number`를 사용한다.
- 부모가 없는 리소스의 ID는 양쪽 모두 `null`을 유지한다.
- 백엔드가 "없음"을 `null`로 표현하면 도메인 모델에서도 `null`을 유지한다.
- API 함수의 인자와 요청 DTO는 백엔드 타입만 사용한다.
- query와 mutation의 공개 인자는 프론트엔드 타입을 사용한다.
- query와 mutation은 API 호출 직전에 프론트엔드 타입을 백엔드 타입으로 변환한다.
- ID 형식 검증은 신뢰할 수 없는 값이 들어오는 경계에서 한다. 라우트 파라미터는 페이지, mutation 입력은 feature hook이 검사한다.
- API 응답은 mapper를 통해 백엔드 DTO에서 프론트엔드 도메인 모델로 변환한다.
- query key에는 프론트엔드 타입을 사용한다.

타입 흐름은 다음과 같다.

```text
페이지 · 피처 · query key
string | null
        ↓ query 또는 mutation
number | null
        ↓ API 함수
백엔드
```

응답은 반대 방향으로 변환한다.

```text
백엔드 DTO의 number
        ↓ mapper
도메인 모델의 string
```

## API 함수

API 함수는 이미 검증되고 변환된 백엔드 타입을 전달받는다고 가정한다. URL이나 화면에서 전달된 문자열 ID를 API 함수 내부에서 변환하지 않는다.

```ts
export const folderApi = {
  getFolderList: async (
    folderParentId: number | null,
  ): Promise<FolderItem[]> => {
    const response = await axiosInstance.get("/folders", {
      params: {
        folderParentId: folderParentId === null ? undefined : folderParentId,
      },
    });

    return mapFolderListDtoToDomain(response.data.data);
  },
};
```

루트처럼 부모 ID가 `null`이면 쿼리 파라미터를 생략한다. 백엔드 명세에서 `null`을 다른 방식으로 표현하도록 정했다면 해당 명세를 따른다.

## Query

Query는 프론트엔드 타입을 받아 query key를 만들고, API 호출 직전에 백엔드 타입으로 변환한다.

```ts
export function useGetFolderListQuery(folderParentId: string | null) {
  const apiFolderParentId =
    folderParentId === null ? null : Number(folderParentId);

  return useQuery({
    queryKey: folderQueryKeys.childrenByParent(folderParentId),
    queryFn: () => folderApi.getFolderList(apiFolderParentId),
  });
}
```

Query key는 프론트엔드 ID 타입을 유지한다.

```ts
folderQueryKeys.childrenByParent(null);
// ["folder", "children", null]

folderQueryKeys.childrenByParent("12");
// ["folder", "children", "12"]
```

## Mutation

Mutation도 프론트엔드 문자열 ID를 받은 뒤 API 호출 직전에 숫자로 변환한다. 캐시 갱신에는 프론트엔드 ID를 사용한다.

```ts
interface CreateFolderVariables {
  name: string;
  folderParentId: string | null;
}

mutationFn: ({ name, folderParentId }: CreateFolderVariables) =>
  folderApi.createFolder({
    name,
    folderParentId: folderParentId === null ? null : Number(folderParentId),
  });
```

Feature는 ID가 유효한지 검사할 수 있지만, API 요청 타입으로 변환하는 책임은 query와 mutation에 둔다.

## 응답 Mapper

API 응답 DTO를 화면에서 직접 사용하지 않는다. mapper에서 도메인 타입으로 변환한다.

```ts
export const mapFolderDtoToDomain = (dto: FolderDTO): FolderItem => ({
  id: String(dto.folderId),
  name: dto.name,
});
```

## 유효성 검사

검증은 신뢰할 수 없는 문자열이 들어오는 경계에서 한다. 사용자가 주소창에 아무 값이나 넣을 수 있는 라우트 파라미터가 그 경계다.

| ID 출처                      | 검증 위치                           |
| ---------------------------- | ----------------------------------- |
| 라우트 파라미터              | 파라미터를 읽는 페이지              |
| mutation에 넘기는 화면 상태  | 그 mutation을 호출하는 feature hook |
| mapper가 만든 ID (서버 응답) | 다시 검증하지 않는다                |

### 페이지

페이지는 `use(params)` 직후 형식을 검사하고, 잘못되면 하위 화면을 렌더하지 않는다. 하위 화면이 없으면 query도 만들어지지 않아 요청이 나가지 않는다. 형식이 틀린 ID도 사용자에게는 없는 리소스와 같으므로 서버 404와 같은 안내를 보여준다.

```tsx
const { workspaceId } = use(params);

if (!isValidApiId(workspaceId)) {
  return <WorkspaceLoadError isNotFound />;
}
```

### Query와 mutation

Query는 형식을 검사하지 않는다. `enabled`와 `skipToken`은 앞선 조회 결과를 기다리는 것처럼 "아직 조회할 때가 아님"을 표현할 때만 쓴다. 검증에 쓰면 query가 로딩도 오류도 아닌 상태로 멈춰, 검사를 빠뜨린 호출부의 실수가 드러나지 않는다.

폴더 query들의 `enabled: isValidFolderId`는 이 규칙보다 먼저 있던 코드다. 디렉토리 페이지가 검사를 맡았으므로 #73에서 `useSuspenseQuery`로 바꿀 때 함께 걷어낸다.

Mutation도 변환만 한다. 입력 검증은 feature hook이 맡는다. 앞의 [Mutation](#mutation) 절과 같다.

### 형식 기준

ID는 `shared/lib/validation`의 `isValidApiId`로 검사한다. 문자열이 그대로 0으로 시작하지 않는 10진수 양의 안전정수일 때만 통과한다.

`Number()`의 결과로 판단하지 않는다. `Number()`는 `"1e3"`, `"0x10"`, `"012"`, `" 12"`를 모두 정수로 읽는다. 이런 값이 통과하면 URL과 다른 ID로 요청이 나가고, 같은 리소스가 다른 query key로 캐시에 갈린다.

```ts
isValidApiId("12"); // true
isValidApiId("1e3"); // false — Number("1e3")은 1000
```

부모 없음을 `null`로 표현하는 ID는 `null` 확인을 먼저 한다.

```ts
export const isValidFolderId = (folderId: string | null): boolean =>
  folderId === null || isValidApiId(folderId);
```

### `null`과 숫자 변환

`null` 여부를 반드시 숫자 변환보다 먼저 확인한다.

```ts
Number(null); // 0
```

다음 코드는 루트 ID인 `null`을 `0`으로 바꾸므로 사용하지 않는다.

```ts
folderApi.getFolderList(Number(folderParentId));
```

## 화면 전용 타입

도메인 모델과 화면 라이브러리가 요구하는 타입은 한 계층 더 갈린다. 이때 도메인 타입에서 화면 타입이 이미 소유하는 필드를 덜어내 데이터 슬롯에 재사용한다.

```ts
export type EditorNodeData = Omit<TreeNode, "id" | "parentId"> & {
  serverId: string | null;
};

export type CustomEditorNode = Node<EditorNodeData, "custom">;
```

도메인 모델을 화면 라이브러리의 모양에 맞춰 미리 쪼개 두지 않는다. 어떤 필드가 최상위로 가고 어떤 필드가 데이터 슬롯으로 가는지는 화면 라이브러리가 정하는 사실이므로, 그 라이브러리를 아는 계층에서 덜어낸다.

덜어낸 필드가 화면에서도 필요하면 이름을 바꿔 데이터 슬롯에 다시 싣는다. 위의 `serverId`가 그 경우다. 화면 라이브러리가 `id`를 자기 신원으로 쓰므로 도메인 ID는 최상위에 남을 수 없고, 화면이 먼저 만든 객체는 아직 서버 ID가 없어 `null`이 된다.

`position`, `selected`처럼 서버가 모르는 값은 화면 타입에만 두고 도메인 모델에 넣지 않는다. 도메인 모델은 서버가 아는 사실만 담는다.

## 없음의 표현

응답 mapper에서 기본값 치환으로 서버가 준 값을 바꾸지 않는다.

```ts
// 사용하지 않는다. 서버의 null과 빈 문자열을 구분할 수 없게 된다.
memo: dto.memo ?? "";
```

```ts
memo: dto.memo;
```

화면에 필요한 기본값은 UI 경계에서 만든다.

```tsx
<MemoEditor initialMemo={savedMemo ?? ""} />
```

## 책임 요약

| 계층              | 사용하는 ID 타입 | 책임                             |
| ----------------- | ---------------- | -------------------------------- |
| 페이지·피처       | `string \| null` | URL 및 화면 상태 사용, 입력 검증 |
| Query key         | `string \| null` | 프론트 캐시 식별                 |
| Query·Mutation    | 양쪽 타입        | 요청 직전 변환                   |
| API 함수·요청 DTO | `number \| null` | 백엔드 계약 표현                 |
| 응답 DTO          | `number \| null` | 백엔드 응답 표현                 |
| Mapper            | 양쪽 타입        | DTO를 도메인 모델로 변환         |
| 도메인 모델       | `string \| null` | 프론트엔드에서 사용              |
| 화면 전용 타입    | `string \| null` | 도메인 데이터에 화면 상태 결합   |
