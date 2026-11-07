# 강의 animation recipe

recipe는 atomic 동작을 엮은 연출 단위다. 노드 역할(입력)과 delivery를 받아 비트 하나의 애니메이션을 만든다. 시나리오 컴파일러(#139)와 애니메이션 랩 프리셋이 같은 recipe를 쓴다.

```text
시나리오 cue (intent, roles, delivery)         랩 프리셋 { recipeId, input, delivery }
        ↓ 컴파일러: intent → recipe 선택                ↓
        └──────────────→ getLectureRecipeAnimation ←────┘
                           1. 입력을 recipe 스키마로 검사
                           2. delivery를 recipe 기본값으로 채워 motion 값으로 바꿈
                           3. recipe.create(input, { motion, tree })
                                   ↓
                         LectureAnimation (대본 계약)
```

코드는 `src/entities/lecture/model/recipes`에 있다.

| 파일                               | 내용                                      |
| ---------------------------------- | ----------------------------------------- |
| `types.ts`                         | recipe 정의, 트리 창구, 실패 타입         |
| `getLectureRecipeAnimation.ts`     | 실행 함수, `defineLectureRecipe`          |
| `recipeInputSchema.ts`             | 입력 역할 모양과 겹침 검사                |
| `recipeActions.ts`                 | 동작 조립 함수. 값은 모두 motion에서 읽음 |
| `registry.ts`                      | 버전별 recipe 모음, `getLectureRecipe`    |
| `getAnimationCompositionIssues.ts` | 동작 사이의 조합 검증                     |
| recipe별 파일                      | `introduce.ts`, `tracePath.ts` 등         |

## Recipe 계약

```ts
type LectureRecipeDefinition<Input> = {
  inputSchema: z.ZodMiniType<Input>;
  defaultDelivery: ResolvedDelivery;
  create: (
    input: Input,
    context: LectureRecipeContext,
  ) => LectureAnimation | LectureRecipeFailure;
};
```

- **입력**: recipe는 cue를 받지 않고 자기 입력을 받는다. 어떤 intent를 어떤 recipe로 보낼지는 컴파일러가 정한다. 그래야 시나리오가 없는 랩 프리셋도 같은 recipe를 부를 수 있다.
  - 역할 모양은 시나리오 cue의 role과 같은 규칙을 쓴다(`recipeRole.one`, `many`, `optionalMany`).
  - 정의하지 않은 역할과, 한 노드를 두 역할에 쓰는 입력은 거부한다.
  - 입력이 스키마를 통과하지 못하면 `create`를 부르지 않는다.
- **delivery**: 부르는 쪽이 비운 값은 `defaultDelivery`로 채운다. 컴파일러는 [intent 기본값](./lecture-motion-tokens.md#intent-기본값)으로 모두 채워 넘기므로, recipe 기본값은 랩처럼 시나리오 없이 부를 때 쓰인다.
- **값**: 시간·배율·색은 recipe 본문에 적지 않고 `context.motion`에서 읽는다([motion token](./lecture-motion-tokens.md)). pace·intensity·tone 변형 때문에 recipe를 따로 만들지 않는다.
  - `bounce`·`shake`처럼 강도가 아니라 의미가 있는 움직임과, 판정처럼 의미가 정한 색만 recipe가 직접 고른다.
  - `tone: neutral`이면 `createEmphasis`가 강조 대신 흐림을 만든다.
- **실패**: 입력 모양은 맞지만 트리와 맞지 않으면(경로가 없음, 자식이 없음) `createRecipeFailure(path, message)`를 돌려준다. `path`는 입력 안의 위치이고, 컴파일러가 cue의 role 위치로 옮겨 보고한다.

### 트리 창구

entity는 트리 데이터를 import하지 않으므로 recipe는 함수 두 개로만 트리를 읽는다. 구현은 부르는 쪽이 넣는다. 랩은 `createLabRecipeTree`로 고정 트리에서 만든다.

| 함수                                               | 돌려주는 값                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `getChildIds(nodeId)`                              | 화면 순서의 자식 ID. 없거나 모르는 노드면 빈 목록                       |
| `getPathNodeIds(ancestorNodeId, descendantNodeId)` | 조상에서 자손까지 부모→자식 순서의 경로(양 끝 포함). 조상이 아니면 null |

경로를 조상·자손으로 한정한 것은 대본의 `trace`가 노드를 부모→자식 순서로 받아 연결선을 찾기 때문이다. 공통 조상을 거쳐 꺾이는 경로는 trace 하나로 그릴 수 없다.

## Recipe 목록 (버전 1)

| ID                 | 입력                                       | 연출                                                              | 실패                             |
| ------------------ | ------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| `introduce`        | `subject` 하나, `context` 선택             | 주제와 주변으로 카메라 → 주제 강조 → 주변이 있으면 함께 고정 강조 |                                  |
| `spotlight`        | `subject` 1+                               | 주변 흐림과 대상 강조를 동시에                                    |                                  |
| `compare`          | `left` 1+, `right` 1+                      | 양쪽으로 카메라 → 왼쪽 강조 → 오른쪽 강조                         |                                  |
| `warn`             | `subject` 1+                               | 흔들림 → 쉼 → 고정 강조. subtle이나 neutral이면 고정 강조 하나    |                                  |
| `verdict`          | `correctAnswer` 1+, `incorrectAnswer` 선택 | 오답 흔들림(danger) → 쉼 → 정답 bounce(success). tone은 무시      |                                  |
| `trace-path`       | `source`, `destination`                    | 경로로 카메라 → 연결선을 하나씩 → 도착점 강조. 위로 가면 역방향   | 조상·자손이 아니면 `destination` |
| `reveal-branch`    | `parent`, `children` 선택                  | 펼치기 → 카메라 → 자식 함께 강조                                  | 자식이 없으면 `parent`           |
| `tour-children`    | `parent`, `children` 선택                  | 카메라 → 자식을 하나씩 강조                                       | 자식이 없으면 `parent`           |
| `collapse-summary` | `subject` 하나                             | 가지 전체로 카메라 → 접기 → 부모 강조                             | 자식이 없으면 `subject`          |
| `recap`            | `subject` 1+                               | 한 화면에 모은 뒤 하나씩 강조                                     |                                  |

recipe 하나는 카메라 이동부터 강조까지 완결된 연출이다. 여러 recipe를 이어 부르면 단계마다 카메라 이동과 강조가 반복되어 길어진다. 랩의 "한 단계씩 펼치기"(recipe 4개, 약 9.4초)가 그 예다.

## Registry

```ts
LECTURE_RECIPE_REGISTRIES = { 1: { introduce, spotlight, … } };
getLectureRecipe(1, "trace-path");
```

- **ID**: kebab-case. 가르치는 의도가 아니라 연출을 나타낸다(`trace-path`, `spotlight`). 한 intent가 상황에 따라 여러 recipe로, 여러 intent가 한 recipe로 갈 수 있으며, 그 연결은 컴파일러가 한다.
- **버전**: 시나리오의 [`recipeRegistryVersion`](./lecture-scenario-contract.md#버전)과 같은 값이다. 같은 입력과 같은 버전은 항상 같은 애니메이션을 만든다.
  - 배포된 버전의 결과가 바뀌는 변경은 새 버전에서 한다. recipe 코드뿐 아니라 motion token 값과 recipe 기본 delivery도 결과를 바꾼다.
  - 바뀌지 않는 recipe는 새 버전에서 같은 정의를 다시 가리킨다.
  - 버전 1은 아직 배포 전이라 고칠 수 있다. 첫 배포 시점을 이 문서에 적는다.
- `SUPPORTED_RECIPE_REGISTRY_VERSIONS`의 버전마다 항목이 있어야 하며, 빠뜨리면 타입 오류가 난다.
- recipe마다 입력 타입이 달라 ID로 찾으면 TS가 하나로 좁히지 못한다. `getLectureRecipe`는 입력을 `unknown`으로 받는 정의를 돌려주고, 실행 함수가 스키마로 먼저 검사한다.

## 조합 검증

`getAnimationCompositionIssues(animation, { allowLingeringPersist })`는 동작끼리 함께 실행될 수 있는지 검사한다. 대본 스키마는 동작 하나하나의 모양만 본다.

| 검사                                                   | 이유                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| 병렬 묶음에서 둘 이상의 갈래가 카메라를 움직임         | 마지막 이동만 남는다. `reset`의 `visual` scope는 세지 않음 |
| 병렬 묶음의 다른 갈래가 같은 노드를 접거나 펼침        | 결과가 실행 순서에 따라 달라진다                           |
| reset(`visual`, `all`) 없이 끝까지 남는 `persist` 효과 | `continuity: persist`면 의도라서 부르는 쪽이 허용을 정한다 |

recipe가 만든 결과에 문제가 있으면 recipe의 버그다. 그래서 실행 함수에서 검사하지 않고, 모든 recipe × delivery 결과를 테스트로 검사한다. 컴파일러는 여러 cue를 이은 비트 전체를 이 함수로 검사한다. 이때 `path`는 애니메이션 안의 위치다.

## 새 recipe 추가

1. `recipes/<이름>.ts`에 `defineLectureRecipe`로 정의한다. 입력은 `createRecipeInputSchema`로, 동작은 `recipeActions.ts`의 함수로 만든다. 숫자를 직접 쓰지 않는다.
2. `registry.ts`의 해당 버전에 등록한다. 배포된 버전이면 새 버전을 만든다.
3. `registry.test.ts`의 `SAMPLE_INPUTS`에 대표 입력을 넣는다. 빠뜨리면 타입 오류가 난다. 넣으면 다음 검사가 자동으로 붙는다.
   - delivery 5가지 결과 스냅샷
   - 대본 스키마 통과
   - 조합 검증 통과
   - 랩 타임라인 모양(순차 안의 병렬) 이내
4. 트리와 맞지 않을 때의 실패와 recipe 고유 규칙은 따로 테스트한다.
5. 랩에서 쓰려면 `widgets/animation-lab/model/presets.ts`에 프리셋을 추가하고 재생해 본다.
