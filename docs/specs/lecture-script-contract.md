# 강의 대본 계약

강의 플레이어가 읽는 `LectureScript`의 데이터 모양과 실행 규칙을 정리한다.
현재는 프론트 데모 강의만 이 계약을 사용한다. 강의 생성과 조회 API는 후속 작업이다.

## 구조

```text
LectureScript
└─ Scene
   └─ Beat
      ├─ Narration
      └─ Animation
```

- `scene`은 하나의 중심 노드를 설명하는 연속된 비트다. 플레이어는 재생 중인 장면의 중심 노드를 항상 강조한다.
- `beat`는 내레이션과 애니메이션의 동기화 경계다.
- 내레이션과 애니메이션을 함께 시작하고 둘 다 끝나면 다음 비트로 이동한다.
- 모든 노드 참조는 서버 노드 ID 문자열을 사용한다. React Flow의 clientId는 실행 직전에 프론트가 찾는다.

## 애니메이션 동작

| 동작        | 역할                                          | 노드 필드       |
| ----------- | --------------------------------------------- | --------------- |
| `focus`     | 대상 노드를 펼치고 카메라를 이동한다          | `targetNodeIds` |
| `highlight` | 대상 노드를 `style`과 `tone`으로 강조한다     | `targetNodeIds` |
| `dim`       | 예외 노드 이외를 흐리게 한다                  | `exceptNodeIds` |
| `trace`     | 나열한 노드 사이의 연결선을 순서대로 강조한다 | `nodeIds`       |
| `wait`      | 시각 상태를 바꾸지 않고 시간만 보낸다         | 없음            |
| `collapse`  | 대상 노드의 자식을 접는다                     | `targetNodeIds` |
| `expand`    | 대상 노드의 자식과 접힌 조상을 펼친다         | `targetNodeIds` |
| `reset`     | 시각 레이어, 카메라 또는 둘 다 초기화한다     | 없음            |
| `group`     | 자식 동작을 순차 또는 병렬로 조합한다         | 없음            |

`group.mode`가 `sequence`이면 앞 동작이 끝난 뒤 다음 동작을 시작한다.
`parallel`이면 모든 자식 동작을 함께 시작하고 모두 끝날 때 완료된다.

`collapse`와 `expand`의 움직임은 편집기의 노드 전환이 그려 시간이 정해져 있다(800ms). `durationMs`는 움직임의 속도가 아니라
다음 동작까지 기다리는 시간이다. 접고 펼치면 배치가 달라지므로, 바뀐 트리로 카메라를 옮기려면 `focus`를 같은 병렬 그룹이 아니라 순차 그룹의 다음 동작으로 둔다.
`reset`은 접힘을 되돌리지 않으므로, 강의 중에 되돌리려면 대본에 반대 동작을 둔다. 강의가 끝나면 플레이어가 시작할 때의 접힘 상태로 되돌린다.

`highlight`의 `style`은 `steady`, `pulse`, `pop`, `bounce`, `shake`이고 `tone`은 `accent`(기본), `success`, `warning`, `danger`다.

`trace`의 `mode`가 `progressive`이면 `durationMs`를 연결선 수로 나눠 하나씩 그린다. 기본값 `simultaneous`는 모두 함께 그린다. `direction`이 `reverse`이면 끝에서부터 강조한다.

## persist 생명주기

`highlight`, `dim`, `trace`는 `persist: true`일 때 지정한 `durationMs`를 기다리지 않고 다음 동작으로 진행하면서
시각 레이어를 유지한다. 단, `progressive` trace는 경로를 다 그릴 때까지 기다린 뒤 유지한다.

자동 정리 경계는 다음과 같다.

- 같은 장면의 다음 비트: 유지
- 일시정지: 유지
- 장면 전환 또는 수동 장면 건너뛰기: 제거
- 정상 종료: 제거
- 사용자 종료 또는 처음부터 다시 시작: 제거
- 플레이어 언마운트: 제거
- `reset` 동작: 지정한 scope에 따라 즉시 제거

따라서 대본 작성자가 마지막 비트에 `reset`을 빠뜨려도 플레이어 밖으로 효과가 새지 않는다.

## 현재 데모 강의

노드 ID는 저장할 때마다 새로 부여되므로 데모 대본에 고정하지 않는다. 세계 지리(`src/entities/lecture/model/mockLectureScript.ts`)와 컴퓨터 사이언스(`src/entities/lecture/model/mockComputerScienceLectureScript.ts`) 데모는 노드 이름 경로와 서버 ID를 받아 대본을 만드는 함수를 함께 둔다.

`findDemoLectureScript`가 지금 트리에서 이름 경로로 서버 ID를 찾아 이 계약의 대본을 만든다. 따라서 이름 경로는 데모 경로 안에만 있고, 플레이어와 대본은 서버 ID만 안다. 시작한 뒤의 강의는 그때 연결한 대본으로 진행되므로 강의 중에 이름을 바꿔도 끊기지 않는다.

테스트에서는 `src/tests/mocks/data.ts`의 세계 지리 fixture가 고정 ID를 제공한다.

## Atomic effect registry

위 표의 동작(`group` 제외)은 플레이어가 실행하는 가장 작은 단위인 atomic effect다. 외부 모델에는 노출하지 않는 내부 계약이며, 외부 모델은 [강의 시나리오](./lecture-scenario-contract.md)만 만든다.

동작마다 다른 사실은 `src/entities/lecture/model/atomicEffects.ts`의 `LECTURE_ATOMIC_EFFECTS` 한 곳에 둔다. 대상 노드 필드, 파라미터 검증처럼 여러 곳이 같은 사실을 쓰는 일은 이 값을 읽는다. 실행기와 되감기, 랩의 재생 전 검사는 동작마다 하는 일이 달라 분기를 유지한다.

| 항목              | 뜻                                                                           |
| ----------------- | ---------------------------------------------------------------------------- |
| `schema`          | 파라미터 검증. `scriptSchema.ts`의 동작 스키마                               |
| `target`          | 대상 종류(`family`)와 노드 ID 목록을 담는 필드 이름. 노드가 없으면 `null`    |
| `isPersistable`   | `persist`로 효과를 유지할 수 있는지                                          |
| `durationMeaning` | `effect`(효과가 보이는 시간), `hold`(다음 동작까지 기다리는 시간), `none`    |
| `motion`          | `camera`, `layout`, `decoration`, `none`. 동작 줄이기에서 대체를 정하는 기준 |

`target`과 `isPersistable`은 동작 타입에서 정해지므로 틀리게 적으면 타입 오류가 난다.

### ID 규칙

동작 ID는 대본 JSON의 `type` 값이다. 저장된 대본이 깨지지 않도록 기존 ID는 바꾸지 않는다.

노드가 아닌 대상을 다루는 동작은 `<대상>.<동작>`으로 짓는다(예: `text.typewriter`). 이때 `target.family`에 대상 종류를 더하고, 그 대상을 가리키는 필드 규칙을 정한다. 텍스트 효과는 아직 없다.

### 새 동작 추가

1. `types.ts`에 동작 타입을 추가하고 `scriptSchema.ts`에 스키마를 추가한다. 두 쪽이 다르면 `scriptSchema.test.ts`의 타입 대조가 `tsc`에서 실패한다.
2. `LECTURE_ATOMIC_EFFECTS`에 등록한다. 빠뜨리면 타입 오류가 난다.
3. 편집기 타입(`features/tree-editor/model/types.ts`)에 동작을 추가한다. 노드 필드 이름이 새로 생기면 `getEditorLectureScript.ts`의 `EDITOR_CLIENT_IDS_FIELD`도 채운다.
4. 실행기(`runLectureAnimation`)와 되감기(`getLectureSeekState`)에 분기를 추가한다. 빠뜨리면 타입 오류가 난다.
5. `lectureEffectCoverage.test.ts`의 예시 동작을 채운다. 등록된 모든 동작이 변환·실행·되감기를 지나는지 확인한다.
6. 랩의 `LAB_ACTIONS`에 이름과 기본값을 채운다. 화면이 필요한 효과는 [랩 README](../../src/widgets/animation-lab/README.md)를 따른다.

## 런타임 검증

TypeScript 타입은 네트워크에서 받은 JSON을 검증하지 않는다. 라이브러리는 `zod/mini`로 정했다.

대본의 모양은 `lectureScriptSchema`(`src/entities/lecture/model/scriptSchema.ts`)가 검사한다. 타입의 원본은 `types.ts`이고, 스키마는 따로 작성해 두 쪽이 같은지 양방향 타입 검사로 대조한다. 한쪽 방향 표기(`ZodMiniType<LectureScript>`)는 스키마가 허용값 하나를 빠뜨려도 통과하기 때문이다. 대조는 CI의 `tsc --noEmit`에서 실패한다. `vitest --typecheck`는 이 오류를 잡지 않는다.

지금 스키마가 보는 것은 다음과 같다.

- 허용된 animation type, group mode, 옵션 값만 사용한다.
- `durationMs`와 `fallbackDurationMs`가 유한한 0 이상의 숫자다.
- `maxZoom`이 유한하고 0보다 크다.

강의 API를 연결할 때 다음 조건을 더한다. 랩은 빈 대상 목록을 편집 중인 상태로 다루므로 스키마가 아니라 API 경계에서 검사한다.

- `scene.id`와 `beat.id`가 대본 안에서 중복되지 않는다.
- `nodeId`와 각 노드 ID 배열이 비어 있지 않다.
- 시간, `maxZoom`, 재귀 group 깊이, children·scene·beat 개수가 제품 상한을 넘지 않는다.
- `trace.nodeIds`에는 최소 두 노드가 있고 실제 트리에서 인접한 엣지로 연결된다.
- 대본이 참조하는 모든 node ID가 현재 트리에 존재한다.

검증 실패 시 일부 대본을 임의로 고쳐 재생하지 않고 전체 대본을 거부하며, 사용자가 다시 시도할 수 있는 오류를 표시한다.

## 실제 강의 API 후속 작업

API 연결 시 `useDemoLectureScript`를 강의 조회 query로 교체하고 데모 강의와 이름 경로 코드를 삭제한다. `LectureScript` 계약과
`serverId → clientId` 변환, 플레이어 실행기는 그대로 사용한다. 생성 작업 큐, 저장, 사용자별 진도와
재생 이력은 이 프런트 목데이터 단계에 포함하지 않는다.
