# 강의 시나리오 컴파일러

외부 모델이 만든 [`LectureScenario`](./lecture-scenario-contract.md)를 플레이어가 재생하는 [`LectureScript`](./lecture-script-contract.md)로 바꾼다. 상위 작업은 [#139](https://github.com/Twig-Tree/twig-tree-web/issues/139)다.

```text
unknown 입력
  ↓ 1. 시나리오 스키마 검사                    schema
  ↓ 2. 장면 중심 노드와 cue role 노드가 트리에 있는지   node
  ↓ 3. intent → recipe 선택, role → recipe 입력      recipe
  ↓ 4. delivery를 intent 기본값으로 채워 recipe 실행
  ↓ 5. 비트마다 cue 애니메이션을 순차로 잇고 내레이션 시간 계산
  ↓ 6. 장면 단위 조합 검사                      composition
  ↓ 7. 비트 시간과 카메라 횟수 검사              duration
LectureScript + source map + 경고
```

코드는 `src/entities/lecture/model/compiler`에 있다.

| 파일                           | 내용                                         |
| ------------------------------ | -------------------------------------------- |
| `types.ts`                     | 트리 창구, 문제, source map, 결과 타입       |
| `compileLectureScenario.ts`    | 컴파일 함수                                  |
| `intentRecipes.ts`             | 버전별 intent → recipe 연결표, cue 실행      |
| `narration.ts`                 | 내레이션 재생 시간                           |
| `compileChecks.ts`             | 노드 존재, 장면 조합, 비트 시간·카메라 검사  |
| `createLectureCompilerTree.ts` | `{ id, parentId }` 목록으로 트리 창구 만들기 |

편집기에서는 `features/tree-editor`의 `compileEditorLectureScenario`를 쓴다. store의 노드와 엣지로 트리 창구를 만들어 컴파일하고, 대본의 서버 노드 ID를 편집기 clientId로 옮긴다. 아직 화면에서 부르는 곳은 없고, 랩의 시나리오 모드(#136)에서 연결한다.

## 결정성

같은 시나리오, 같은 트리, 같은 `recipeRegistryVersion`이면 항상 같은 대본을 만든다. 그래서 다음 값은 입력에 넣지 않는다.

- **접힘 상태**: 편집기 트리 창구는 접힘과 관계없이 store의 모든 노드를 넣는다. 사용자가 접어 둔 모양에 따라 연출이 달라지면 같은 강의를 재현할 수 없다.
- **동작 줄이기 설정**: 사용자 설정이라 같은 시나리오에서 두 가지 대본이 필요하다. 컴파일 결과에 [`getReducedMotionAnimation`](./lecture-motion-tokens.md#동작-줄이기)을 부르는 쪽이 적용한다.
- **서버에 저장되지 않은 노드**: 시나리오가 가리킬 서버 ID가 없어 트리 창구에서 뺀다.

## 트리 창구

recipe의 [트리 창구](./lecture-recipes.md#트리-창구)에 노드 존재 확인을 더한 `LectureCompilerTree`를 받는다.

| 함수                                               | 돌려주는 값                               |
| -------------------------------------------------- | ----------------------------------------- |
| `hasNode(nodeId)`                                  | 서버 노드 ID가 지금 트리에 있는지         |
| `getChildIds(nodeId)`                              | 화면 순서의 자식 ID                       |
| `getPathNodeIds(ancestorNodeId, descendantNodeId)` | 부모→자식 순서의 경로. 조상이 아니면 null |

`createLectureCompilerTree`는 형제 순서를 목록 순서로 정한다. 편집기는 노드 목록 순서를 쓴다. 강의의 이름 경로 찾기(`createLectureNodePathResolver`)와 같은 기준이다.

## Intent → recipe

연결표는 `recipeRegistryVersion`마다 둔다. 연결을 바꾸면 같은 시나리오의 연출이 달라지므로, 배포된 버전의 표는 고치지 않고 recipe registry와 함께 새 버전을 더한다.

| intent                 | recipe             | role → 입력                                       |
| ---------------------- | ------------------ | ------------------------------------------------- |
| `introduce`            | `introduce`        | 그대로                                            |
| `emphasize`, `reveal`  | `spotlight`        | 그대로                                            |
| `compare`              | `compare`          | 그대로                                            |
| `decompose`            | `reveal-branch`    | 그대로                                            |
| `trace`                | `trace-path`       | 그대로                                            |
| `warn`                 | `warn`             | 그대로                                            |
| `correct`, `incorrect` | `verdict`          | 그대로                                            |
| `transition`           | `introduce`        | `destination` → `subject`. `source`는 쓰지 않는다 |
| `recap`                | `recap`            | 그대로                                            |
| `summarize`            | `collapse-summary` | `subject`만. `context`는 쓰지 않는다              |

- `reveal`에 맞는 recipe는 따로 없다. `spotlight`의 focus가 대상의 조상을 펼쳐 숨은 노드를 드러낸다.
- `decompose`를 `reveal-branch`로 보내면 이미 펼쳐진 가지에도 쓸 수 있다.
- `transition`은 장소를 옮기는 recipe가 없어 도착점을 소개한다.
- delivery는 recipe 기본값이 아니라 [intent 기본값](./lecture-motion-tokens.md#intent-기본값)으로 채운다. `transition`은 `introduce` recipe를 쓰지만 transition의 quick·subtle·neutral로 움직인다.

### trace는 조상과 자손 사이만 그린다

대본의 `trace`가 노드를 부모→자식 순서로 받아 연결선을 찾으므로, `source`와 `destination`은 한쪽이 다른 쪽의 조상이어야 한다. 형제 사이나 공통 조상을 거쳐 꺾이는 흐름(예: 수도를 옮긴 순서)은 컴파일에 실패한다.

모델이 트리 구조가 아닌 흐름을 `trace`로 표현하기 쉬우므로, 외부 모델 연계(#137)에서는 이 실패율을 따로 본다.

## 비트와 장면

| 비트의 cue | 애니메이션                      | source map 위치   |
| ---------- | ------------------------------- | ----------------- |
| 없음       | 길이 0인 `wait`                 | `[]`, 컴파일러    |
| 하나       | 그 cue의 애니메이션             | `[]`              |
| 둘 이상    | cue 애니메이션을 잇는 순차 그룹 | `["children", k]` |

- 대본의 장면·비트 ID와 제목은 시나리오 값을 그대로 쓴다. 대본 ID는 시나리오에 없어 부르는 쪽이 `scriptId`로 정한다.
- 내레이션 재생 시간은 글자당 110ms, 최소 1500ms다. 데모 대본 43개 비트의 중앙값이고 분포는 91~152ms였다. 글자는 코드 포인트로 센다.
- 장면이 끝날 때 남은 persist 효과는 [플레이어가 지운다](./lecture-script-contract.md#persist-생명주기). 그래서 컴파일러는 장면 끝에 `reset`을 넣지 않는다.

## 문제 보고

문제마다 `severity`, `stage`, `path`, `message`를 담는다. `path`는 시나리오 안의 위치다.

```ts
["scenes", 0, "beats", 1, "cues", 0, "roles", "children", 2];
```

| stage         | severity | 경우                                                                      |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `schema`      | error    | 시나리오 스키마를 통과하지 못함. recipe를 실행하지 않는다                 |
| `node`        | error    | 장면 `nodeId`나 cue role의 노드가 트리에 없음. 그 cue는 실행하지 않는다   |
| `recipe`      | error    | recipe가 트리와 맞지 않음(경로·자식 없음). 입력 위치를 role 위치로 옮긴다 |
| `composition` | error    | 장면의 동작끼리 함께 실행될 수 없음                                       |
| `duration`    | warning  | 비트가 20초보다 김, 비트에서 카메라가 3번보다 많이 움직임                 |

- 한 cue가 실패해도 나머지를 계속 컴파일해 문제를 한 번에 보고한다.
- error가 하나라도 있으면 대본을 돌려주지 않는다. warning만 있으면 대본과 함께 돌려준다.
- 실패한 cue가 있는 장면은 애니메이션이 빠져 있으므로 조합과 시간 검사를 건너뛴다.
- 노드 확인을 recipe보다 먼저 한다. 없는 노드로 recipe를 실행하면 "자식이 없음"처럼 원인과 다른 실패가 나기 때문이다.

### 장면 단위 조합 검사

persist 효과는 같은 장면의 다음 비트까지 남으므로, 장면의 비트를 이어 [`getAnimationCompositionIssues`](./lecture-recipes.md#조합-검증)로 검사한다. 비트마다 따로 보면 앞 비트의 persist 흐림과 다음 비트의 흐림이 겹치는 문제를 놓친다.

장면 끝까지 남는 persist는 플레이어가 지우므로 허용한다(`allowLingeringPersist: true`). 문제는 source map으로 그 동작을 만든 cue를 찾아 cue 위치로 보고하고, 찾지 못하면 비트 위치로 보고한다.

### 시간과 카메라

- **비트 길이**: 내레이션과 애니메이션 중 긴 쪽이다. 플레이어가 둘 다 끝나야 다음 비트로 넘어간다. 20초를 넘으면 내레이션과 화면이 어긋나 보이므로 경고한다.
- **카메라 횟수**: 버전 1 recipe는 cue 하나에 카메라를 많아야 한 번 움직인다. 카메라를 옮기는 cue를 넷 이상 붙인 비트가 3번 기준에 걸린다.

두 기준은 `compileChecks.ts`의 `MAX_BEAT_DURATION_MS`, `MAX_BEAT_CAMERA_MOVES`다. 재생은 할 수 있으므로 경고로만 보고한다.

## Source map

beat ID별로 `{ animationPath, source }` 목록을 둔다. beat ID는 시나리오 전체에서 고유하고 대본도 같은 ID를 쓴다.

- `animationPath`: 비트 animation 안의 위치. 이 위치 아래의 모든 동작이 같은 출처다.
- `source`: cue가 만든 동작이면 `{ type: "cue", cueIndex, intent, recipeId }`, 컴파일러가 넣은 동작이면 `{ type: "compiler", reason }`이다. 지금 `reason`은 cue 없는 비트의 `empty-beat`뿐이다.

랩(#136)이 cue → recipe → 동작을 보여 주고, 운영 로그(#133)가 생성 동작에서 원래 cue를 거슬러 찾을 때 쓴다.

## Fixture

[시나리오 fixture](./lecture-scenario-contract.md#fixture)의 `valid/`는 `fixtures/trees/`에 같은 이름의 트리를 둔다. `{ id, parentId, name }` 목록이고, 형제 순서는 목록 순서다. 시나리오 파일은 백엔드와 함께 쓰므로 형식을 바꾸지 않고 트리를 따로 둔다.

`compiler/fixtures.test.ts`가 다음을 확인한다.

- 유효 fixture마다 트리 파일이 있다.
- 유효 fixture가 경고 없이 컴파일되고, 대본과 source map이 스냅샷과 같다.
- 무효 fixture가 기대한 위치에서 `schema` 단계로 거부된다.

trace를 쓰는 fixture는 위 제약 때문에 흐름을 사슬로 둔다(고구려 수도 졸본 → 국내성 → 평양, HTTP 브라우저 → … → 서버, 광합성 빛 반응 → 탄소 고정).

recipe, motion token, 연결표가 바뀌면 스냅샷이 실패한다. 의도한 변경이면 [registry 버전 규칙](./lecture-recipes.md#registry)을 확인한 뒤 `-u`로 갱신한다.
