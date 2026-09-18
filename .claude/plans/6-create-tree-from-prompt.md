# #6 프롬프트로 워크스페이스와 트리 생성

상위 이슈: #4 · 선행: #83 (머지 예정) · 브랜치: `feat/create-tree-from-prompt` (main 위, #83 머지 후)

## 진행 상황 (다른 곳에서 이어갈 때 먼저 읽기)

| 단계                                  | 상태             | 커밋 |
| ------------------------------------- | ---------------- | ---- |
| 1. entity: 트리 생성 API·DTO·mutation | 완료 (커밋 대기) |      |
| 2. feature: 생성 handler hook         | 대기             |      |
| 3. 화면: 대시보드 연결과 생성 중 표시 | 대기             |      |
| 4. 첨부 파일 전송                     | 대기             |      |

- 결정 사항은 모두 확정되었다. 미결 항목 없음.
- #83은 main에 머지되었고, 브랜치는 그 위에 있다.
- 구현 중 계획과 달라진 점은 각 단계의 **구현 결과**에 적는다.

## 목표

대시보드 프롬프트 입력으로 LLM이 만든 트리를 받아, 워크스페이스·트리·노드를 한 번에 만들고 그 워크스페이스로 이동한다.

- 사용자가 직접 워크스페이스를 만드는 경로(#72, #83)와는 다른 흐름이다. 그쪽은 빈 워크스페이스를 만들고 첫 루트 노드를 추가할 때 트리를 만든다(지연 생성). 이 흐름은 **백엔드가 워크스페이스·트리·노드를 한 트랜잭션에 만들어 응답으로 전부 돌려준다.**
- 이슈 #6의 "워크스페이스 생성 흐름과 연결"이 가리키는 것이 이 경로다.

## 현황 (착수 전 기준)

### 백엔드 (`BE-twig-tree` develop, `7ee128d`)

`POST /tree-request` — `ChatController`. 같은 경로에서 Content-Type으로 두 핸들러가 갈린다.

- **JSON**: body `{ message (≤500자), provider }`
- **multipart/form-data**: `file`, `message` (≤500자), `provider` — 모두 `required = false`지만 `file`과 `message`가 **둘 다 비면 `CHAT400-3`**
- **`?mock=empty|small|large|max`**: LLM을 호출하지 않고 `mocks/chat/tree-*.json`을 그대로 반환한다. mock 분기가 body 검증보다 먼저라 body 없이도 응답이 온다
- **응답 201** (`TreeGenResDTO`)

  ```json
  {
    "treeId": 12,
    "workspaceId": 12,
    "nodes": [
      {
        "nodeId": 1,
        "name": "컴퓨터 사이언스",
        "memo": "전공 기초 개념 묶음",
        "parentId": null,
        "orderId": 1
      },
      {
        "nodeId": 2,
        "name": "자료구조",
        "memo": "데이터를 조직하고 저장하는 방법",
        "parentId": 1,
        "orderId": 1
      }
    ]
  }
  ```

- `GeneratedTreeWriter`가 워크스페이스(기본 이름 `제목 없음`, 30자 상한)·트리·노드를 한 트랜잭션에 저장한다. **워크스페이스는 루트에 생긴다** — 응답에 `folderId`가 없고 폴더를 지정할 수단도 없다.
- **`provider`가 `null`이면 `CHAT400-1`**(`UNSUPPORTED_PROVIDER`). `resolveClient`가 `null`과 일치하는 클라이언트를 못 찾는다. 선택 항목이 아니다.
- 타임아웃: `ChatService.LLM_TIMEOUT` 65초, `OpenAiConfig.RESPONSE_TIMEOUT` 60초.
- 파일 제약: `PlainTextParser`(txt·md) **1MB**, pdf·docx·hwp·hwpx **10MB**, 추출 본문 **20,000자**.
- 오류 코드: `CHAT400-1`~`CHAT400-11`, `CHAT500-1`(LLM 호출 실패), `CHAT500-2`(저장 실패), `CHAT502-1`(응답 형식 오류), `CHAT504-1`(LLM 타임아웃). 문구가 모두 사용자용으로 쓰여 있다.

### 프론트엔드

- `treeApi.createTree`가 `/tree-request?scenario=small`을 부른다. **파라미터 이름이 백엔드의 `mock`과 달라 목조차 붙지 않는다.** body도 없고 어디서도 호출하지 않는다.
- `TreeDTO = { treeId, nodes }` — **`workspaceId`가 없다.** 라우트가 `/workspace/[workspaceId]`라 이게 없으면 생성 후 이동할 수 없다.
- 대시보드의 `onSubmit`이 `alert("API 연동 예정입니다.")`이고, 주석에 `create-workspace-from-prompt` feature로 교체하라고 적혀 있다.
- `PromptDraft = { text, attachments }`이고 `createAttachmentFromFile`이 이름·크기·MIME만 남기고 **원본 `File`을 버린다.** 지금 상태로는 서버에 보낼 파일이 없다.
- 첨부 제약은 백엔드와 맞다 (확장자 6종, 1개, 10MB). **평문 1MB 구분만 없다.**
- `useComposePrompt.submitPrompt`가 `onSubmit` 직후 입력을 비운다. 주석에 "서버 요청이 붙으면 성공 시점으로 옮기라"고 적혀 있다.
- `axiosInstance`: `timeout: 10000`, 기본 헤더 `Content-Type: application/json`.
- `QueryClient`: `staleTime` 60초, queries `retry: 1`, mutations `retry: 0`.
- `treeQueryKeys.detail(treeId)` 캐시에는 `TreeNode[]`가 들어간다 (`useGetTreeQuery`, `useAddNodeMutation`이 같은 모양으로 쓴다).
- 워크스페이스 페이지 순서: `useGetWorkspaceQuery` → `treeId` → `useGetTreeQuery`.

## 결정 사항

### 1. 이름은 `createTreeFromPrompt`

기존 `treeApi.createTree`를 **지우지 않고 이 이름으로 고쳐 쓴다.** LLM 연결 전에 트리 생성을 확인하려고 두었던 임시 함수이고, 엔드포인트가 같다.

- `treeApi.createTreeFromPrompt`, `useCreateTreeFromPromptMutation`
- `createTree`는 빈 트리를 만드는 `POST /workspaces/{id}/trees`와 헷갈린다. 두 경로를 가르는 차이는 **무엇으로부터 만드는가**이므로 접미사로 구분한다.

  ```
  workspaceApi.createWorkspaceTree    워크스페이스에 빈 트리
  treeApi.createTreeFromPrompt        프롬프트로 채운 트리
  ```

- `generateTree`도 후보였지만 `function-naming.md`의 접두사 표에 `generate`가 없다. 새 값을 만들어 돌려주는 함수는 `create`다. 표에 없는 접두사를 들이면 `create`와 무엇이 다른지를 매번 설명해야 한다.
- feature 이름 `create-workspace-from-prompt`와도 접미사가 맞는다.

### 2. `provider`는 `OPENAI` 고정으로 보낸다

`null`이면 400이므로 반드시 보내야 한다. 사용자가 고를 이유가 아직 없으므로 프론트 상수로 둔다.

- `LlmProvider`에 해당하는 리터럴 유니온을 `entities/tree`에 둔다. 값이 백엔드 enum에서 오는 계약이므로 entity가 소유한다.
- provider 선택 UI는 범위 밖이다.

### 3. 요청 형식은 첨부 유무로 분기한다

- 첨부 없음 → JSON `{ message, provider }`
- 첨부 있음 → `FormData`에 `file`을 담고 `message`·`provider`는 쿼리 파라미터로 (백엔드가 `@RequestParam`으로 받는다)

항상 multipart로 보내면 분기는 없어지지만, 텍스트만 보내는 경우가 압도적으로 흔하고 백엔드가 두 핸들러를 나눠 둔 의도와도 맞지 않는다.

- multipart 요청은 axios 기본 헤더(`application/json`)를 덮어야 한다. `FormData`를 넘기면서 `Content-Type`을 `undefined`로 지우면 브라우저가 boundary를 붙여 준다.

### 4. 원본 `File`은 `AttachmentItem`이 갖는다

`AttachmentItem`에 `file: File`을 더한다.

- `name`·`sizeInBytes`·`mimeType`이 이미 `File`에서 파생된 값이라 원본이 같은 자리에 있는 편이 자연스럽고, 첨부 항목과 파일의 수명이 정확히 같다.
- 별도 `Map<attachmentId, File>`을 두면 목록과 파일 두 상태를 같은 id로 맞춰야 해서 제거·초기화마다 동기화 지점이 늘어난다.
- `AttachmentItem`은 서버 응답 모델이 아니라 화면 전용 모델이므로 `File`을 담아도 도메인 모델 규칙("서버가 아는 사실만")에 어긋나지 않는다.
- 파생 필드를 지우고 `{ id, file }`만 남기는 안은 `AttachmentChip`·`FileTypeIcon`과 그 테스트까지 번져서 택하지 않는다.

### 5. 응답의 노드를 트리 캐시에 심고 재조회하지 않는다

응답에 노드가 전부 들어 있으므로 이동 후 `GET /trees/{treeId}/nodes`를 다시 보내지 않는다.

- `mapNodesDtoToDomain(nodes)` 결과를 `treeQueryKeys.detail(String(treeId))`에 `setQueryData`로 넣는다. `useGetTreeQuery`와 같은 `TreeNode[]` 모양이다.
- **`staleTime`이 60초라 심은 직후 mount해도 배경 재조회가 나가지 않는다.** 0이었다면 캐시가 있어도 요청이 한 번 더 나간다.
- 캐시 갱신이므로 mutation 선언부 `onSuccess`에 둔다 (컨벤션대로).
- #83과 달리 store 반영 순서를 신경 쓸 필요가 없다. 대상 워크스페이스 페이지가 아직 마운트되지 않았고, `useInitializeTree`는 이동 후 처음 실행될 때 이 캐시를 그대로 읽는다.

### 6. 워크스페이스 상세 캐시는 심지 않는다

응답에 `name`·`folderId`·`updatedAt`이 없다.

- `useSetWorkspaceTreeIdInCache`가 세운 원칙 — 모르는 필드를 채워 캐시를 만들면 조회하지 않은 값이 성공 데이터처럼 보인다 — 을 그대로 따른다.
- 이동 후 `useGetWorkspaceQuery`가 한 번 조회한다. 아끼는 것은 트리 노드 조회뿐이다.

### 7. 워크스페이스 목록 캐시는 무효화한다

새 워크스페이스가 루트에 생겼으므로 디렉토리 목록이 낡는다.

- 응답에 `folderId`가 없지만 **백엔드가 루트에 만드는 것이 확정**이므로 `workspaceQueryKeys.listByFolder(null)`만 무효화하면 된다.
- 최신순 목록(#62)은 아직 연동 전이라 무효화 대상이 없다. 연동되면 여기에 더한다.

### 8. 이 요청만 타임아웃을 늘린다

백엔드 LLM 타임아웃이 65초인데 axios 기본은 10초다. 지금 붙이면 항상 프론트가 먼저 끊는다.

- 요청 단위로 `timeout: 90000`을 준다. 65초에 파싱·검증·저장 여유를 더한 값이다.
- `axiosInstance` 기본값은 건드리지 않는다. 다른 요청까지 90초를 기다리게 할 이유가 없다.

### 9. 실패하면 입력을 비우지 않는다

`submitPrompt`가 `onSubmit` 직후 비우는 것을 성공 시점으로 옮긴다.

- 65초를 기다린 뒤 실패했는데 입력까지 사라지면 다시 타자를 쳐야 한다.
- `useComposePrompt`가 결과를 알려면 `onSubmit`이 `Promise`를 반환해야 한다. 시그니처를 `(draft) => void | Promise<void>`로 넓히고, `submitPrompt`가 `await` 후 성공했을 때만 비운다.
- 요청 중에는 기존 `isSubmitting`으로 잠기므로 중복 전송은 이미 막혀 있다.

### 10. 슬라이스 위치

| 항목                 | 위치                                           |
| -------------------- | ---------------------------------------------- |
| API 함수·요청 DTO    | `entities/tree/api`                            |
| mutation             | `entities/tree/model/mutations`                |
| handler hook·UI 연결 | `features/prompt/create-workspace-from-prompt` |

- mutation을 `entities/tree`에 두는 이유는 응답의 본체가 트리와 노드이고, 이 요청이 확정하는 캐시가 트리 노드 캐시이기 때문이다 (fsd-layers "누가 캐시를 소유하는가").
- feature 이름은 대시보드 주석이 예고한 `create-workspace-from-prompt`를 그대로 쓴다. 기존 `features/prompt/compose-prompt`와 같은 슬라이스 묶음에 둔다.
- **컨벤션 예외:** 워크스페이스 목록 무효화(결정 7) 때문에 `entities/tree`가 `entities/workspace`의 `workspaceQueryKeys`를 import한다. entity 간 import다.
  - fsd-layers는 캐시 소유권에서 나오는 entity 간 import를 이미 허용하고 있다(`entities/node → entities/tree` 예시). 여기서는 방향이 반대일 뿐 이유가 같다 — 목록 캐시의 키 모양을 아는 것은 `entities/workspace`다.
  - 대안은 무효화만 feature로 빼는 것이다. 그러면 "캐시 갱신은 mutation"이라는 컨벤션이 한 mutation 안에서 둘로 갈린다. 예외를 한 곳에 모으는 쪽을 택하고 mutation에 주석으로 남긴다.

### 11. 목 시나리오는 선택 인자로 남긴다

`?mock=small`은 LLM 키 없이 화면을 확인하는 수단이다. msw는 `setupServer`(node)만 있어 브라우저 확인에는 쓸 수 없으므로, 이 파라미터가 유일한 수단이다.

- API 함수가 `mock?: TreeMockScenario` 선택 인자를 받고, 주어졌을 때만 쿼리에 붙인다.
- `TreeMockScenario = "empty" | "small" | "large" | "max"` — 백엔드 허용값과 맞춰 오타를 막는다.
- 프로덕션 호출부(feature)는 넘기지 않는다.
- 지금처럼 `?scenario=small`이 고정으로 박혀 있으면 실제 요청을 보낼 방법이 없다. 선택 인자면 둘 다 된다.

### 12. 생성 중에는 대시보드에 진행 상태를 그린다

LLM 대기가 최대 65초다. 입력 바만 잠그면 그동안 화면이 멈춘 것처럼 보인다.

- 대시보드에 "트리를 만드는 중" 상태를 그리고, 시간이 걸린다는 안내를 함께 둔다.
- 입력 바 잠금은 기존 `isSubmitting`이 이미 한다.

### 13. 메시지 500자 제한을 프론트에 둔다 (조사 중 추가)

`ChatInput`에 `maxLength`가 없어 500자를 넘겨 보낼 수 있고, 백엔드가 `CHAT400-11`로 거절한다.

- 백엔드 계약값이므로 `entities/tree`에 상수로 둔다 (`MAX_FOLDER_NAME_LENGTH`, `MAX_NODE_NAME_LENGTH`와 같은 방식).
- 65초를 기다린 뒤 길이 때문에 실패하는 것은 낭비다. 전송 단계에서 막는다.

### 14. 평문 1MB 검사를 4단계에 함께 넣는다

백엔드는 txt·md만 1MB, 나머지는 10MB인데 프론트는 10MB 하나뿐이다.

- `FILE_KIND_BY_EXTENSION` 옆에 확장자별 상한 맵을 두고 `isAcceptedFileSize`가 확장자를 함께 받는다.
- 1MB 텍스트는 한글 기준 35만 자라 본문 20,000자 상한에 먼저 걸리는 드문 경계지만, 제약값이 백엔드 계약에서 오므로 검증을 계약과 맞춰 둔다.

### 15. 4xx는 서버 문구를 그대로 쓰고 5xx만 프론트 문구로 덮는다

이 도메인의 400은 제약값이 전부 백엔드 계약에서 온다. 확장자 6종, txt·md 1MB, 본문 20,000자, 메시지 500자 — 프론트가 같은 문구를 쓰려면 이 값들을 베껴 와야 하고, 백엔드가 제약을 바꾸면 따라가야 한다. 특히 `CHAT400-6`의 20,000자는 프론트가 파일을 파싱하지 않는 한 알 수 없는 값이다.

- **4xx**: 응답 `message`를 그대로 보여준다.
- **5xx·타임아웃·네트워크 오류**: 프론트 문구로 덮는다. 서버 문구가 사실만 알리고 다시 시도할지를 말해 주지 않는다.
- **컨벤션 예외:** `getAddRootNodeErrorMessage`처럼 코드별 프론트 문구를 두는 기존 방식과 다르다. 이 흐름의 400이 대부분 파일·길이 제약이라 예외로 둔다. 안내 문구를 만드는 함수에 이유를 주석으로 남긴다.
- 서버 문구를 꺼내는 함수는 `shared/api`에 둔다. `getApiErrorCode`와 같은 자리다.

### 16. 목 응답의 `memo` 누락은 그대로 둔다 (조사 중 확인)

`mocks/chat/tree-*.json`의 일부 노드에 `memo` 필드가 없어, `mapNodeDtoToDomain`을 지나면 `memo`가 `undefined`가 된다. `TreeNode.memo`는 `string | null`이라 타입과 런타임 값이 어긋난다.

- 실제 LLM 응답은 `TreeGenResDTO.Node`를 직렬화하므로 `"memo": null`로 내려온다. **목에서만 생기는 차이다.**
- 화면은 `MemoSidePanel`의 `selectedNode?.data.memo ?? null`이 `undefined`도 받아내므로 깨지지 않는다.
- 목 JSON을 고치는 것이 정석이지만 백엔드 레포를 건드려야 한다. 영향이 없으므로 이번 범위에서 다루지 않는다.
- `dto.memo ?? null`로 mapper에서 덮지 않는다. 서버가 준 값을 mapper가 바꾸지 않는다는 규칙(api-type-boundaries "없음의 표현")을 목 하나 때문에 흔들 이유가 없다.

## 단계

### 1단계 — entity: 트리 생성 API와 mutation

- `api/types.ts`
  - `TreeDTO`에 `workspaceId: number` 추가
  - `CreateTreeFromPromptRequest = { message: string; provider: LlmProvider }`
  - `LlmProvider = "OPENAI" | "OLLAMA"` (모델 상수로 `LLM_PROVIDER.OPENAI`)
  - `TreeMockScenario = "empty" | "small" | "large" | "max"` (결정 11)
- `api/treeApi.ts` — `createTree`를 `createTreeFromPrompt`로 고쳐 쓴다 (결정 1)
  - 인자 `{ message, file?, mock? }`, 첨부 유무로 JSON·multipart 분기 (결정 3, 11)
  - `timeout: 90000` (결정 8)
  - 응답을 `{ workspaceId: string; treeId: string; nodes: TreeNode[] }`로 매핑해 돌려준다 (ID는 프론트 타입인 문자열)
- `model/mutations/useCreateTreeFromPromptMutation.ts`
  - `onSuccess`: 트리 노드 캐시 `setQueryData` (결정 5) + 루트 워크스페이스 목록 무효화 (결정 7)
  - entity 간 import 예외를 주석으로 남긴다 (결정 10)
- `index.ts` 공개 API
- 테스트
  - msw `POST */api/tree-request` — JSON 성공, multipart 성공, `CHAT400-3`, `CHAT504-1`
  - API 함수: 첨부 없으면 JSON body, 있으면 `FormData`에 `file`이 실리고 `message`·`provider`가 쿼리로 나가는지
  - mapper: `workspaceId`·`treeId`가 문자열로, `parentId: null`이 루트로 유지되는지
  - mutation: 성공 후 `treeQueryKeys.detail(treeId)`에 노드가 들어가고 루트 목록이 무효화되는지

#### 구현 결과

`vitest` 221개, `tsc`, `eslint` 통과. 계획과 달라진 점은 다음과 같다.

- **`CreatedTree` 도메인 모델과 `mapCreatedTreeDtoToDomain`을 만들었다.** 계획에는 반환 모양만 적었는데, 응답 DTO를 도메인 모델로 바꾸는 일이라 mapper 자리가 맞다. `model/types.ts`에 타입을, `lib/mappers.ts`에 mapper를 두었다.
- **`MAX_PROMPT_MESSAGE_LENGTH`(500)를 1단계에서 미리 넣었다.** 3단계 항목이지만 백엔드 계약값이라 `LLM_PROVIDER`와 같은 자리에 함께 두는 편이 낫다. 화면에서 쓰는 것은 3단계에서 한다.
- **`formData.append`에 파일 이름을 명시했다.** 생략하면 조각의 filename이 `blob`으로 실려, 확장자로 파서를 고르는 백엔드가 `CHAT400-4`로 거절한다.
- **파일 이름은 테스트로 확인할 수 없다.** jsdom에서는 `FormData`가 `Request`를 통과하는 순간 filename이 `blob`이 된다(jsdom의 `File`을 undici가 일반 `Blob`으로 취급). axios와 무관한 환경 한계라 테스트는 파일 조각의 존재만 확인하고, 실제 이름은 4단계 브라우저 확인으로 넘긴다.

### 2단계 — feature: 생성 handler hook

- `features/prompt/create-workspace-from-prompt/model/useCreateWorkspaceFromPrompt.ts`
  - `PromptDraft`를 받아 mutation을 부르고, 성공하면 `routes.workspace(workspaceId)`로 이동
  - 실패하면 안내 문구를 띄우고 이동하지 않는다 (결정 15 — 4xx는 서버 문구, 5xx는 프론트 문구)
  - 반환: `createWorkspaceFromPrompt`, `isCreating`
- `shared/api`에 4xx 응답 `message`를 꺼내는 함수 (결정 15)
- `index.ts` 공개 API
- 테스트: 성공 시 이동 경로, 실패 시 이동하지 않음, 요청 중 재호출 차단, 4xx·5xx 문구가 갈리는지

### 3단계 — 화면: 대시보드 연결과 생성 중 표시

- `useComposePrompt`: `onSubmit`이 `Promise`를 반환할 수 있게 넓히고, 성공했을 때만 입력을 비운다 (결정 9)
- 메시지 500자 제한 (결정 13) — `entities/tree` 상수, 전송 단계에서 차단
- 대시보드 `onSubmit`을 feature handler로 교체하고 `isSubmitting`을 잇는다
- 생성 중 상태 표시 (결정 12)
- 테스트: 실패해도 입력이 남는지, 요청 중 전송이 잠기는지, 500자 초과가 막히는지
- **브라우저 확인** — 목 시나리오로 한 번, LLM 키가 있으면 실제 요청으로 한 번

### 4단계 — 첨부 파일 전송

- `AttachmentItem`에 `file: File` 추가, `createAttachmentFromFile`이 원본을 싣는다 (결정 4)
- `PromptDraft`의 첨부에서 `File`을 꺼내 요청에 싣는다
- 확장자별 크기 상한 (결정 14) — txt·md 1MB, 나머지 10MB
- 테스트: 첨부가 있을 때 multipart로 나가는지, 확장자별 상한이 적용되는지, 파일 제약 위반 안내
- **브라우저 확인** — txt·pdf 각각 한 번. **파일 이름이 서버에 그대로 도착하는지 반드시 본다** (1단계 구현 결과 참고: 테스트로는 확인할 수 없다)

## 범위 밖

- 워크스페이스 페이지의 프롬프트로 기존 트리를 수정하는 흐름 (`PromptComposer` 주석이 예고한 두 번째 사용처)
- provider 선택 UI
- 최신 워크스페이스 목록 목업 교체 (#62)
- 생성 진행률·스트리밍 표시
- 생성한 워크스페이스의 폴더 위치 지정 (백엔드가 루트 고정)
