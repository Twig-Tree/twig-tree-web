# AI 활용 기록

이 문서는 개발 과정에서 AI가 제안한 코드를 그대로 받아들이지 않고, 근거를 묻고 검증한 뒤 결정한 사례를 기록한다.

AI가 무엇을 만들어 주었는지가 아니라, **어떤 의문을 제기했고 그 결과 무엇이 달라졌는지**를 남기는 것이 목적이다.

각 사례는 다음 형식으로 작성한다.

- 상황 — 어떤 코드가 나왔는지
- 제기한 의문 — 무엇을 묻고 따졌는지
- 확인한 내용 — 질문을 통해 파악한 사실
- 결정과 근거 — 이 프로젝트에서 어떤 선택을 했고 왜 그렇게 정했는지
- 반영 결과 — 코드에 어떻게 남았는지

---

## 사례 1. ChatInput의 상태 관리 방식 — controlled 채택

**대상 파일**: `src/shared/ui/chat-input/ChatInput.tsx`

### 상황

대시보드 채팅 입력 바를 만들면서 AI가 `ChatInput`을 controlled 컴포넌트로 작성했다.
입력값을 컴포넌트 내부에 두지 않고 `value`와 `onChange`를 prop으로 받는 구조였다.

설명에는 "controlled 컴포넌트"라는 용어만 있었고, 왜 그 방식이어야 하는지에 대한 근거는 없었다.

### 제기한 의문

- controlled 컴포넌트가 정확히 무엇인가?
- 반대 개념(uncontrolled)은 무엇이고 둘의 차이는 무엇인가?
- 이 입력창에는 어느 쪽이 맞는가?

용어를 아는 채로 넘어가면 나중에 입력값 관련 요구사항이 생겼을 때 구조를 다시 뒤집어야 한다고 판단해, 코드를 받기 전에 개념부터 확인했다.

### 확인한 내용

두 방식은 **입력값의 소유자가 누구인가**로 갈린다.

| 구분         | controlled                             | uncontrolled                         |
| ------------ | -------------------------------------- | ------------------------------------ |
| 값의 소유자  | React 상태                             | DOM 요소                             |
| 사용하는 속성 | `value` + `onChange`                   | `defaultValue` + `ref`               |
| 값을 읽는 시점 | 매 입력마다                            | 필요할 때(주로 제출 시점)            |
| 리렌더        | 입력마다 발생                          | 입력 중에는 발생하지 않음            |

즉 uncontrolled는 타이핑 중 React가 값을 알지 못한다. 값이 DOM에만 있으므로, 입력 도중의 값에 반응하는 UI를 만들 수 없다.

### 결정과 근거

`ChatInput`은 **controlled로 간다.**

이 입력창은 타이핑하는 도중에 값에 반응해야 하는 UI를 여럿 가지고 있기 때문이다.

1. **입력창 높이** — 줄 수가 늘고 줄 때마다 textarea 높이를 다시 계산한다.
2. **전송 버튼 활성화 상태** — 입력이 공백뿐이면 전송 버튼을 비활성화한다.
3. **글자 수 표시** — 현재는 넣지 않았지만, 입력 길이를 화면에 보여주려면 같은 조건이 필요하다.
4. **전송 후 입력창 비우기** — 상위에서 상태를 비우는 것만으로 처리된다.
5. **첨부 파일과 함께 다루기** — 프롬프트 텍스트와 첨부 목록을 `useComposePrompt` 한 곳에서 묶는다.

세 개 이상의 UI가 "지금 입력된 값"에 의존하므로, 값을 DOM에 두는 uncontrolled 방식은 애초에 선택지가 되지 못했다.

반대로 매 입력마다 리렌더가 발생하는 비용은 감수하기로 했다. 입력창 하나 크기의 컴포넌트라 실제 성능 문제로 이어지지 않는다.

### 반영 결과

```tsx
// 값의 소유자는 상위 feature hook이다
<ChatInput value={prompt} onChange={setPrompt} onSubmit={submitPrompt} />
```

컴포넌트가 값을 소유하지 않는다는 점을 주석에도 명시해, 나중에 내부 `useState`를 추가하는 방향으로 되돌아가지 않도록 했다.

부수적으로, controlled 방식이라 Enter 키를 직접 가로채게 되면서 한글 입력 문제가 드러났다.
조합 중인 글자를 확정하는 Enter까지 전송으로 처리되기 때문에, `event.nativeEvent.isComposing`으로 조합 중 여부를 확인하는 처리를 함께 넣었다.

---

## 사례 2. 확장자 검사 로직 이중화 — 단일 출처로 통합

**대상 파일**: `src/entities/attachment/model/constants.ts`, `src/entities/attachment/lib/getFileKind.ts`, `src/features/prompt/compose-prompt/lib/splitAcceptedFiles.ts`

### 상황

첨부 파일 기능에 확장자를 다루는 함수가 두 개 만들어졌다.

- `getFileKind(mimeType, fileName)` — 파일 종류를 판단해 아이콘과 라벨을 결정한다.
- `splitAcceptedFiles(files)` — 첨부 가능한 파일과 아닌 파일을 나눈다.

AI는 두 함수가 "표시"와 "검증"이라는 서로 다른 책임을 가지므로 분리하는 것이 맞다고 설명했다.
`splitAcceptedFiles`에는 "`getFileKind`는 mimeType으로 넘어가므로 검증에 사용하면 안 된다"는 경고 주석까지 달려 있었다.

### 제기한 의문

- `splitAcceptedFiles`가 있는데 `getFileKind`가 왜 따로 필요한가?
- 두 함수가 모두 파일 이름에서 확장자를 잘라 비교하고 있는데, 이것을 중복이 아니라고 볼 수 있는가?

책임이 다르다는 설명은 그럴듯했지만, 실제 코드에서는 같은 일(확장자 파싱과 목록 비교)을 두 번 하고 있었다.

### 확인한 내용

질문을 통해 다음 사실이 드러났다.

1. 첨부 목록에는 검증을 통과한 파일만 들어간다. 즉 `getFileKind`가 보는 파일은 항상 허용 확장자 6종 중 하나다.
2. 따라서 `getFileKind`의 mimeType 폴백 경로와 `unknown` 분기는 실행될 일이 없었다.
3. 그 폴백은 잘못된 답을 낼 수 있는 함수였다. `fake.png`처럼 허용하지 않는 확장자라도 mimeType이 `text/plain`이면 `text`로 분류된다.

다만 이것이 당시 동작하던 버그는 아니었다. 검증은 `splitAcceptedFiles`가 확장자만 보고 먼저 수행했으므로, 그런 파일은 `getFileKind`에 도달하기 전에 걸러졌다.
문제는 **앞으로 뚫릴 수 있는 함정**이었다는 점이다. 나중에 누군가 검증을 `getFileKind`로 바꾸면 그 순간 통과하게 된다.

경고 주석이 붙어 있었다는 사실 자체가 신호였다. 주석으로 "이 함수를 검증에 쓰지 마라"라고 막아야 하는 상황이라면, 애초에 잘못된 답을 낼 수 없게 만드는 편이 낫다.

### 결정과 근거

확장자 목록과 표시 분류를 **하나의 맵으로 합치고, 나머지를 모두 파생**시키기로 했다.

```ts
const FILE_KIND_BY_EXTENSION = {
  txt: "text", md: "text", pdf: "pdf",
  docx: "word", hwp: "hwp", hwpx: "hwp",
};

ACCEPTED_FILE_EXTENSIONS = Object.keys(FILE_KIND_BY_EXTENSION);
FILE_INPUT_ACCEPT        = ".txt,.md,.pdf,.docx,.hwp,.hwpx";
getFileKind(fileName);        // 확장자만 본다
isAcceptedFileName(fileName); // getFileKind가 unknown이 아닌지 확인한다
```

`getFileKind`에서 mimeType 인자를 제거했다. 허용 형식이 문서 6종으로 한정되어 있어 확장자가 mimeType보다 신뢰할 수 있고, hwp와 hwpx는 브라우저가 mimeType을 비우거나 `application/octet-stream`으로 넘기는 경우가 많기 때문이다.

`splitAcceptedFiles`는 없애지 않았다. 여러 파일을 통과와 거부로 나누고 거부된 이름을 모아 안내하는 것은 화면의 유스케이스에 속하므로 feature 계층에 남겨두는 것이 맞다고 판단했다. 다만 확장자 판단은 하지 않고 `isAcceptedFileName`을 호출하기만 한다.

한편 이 통합은 "첨부 허용 확장자"와 "표시할 수 있는 확장자"를 같은 것으로 묶는다. 두 개념이 갈라지는 요구사항(예: 첨부는 막지만 기존 파일은 표시)이 생기면 다시 분리해야 한다는 점을 확인하고, 현재 계획에 없으므로 통합하기로 결정했다.

### 반영 결과

확장자 목록이 코드에 한 번만 등장하게 되었고, 확장자를 파싱하는 코드도 한 곳으로 줄었다. 검증에 쓰지 말라는 경고 주석도 필요 없어졌다.

브라우저에서 9개 파일을 한 번에 첨부해 확인한 결과, mimeType을 `text/plain`으로 위장한 `fake.png`가 거부되었다.
이는 통합으로 새로 고쳐진 동작이 아니라 이전과 동일한 결과다. 통합이 바꾼 것은 **잘못 쓸 수 있는 여지를 없앤 것**이다.

이 사례에서 얻은 것은 두 가지다.

- AI의 "책임이 다르니 분리한다"는 설명은 개념적으로 옳았지만, 실제 데이터 흐름에서 한쪽 경로가 도달 불가능하다는 점은 확인되지 않은 상태였다. 설명의 타당성과 코드의 실제 동작은 따로 확인해야 한다.
- 개선 효과를 설명할 때도 검증이 필요했다. AI는 처음에 이 변경을 "구멍을 막았다"고 설명했지만, 검증 순서를 되짚어 보면 그 경로는 이미 막혀 있었다. 실제로 얻은 것은 버그 수정이 아니라 향후 실수 방지였다.

---

## 사례 3. "mapper 불필요" 결론 — 기존 구조의 규약 위반이 드러남

**대상 파일**: `docs/plans/41-node-name-edit.md`, `src/entities/tree/api/treeApi.ts`, `src/entities/tree/model/queries.ts`

### 상황

노드 제목 편집 API 연동(#41) 작업 계획서를 AI가 작성했다.

이슈의 TODO에는 "요청/응답 DTO와 mapper 작성"이 있었지만, 계획서는 mapper를 만들지 않겠다고 적었다. 근거는 다음과 같았다.

> 트리 조회 query cache는 `NodeDTO[]`를 그대로 저장한다. 제목 수정 응답도 `NodeDTO`이므로 캐시에 그대로 반영할 수 있어 단일 노드용 mapper는 필요하지 않다.

현재 코드만 놓고 보면 맞는 말이었다.

### 제기한 의문

- mapper는 DTO를 도메인 모델로 바꾸는 과정인데, 그 과정 자체가 필요 없다는 게 말이 되는가?

"지금 코드에서 필요 없다"와 "원래 필요 없다"는 다른 이야기다. 후자라면 규약이 잘못된 것이고, 전자라면 코드가 잘못된 것이다.

### 확인한 내용

질문을 통해 드러난 사실은 다음과 같다.

1. **변환이 없는 게 아니라 시점이 늦다.** `mapNodesDtoToDomain`은 존재하고 실제로 호출되지만, 호출 위치가 `useInitializeTree` — 즉 entity가 아니라 feature 계층이다.

2. **query cache에 백엔드 DTO가 그대로 들어 있다.** `treeApi.getTree`가 `NodeDTO[]`를 반환하고 `useGetTreeQuery`가 그걸 그대로 캐싱한다.

3. **폴더는 규약대로 되어 있다.** `folderApi`는 모든 조회 함수가 mapper를 거쳐 `FolderItem`을 반환한다. 즉 같은 프로젝트 안에서 두 entity가 서로 다른 방식으로 구현되어 있었다.

4. **TanStack Query는 `queryFn`이 반환한 값을 그대로 캐싱한다.** 따라서 매핑을 어디서 하느냐가 곧 캐시 타입을 결정한다. 폴더 캐시는 도메인 모델, 트리 캐시는 DTO인 이유가 여기에 있었다.

5. 캐시가 DTO라서 노드 추가·삭제·메모 mutation의 낙관적 업데이트가 전부 `NodeDTO` 형태로 캐시를 직접 조작하고 있었다. 백엔드 필드명이 바뀌면 mutation 코드까지 따라 바뀌는 구조다.

한편 이 과정에서 AI가 규약 문서를 잘못 읽어 "폴더가 규약 위반"이라고 판단한 적이 있었다. 문서의 `## API 함수` 예시가 API 함수 안에서 mapper를 호출하는 코드였는데, AI는 이를 근거로 매핑 위치를 반대로 정리했다. 규약 원문을 다시 확인해 폴더가 맞고 트리가 틀렸다는 것으로 바로잡았다.

### 결정과 근거

**캐시는 도메인 모델을 담는다.** 판별 기준은 "서버가 그 값을 아는가"로 정했다.

```text
서버         NodeDTO[]              백엔드 계약
               ↓ mapper (treeApi 안에서)
query cache  TreeNode[]             서버가 아는 사실만
               ↓ transformToFlowElements
editor store CustomEditorNode[]     position·selected·isDirty
```

React Flow 형태(`CustomEditorNode`)를 캐시에 넣지 않기로 한 이유가 결정적이었다. `position`은 서버가 아니라 `useEditorLayout`이 계산하는 값이라, 캐시에 넣으면 refetch 한 번에 사용자가 옮겨놓은 레이아웃이 덮인다. 반대로 DTO를 그대로 두면 백엔드 계약 변경이 mutation까지 번진다. 도메인 모델이 그 사이의 안정된 지점이다.

되돌리기 기능과는 충돌하지 않는다는 점도 확인했다. zundo는 editor store의 `nodes`/`edges`/`isDirty`만 partialize하므로 query cache는 히스토리에 포함되지 않는다. 캐시 형태를 도메인 모델로 정해도 undo/redo 요구사항이 제약하는 것은 없다.

다만 이 전환은 #41의 범위를 넘어선다. 조회 query와 기존 mutation 세 개를 함께 바꿔야 하기 때문이다. **#41은 현행 구조(DTO 캐시)에 맞춰 진행하고, 전환은 별도 이슈로 분리**하기로 했다.

### 반영 결과

- #41 계획서의 "mapper 불필요" 항목은 결론은 유지하되 근거를 바꿨다. "필요 없다"가 아니라 "현재 캐시가 DTO라서 지금 넣으면 slice 내부 일관성이 깨진다"로 정리했다.
- tree slice 전환을 [#46](https://github.com/Twig-Tree/twig-tree-web/issues/46)으로 분리했다. 조사 과정에서 함께 발견한 두 가지도 TODO에 넣었다.
  - query cache를 화면 렌더링 경로에서 읽는 곳이 `useInitializeTree` 하나뿐이라, 캐시의 정교한 낙관적 업데이트가 사용자 경험에 기여하지 않는다.
  - 임시 노드 ID가 캐시는 `Date.now()`, editor store는 `temp_${crypto.randomUUID()}`로 서로 대응되지 않는다.

이 사례에서 얻은 것은 두 가지다.

- AI의 결론이 맞더라도 근거는 따로 확인해야 한다. "mapper가 필요 없다"는 결론 자체는 이번 작업 범위에서 타당했지만, 그 근거였던 "캐시가 DTO다"는 사실 규약 위반을 서술한 것이었다. 결론만 받았다면 위반이 그대로 굳어졌을 것이다.
- AI가 규약 문서를 근거로 들 때도 원문 확인이 필요했다. 문서 안에서 서술과 예시 코드가 어긋나 있었고, AI는 예시 쪽을 근거로 삼아 판정을 반대로 내렸다.
