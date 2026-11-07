# 강의 시나리오 계약

외부 모델이 생성하는 `LectureScenario`의 모양과 규칙을 정리한다. 상위 작업은 [#131](https://github.com/Twig-Tree/twig-tree-web/issues/131)이다.

플레이어가 재생하는 [`LectureScript`](./lecture-script-contract.md)와 다른 계약이다. 시나리오는 "무엇을 가르치려는지"만 담고, [컴파일러](./lecture-compiler.md)가 이를 "화면에서 무엇을 몇 ms 동안 할지"를 담은 `LectureScript`로 바꾼다.

```text
외부 모델 → LectureScenario → 컴파일러(레시피 + motion token) → LectureScript → 플레이어
```

스키마 원본은 `src/entities/lecture/model/scenario/schema.ts`다. 타입은 스키마에서 추출하므로 따로 쓰지 않는다.

## 책임 경계

| 정하는 것                                         | 모델 | 서비스                                         |
| ------------------------------------------------- | ---- | ---------------------------------------------- |
| 장면과 비트 나누기, 내레이션 문장                 | O    |                                                |
| 비트에서 일어날 교육적 의도(intent)와 노드의 역할 | O    |                                                |
| 빠르기·세기·분위기 같은 전달 방식(delivery)       | O    |                                                |
| intent를 실제 동작으로 바꾸는 방법(레시피)        |      | O ([recipe](./lecture-recipes.md))             |
| 시간, easing, 색 같은 구체 값(motion token)       |      | O ([motion token](./lecture-motion-tokens.md)) |
| 내레이션 재생 시간                                |      | O (글자 수로 계산)                             |
| 노드가 실제 트리에 있는지, 경로가 이어지는지      |      | O ([컴파일러](./lecture-compiler.md))          |
| 접근성 대체(reduced-motion)                       |      | O                                              |

그래서 시나리오에는 atomic 동작(`highlight`, `focus` 등)과 `durationMs`, `fallbackDurationMs`가 없다. 모든 객체가 정의하지 않은 필드를 거부하므로, 모델이 이런 값을 넣으면 시나리오 전체가 거부된다.

## 구조

```text
LectureScenario
├─ scenarioSchemaVersion, recipeRegistryVersion, title
└─ Scene (id, nodeId)
   └─ Beat (id)
      ├─ Narration (text)
      └─ Cue[] (intent, roles, delivery?)
```

- `scene.nodeId`는 장면이 설명하는 중심 노드다.
- 비트의 cue는 순서대로 실행한다. cue가 없으면 내레이션만 나오는 비트다.
- scene ID와 beat ID는 시나리오 전체에서 고유해야 한다. beat ID는 장면이 달라도 겹칠 수 없다. 컴파일한 동작을 원본 비트로 거슬러 찾기 위해서다(#133).
- 노드는 서버 노드 ID 문자열로 가리킨다. 0으로 시작하지 않는 10진수만 받는다. 스키마는 형식만 보고, 노드가 실제로 있는지는 컴파일러가 확인한다.

## Intent와 role

intent는 소문자 동사 하나로 짓는다. 연출 방법이 아니라 가르치는 의도를 나타낸다(`shake`가 아니라 `warn`).

role의 노드 개수는 값의 모양으로 정한다.

- 하나: 노드 ID 문자열
- 하나 이상: 비어 있지 않은 배열
- 선택: 생략할 수 있다. 생략이 0개를 뜻하므로 빈 배열은 받지 않는다.

| intent       | 뜻                         | 필수                              | 선택                                   |
| ------------ | -------------------------- | --------------------------------- | -------------------------------------- |
| `introduce`  | 처음 소개한다              | `subject` 하나                    | `context` 하나 이상                    |
| `emphasize`  | 강조한다                   | `subject` 하나 이상               |                                        |
| `compare`    | 두 쪽을 비교한다           | `left`, `right` 각각 하나 이상    |                                        |
| `decompose`  | 하위 요소로 나눠 보여 준다 | `parent` 하나                     | `children` 하나 이상. 없으면 모든 자식 |
| `trace`      | 경로를 따라간다            | `source`, `destination` 각각 하나 |                                        |
| `reveal`     | 숨어 있던 것을 드러낸다    | `subject` 하나 이상               |                                        |
| `warn`       | 주의를 준다                | `subject` 하나 이상               |                                        |
| `correct`    | 정답을 확인한다            | `correctAnswer` 하나 이상         | `incorrectAnswer` 하나 이상            |
| `incorrect`  | 오답을 짚는다              | `incorrectAnswer` 하나 이상       | `correctAnswer` 하나 이상              |
| `transition` | 다른 곳으로 넘어간다       | `destination` 하나                | `source` 하나                          |
| `recap`      | 앞 내용을 다시 짚는다      | `subject` 하나 이상               |                                        |
| `summarize`  | 하나로 정리한다            | `subject` 하나                    | `context` 하나 이상                    |

표에 없는 role은 거부한다. 예를 들어 `warn`에 `correctAnswer`를 쓸 수 없다.

한 cue 안에서 노드 하나는 한 번만 쓴다. 모든 role이 서로 다른 역할이라, 같은 노드가 두 role에 있으면 컴파일러가 연출을 정할 수 없다. `compare`의 양쪽 겹침, `trace`의 출발과 도착이 같은 경우, 한 role 안의 중복이 모두 여기에 걸린다.

`trace`는 출발과 도착만 받는다. 그 사이 경로는 서비스가 트리에서 찾는다.

## Delivery

모두 선택값이다. 빠진 값은 컴파일러가 채운다. `tone`처럼 intent마다 기본값이 다를 수 있어(`warn`이면 `warning`) 스키마에 기본값을 두지 않는다. intent별 기본값과 각 값이 바뀌는 구체 값은 [강의 motion token](./lecture-motion-tokens.md)에 있다.

| 항목         | 값                                                   | 뜻                                                  |
| ------------ | ---------------------------------------------------- | --------------------------------------------------- |
| `pace`       | `slow`, `normal`, `quick`                            | 빠르기                                              |
| `intensity`  | `subtle`, `medium`, `strong`                         | 세기                                                |
| `tone`       | `neutral`, `accent`, `positive`, `warning`, `danger` | 분위기                                              |
| `continuity` | `transient`, `persist`                               | `persist`면 같은 장면의 다음 비트까지 효과를 남긴다 |

## 버전

**`scenarioSchemaVersion`**은 시나리오 모양의 버전이다. 정수 하나이고, 지금 버전과 다르면 거부한다.

- 올린다: 기존 시나리오가 거부되는 변경. 필드 삭제, 이름 변경, 규칙 강화.
- 올리지 않는다: 기존 시나리오가 그대로 통과하는 변경. intent, role, delivery 값 추가.

**`recipeRegistryVersion`**은 컴파일러가 쓸 레시피 모음의 버전이다. 같은 시나리오와 같은 레시피 버전은 항상 같은 연출로 컴파일된다.

- `SUPPORTED_RECIPE_REGISTRY_VERSIONS`에 있는 값만 받는다. 지금은 `1`이며, [recipe registry](./lecture-recipes.md#registry)의 첫 모음을 가리킨다.
- 연출 결과가 달라지는 레시피 변경마다 버전을 더한다.
- 기존 버전은 그 버전으로 만든 시나리오를 재현할 수 있는 동안 목록에 남긴다.

## JSON Schema

백엔드와 외부 모델에 넘기는 JSON Schema(draft 2020-12)는 [lecture-scenario.schema.json](./lecture-scenario.schema.json)이다. zod 스키마에서 생성한 파일이므로 직접 고치지 않는다.

스키마를 바꾼 뒤 다음 명령으로 파일을 갱신한다. 갱신하지 않으면 CI가 실패한다.

```bash
pnpm exec vitest run src/entities/lecture/model/scenario/jsonSchema.test.ts -u
```

JSON Schema로 표현할 수 없는 규칙은 파일에 빠져 있다.

- 한 cue 안의 노드 중복
- scene ID와 beat ID 중복
- 노드 ID의 안전 정수 범위

따라서 모델 출력이 JSON Schema를 통과해도, 프론트는 `lectureScenarioSchema`로 다시 검사한다.

백엔드에 파일을 전달하는 방식은 아직 정하지 않았다. OpenAI strict 모드가 이 스키마의 선택 필드와 `oneOf`를 받는지도 확인하지 않았다. #137 전에 확인한다.

## Fixture

`src/entities/lecture/model/scenario/fixtures/`에 JSON 파일로 둔다. 백엔드도 같은 파일로 자기 검증을 확인할 수 있다.

- `valid/`: 대표 강의 시나리오. 합쳐서 모든 intent를 한 번 이상 쓴다.
- `invalid/`: `description`, 거부될 위치 `expectedIssuePaths`, `scenario`를 담는다. 위치까지 맞아야 통과하므로 다른 이유로 거부되어 우연히 통과하지 않는다.

intent를 추가하면 유효 fixture 중 하나에 그 intent를 쓰는 cue를 넣는다. 넣지 않으면 fixture 테스트가 실패한다.

`trees/`에는 유효 fixture마다 같은 이름으로 그 시나리오가 전제하는 트리를 둔다. 컴파일러 테스트가 이 트리로 fixture를 실제로 컴파일한다([컴파일러 fixture](./lecture-compiler.md#fixture)). 유효 fixture를 추가하면 트리도 함께 추가한다.

`fixtures/index.ts`는 fixture와 트리를 `LECTURE_SCENARIO_FIXTURES`로 묶어 애니메이션 랩에 공개한다. fixture를 추가하면 이 목록에도 넣는다. 디렉터리와 목록이 다르면 `fixtures/index.test.ts`가 실패한다.
