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
| `highlight` | 대상 노드를 고정 또는 펄스 형태로 강조한다    | `targetNodeIds` |
| `dim`       | 예외 노드 이외를 흐리게 한다                  | `exceptNodeIds` |
| `trace`     | 나열한 노드 사이의 연결선을 순서대로 강조한다 | `nodeIds`       |
| `reset`     | 시각 레이어, 카메라 또는 둘 다 초기화한다     | 없음            |
| `group`     | 자식 동작을 순차 또는 병렬로 조합한다         | 없음            |

`group.mode`가 `sequence`이면 앞 동작이 끝난 뒤 다음 동작을 시작한다.
`parallel`이면 모든 자식 동작을 함께 시작하고 모두 끝날 때 완료된다.

## persist 생명주기

`highlight`와 `dim`은 `persist: true`일 때 지정한 `durationMs`를 기다리지 않고 다음 동작으로 진행하면서
시각 레이어를 유지한다.

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

## 런타임 검증 후속 작업

TypeScript 타입은 네트워크에서 받은 JSON을 검증하지 않는다. 강의 API를 연결할 때는 런타임 스키마 검증을
반드시 추가한다. 구현 라이브러리는 API 작업 시 결정하되 다음 조건을 검증해야 한다.

- 허용된 animation type과 group mode만 사용한다.
- `scene.id`와 `beat.id`가 대본 안에서 중복되지 않는다.
- `nodeId`와 각 노드 ID 배열이 비어 있지 않다.
- `durationMs`와 `fallbackDurationMs`가 유한한 양수이며 제품 상한을 넘지 않는다.
- `maxZoom`이 허용 배율 안에 있다.
- 재귀 group 깊이와 children, scene, beat 개수가 제품 상한을 넘지 않는다.
- `trace.nodeIds`에는 최소 두 노드가 있고 실제 트리에서 인접한 엣지로 연결된다.
- 대본이 참조하는 모든 node ID가 현재 트리에 존재한다.

검증 실패 시 일부 대본을 임의로 고쳐 재생하지 않고 전체 대본을 거부하며, 사용자가 다시 시도할 수 있는 오류를 표시한다.

## 실제 강의 API 후속 작업

API 연결 시 `useDemoLectureScript`를 강의 조회 query로 교체하고 데모 강의와 이름 경로 코드를 삭제한다. `LectureScript` 계약과
`serverId → clientId` 변환, 플레이어 실행기는 그대로 사용한다. 생성 작업 큐, 저장, 사용자별 진도와
재생 이력은 이 프런트 목데이터 단계에 포함하지 않는다.
