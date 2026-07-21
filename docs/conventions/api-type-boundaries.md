# API 타입 경계 규칙

프론트엔드 도메인 모델과 백엔드 API DTO는 각 계층에 적합한 타입을 사용한다. 두 타입 사이의 변환은 query 또는 mutation이 API 함수를 호출하는 경계와 API 응답 mapper에서 수행한다.

## 기본 원칙

- 프론트엔드의 ID는 URL, React key, 클라이언트 상태와 일관되도록 `string`을 사용한다.
- 백엔드 요청과 응답의 ID는 API 명세에 맞춰 `number`를 사용한다.
- 부모가 없는 리소스의 ID는 양쪽 모두 `null`을 유지한다.
- API 함수의 인자와 요청 DTO는 백엔드 타입만 사용한다.
- query와 mutation의 공개 인자는 프론트엔드 타입을 사용한다.
- query와 mutation은 API 호출 직전에 프론트엔드 타입을 백엔드 타입으로 변환한다.
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

문자열을 숫자로 변환한 후 API를 호출하기 전에 유효성을 검사한다.

```ts
const apiFolderParentId =
  folderParentId === null ? null : Number(folderParentId);

const isValidFolderParentId =
  apiFolderParentId === null ||
  (Number.isSafeInteger(apiFolderParentId) && apiFolderParentId > 0);
```

`null` 여부를 반드시 숫자 변환보다 먼저 확인한다.

```ts
Number(null); // 0
```

다음 코드는 루트 ID인 `null`을 `0`으로 바꾸므로 사용하지 않는다.

```ts
folderApi.getFolderList(Number(folderParentId));
```

## 책임 요약

| 계층              | 사용하는 ID 타입 | 책임                     |
| ----------------- | ---------------- | ------------------------ |
| 페이지·피처       | `string \| null` | URL 및 화면 상태 사용    |
| Query key         | `string \| null` | 프론트 캐시 식별         |
| Query·Mutation    | 양쪽 타입        | 검증 및 요청 직전 변환   |
| API 함수·요청 DTO | `number \| null` | 백엔드 계약 표현         |
| 응답 DTO          | `number \| null` | 백엔드 응답 표현         |
| Mapper            | 양쪽 타입        | DTO를 도메인 모델로 변환 |
| 도메인 모델       | `string \| null` | 프론트엔드에서 사용      |
