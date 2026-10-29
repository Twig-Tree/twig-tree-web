# AI 강의 웹 플레이어 데모 계획

요구사항: `.claude/plans/web-player.md`

## 1. 분석 결과 요약

| 항목            | 현재 상태                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------- |
| 프레임워크      | Next 16.2.2, React 19.2.4, TypeScript, pnpm                                                         |
| 캔버스          | `@xyflow/react` 12.10, 레이아웃은 elkjs                                                             |
| 상태            | 서버 상태는 TanStack Query, 화면 상태는 zustand. 편집 store(`treeStore`)는 zundo history를 가짐     |
| 스타일          | Tailwind 4 + `app/xy-theme.css`(React Flow 노드 테두리·강조 변수), 아이콘은 `lucide-react`          |
| 공통 UI         | `shared/ui`의 `Button`, `IconButton`, `Modal` 등                                                    |
| 트리 화면       | `app/(main)/workspace/[workspaceId]/page.tsx`의 `LayoutFlow` + `widgets/workspace`의 `WorkspacePanel` |
| 노드 신원       | 편집기 노드 `id`는 세션마다 새로 만드는 `clientId`, 서버 ID는 `data.serverId`                        |
| 강조            | `highlight/highlightStore` 집합 하나를 검색·태그가 번갈아 씀. `CustomNode`가 boolean 구독           |
| 화면 이동       | `focus/useFocusNode`의 `focusNode`(조상 펼치기+선택+`setCenter`)·`fitNodes`(`fitView`), 레이아웃 대기는 `runAfterNextLayout` |
| 음성 에셋       | 없음(`public/` 디렉터리 자체가 없음)                                                                |
| 테스트          | vitest + Testing Library + msw                                                                      |

## 2. 핵심 설계 결정

### 2.1. 목데이터를 실제 노드에 연결하는 방법

노드 ID는 DB가 매번 새로 부여하고, 편집기 `clientId`는 세션마다 새로 만들어진다. 따라서 목데이터에 ID를 박아 둘 수 없다.

**선택: 목데이터는 루트부터의 노드 이름 경로로 노드를 가리키고, 강의를 시작할 때 editor store의 노드로 해석한다.**

- 기준 트리는 백엔드 개발용 시나리오 `mock=small`과 같은 구조(컴퓨터 사이언스 › 자료구조 › 배열·스택, 알고리즘 › 정렬)다. 단, `mock` 응답은 고정 JSON이라 DB에 저장되지 않으므로 데모 트리는 편집기에서 직접 만든다(사용자 결정).
- 경로가 하나라도 해석되지 않으면 강의 시작 버튼을 잠그고, 이 트리에는 데모 강의가 없다는 이유를 알린다.
- 서버 연동 시에는 경로 대신 `nodeId`(serverId)를 받게 되고, 해석 함수 하나만 바뀐다.

대안으로 트리 구조(DFS 순서)에서 대본을 템플릿으로 생성해 어느 트리에서나 재생하는 방식이 있다. 다만 대본이 "목데이터"가 아니라 합성 문장이 된다.

### 2.2. 레이어 위치

- `entities/lecture`: 강의 도메인 타입과 목데이터. 나중에 API·mapper·query가 들어올 자리다.
- 재생 로직과 플레이어 UI: `features/tree-editor/model/lecture`, `features/tree-editor/ui`. 강조·카메라가 tree-editor의 store와 `useFocusNode`·`runAfterNextLayout`에 묶여 있다. 별도 feature로 나누면 같은 계층 간 의존이 생긴다(fsd-layers.md "Feature를 나눌 때는 어느 store와 화면 흐름에 묶여 있는가").

### 2.3. 음성: `SpeechSynthesis`를 문장 단위로 재생

- 문장마다 utterance 하나를 만든다. 자막은 `onend`로 다음 문장으로 넘어가므로 음성과 정확히 맞는다. 단, 단어 단위 타임스탬프는 없다.
- 일시정지는 `cancel()`이고, 재개는 현재 문장을 처음부터 다시 읽는다. Chrome의 `pause()/resume()`은 불안정하고, 긴 발화는 15초 무렵 끊기기 때문이다.
- 한국어 음성이 없거나 API가 없으면 자막의 `start/end`로 시간을 흘리는 무음 재생으로 대체한다. 플레이어에 "음성 없음 · 자막만 재생"을 표시해 음성이 나오는 것처럼 보이지 않게 한다.
- 재생 요청마다 세대 번호를 올리고, 오래된 utterance나 타이머의 콜백은 무시한다. 연타, 구간 이동, 언마운트가 겹쳐도 이전 음성이 상태를 바꾸지 못한다.

### 2.4. 상태

zustand `lectureStore` 하나에 둔다: `status`(`idle | playing | paused | ended`), `segmentIndex`, `subtitleIndex`, 해석된 `segments`.

현재 자막, 현재 노드, 진행률은 이 값에서 파생한다. treeStore에 넣지 않아 undo history에 들어가지 않는다.

### 2.5. 강조

검색·태그 강조와 집합을 공유하지 않는다. 공유하면 강의 중 검색이 강의 강조를 지운다. `CustomNode`에 `data-lecture-current`를 하나 더 두고, `xy-theme.css`에 별도 색(테두리+은은한 그림자)을 준다.

### 2.6. 카메라

`useFocusNode`의 `fitNodes`가 이미 레이아웃 대기와 `fitView` 애니메이션을 처리한다. 구간별 `maxZoom`·`durationMs`를 받도록 옵션만 연다.

대상이 접혀 숨겨져 있으면 `focusNode`처럼 조상을 펼친 뒤 레이아웃 뒤에 이동한다. 선택은 바꾸지 않는다. 사용자의 드래그·편집은 막지 않는다. 대상 노드가 강의 중 삭제되면 그 구간의 카메라·강조만 건너뛴다.

## 3. 변경 대상 파일

신규

- `src/entities/lecture/model/types.ts`: `Lecture`, `LectureSegment`, `LectureSubtitle`, `LectureCamera`
- `src/entities/lecture/model/mockLecture.ts`: 3~4구간 목 강의
- `src/entities/lecture/index.ts`
- `src/features/tree-editor/lib/lecture/resolveLectureSegments.ts` (+ test): 이름 경로 → clientId
- `src/features/tree-editor/model/lecture/lectureStore.ts` (+ test)
- `src/features/tree-editor/model/lecture/speechPlayer.ts`: SpeechSynthesis/무음 타이머 어댑터
- `src/features/tree-editor/model/lecture/useLecturePlayback.ts` (+ test): 재생 엔진, 카메라 연결
- `src/features/tree-editor/ui/LecturePlayer.tsx` (+ test): 하단 플레이어 바(재생/일시정지, 다음 구간, 처음부터, 자막, 진행 표시)

수정

- `src/features/tree-editor/ui/CustomNode.tsx`: 강의 현재 노드 boolean 구독 1줄 + 속성 1개
- `app/xy-theme.css`: 강의 강조 스타일
- `src/features/tree-editor/model/focus/useFocusNode.ts`: `fitNodes` 옵션(배율·시간), 숨겨진 대상 펼치기
- `src/features/tree-editor/model/initialization/useInitializeTree.ts`: 언마운트 때 강의 store 초기화
- `src/features/tree-editor/index.ts`, `README.md`(강의 절 추가)
- `app/(main)/workspace/[workspaceId]/page.tsx`: 캔버스 하단에 `LecturePlayer` 배치

## 4. 단계 (단계마다 확인 → 커밋)

1. **목데이터·타입·노드 해석**: `entities/lecture`와 `resolveLectureSegments` + 테스트
2. **강의 store와 재생 엔진**: 상태 전이, 음성/무음 어댑터, 세대 번호로 경쟁 상태 방지 + 테스트
3. **강조와 카메라 연결**: `CustomNode`·`xy-theme.css`·`useFocusNode` 옵션, 언마운트 정리
4. **플레이어 UI와 페이지 연결**: `LecturePlayer`, 페이지 배치, 시작 불가 사유 안내
5. **검사와 문서**: `tsc --noEmit`, `pnpm lint`, `pnpm test`, README 강의 절, 실행 방법 정리

## 5. 확인 방법

1. 새 워크스페이스에서 편집기로 데모 트리(6개 노드)를 직접 만든다.
2. `/workspace/{id}`에 들어가 강의 시작을 누른다.
3. 재생, 일시정지, 재개, 다음 구간, 종료, 처음부터를 확인한다.
4. 음성 대체 동작은 한국어 음성이 없는 브라우저에서 확인한다.
