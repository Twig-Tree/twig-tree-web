# 강의 버전 호환

시나리오, recipe, 대본이 바뀌어도 이미 만든 강의를 재생할 수 있게 하는 규칙이다. 상위 작업은 [#133](https://github.com/Twig-Tree/twig-tree-web/issues/133)이다.

## 원본은 시나리오다

강의의 원본은 [시나리오](./lecture-scenario-contract.md)와 그 안의 두 버전이다. 대본(`LectureScript`)은 원본에서 만들어지는 결과다.

```text
원본                                       결과
LectureScenario                            LectureScript
├─ scenarioSchemaVersion  ─┐               (언제든 다시 만들 수 있다)
├─ recipeRegistryVersion  ─┼─ 컴파일러 ─▶
└─ scenes ...             ─┘
                 트리 ────┘
```

- 같은 시나리오, 같은 recipe 버전, 같은 트리는 항상 같은 대본으로 컴파일된다([결정성](./lecture-compiler.md#결정성)).
- 그래서 대본은 저장하더라도 캐시로만 다룬다. 대본에는 버전 필드를 두지 않는다. 대본 모양이 바뀌면 저장한 대본을 고치지 않고 시나리오에서 다시 만든다.
- 추적 기록은 시나리오 원본과 두 버전을 남긴다. 트리가 바뀌면 다시 만들 수 없는 대본과 source map도 만든 시점의 것을 함께 남긴다([운영 추적](./lecture-operations.md#추적-기록)).
- 트리가 바뀌면 같은 시나리오도 컴파일이 실패하거나 다른 노드를 가리킬 수 있다. 이것은 버전 문제가 아니라 트리와 시나리오가 어긋난 것이다. 플레이어는 트리에 없는 노드가 하나라도 있으면 강의를 시작하지 않는다([운영 규칙](./lecture-player.md#강의-플레이어-운영-규칙)).

## 시나리오 스키마

`scenarioSchemaVersion`을 올리는 기준은 [시나리오 계약](./lecture-scenario-contract.md#버전)에 있다. 기존 시나리오가 거부되는 변경에서만 올린다.

올릴 때는 저장된 옛 시나리오를 버리지 않고 파싱 경계에서 바꾼다.

```text
입력 ─▶ scenarioSchemaVersion 읽기 ─▶ v1→v2 ─▶ v2→v3 ─▶ … ─▶ 지금 스키마로 검사 ─▶ 컴파일러
```

- 버전마다 바로 다음 버전으로 바꾸는 함수 하나를 둔다. 옛 버전은 이어 붙여 지금 버전까지 올린다. 건너뛰는 함수는 만들지 않는다.
- 바꾸는 함수는 모양만 바꾸고 뜻은 바꾸지 않는다. 바꾼 시나리오는 옛 시나리오와 같은 연출을 만들어야 한다.
- 옛 버전의 스키마는 바꾸는 함수의 입력을 검사하는 데만 남긴다. 모델에 보내는 JSON Schema와 strict 스키마는 지금 버전만 만든다.
- 지금은 버전 1뿐이라 바꾸는 함수가 없다. 처음 올릴 때 이 연쇄를 만든다.

## Recipe registry

같은 시나리오라도 recipe 버전이 다르면 다른 연출이 된다. 그래서 연출 결과가 바뀌는 변경은 [새 recipe 버전](./lecture-recipes.md#registry)에서 한다. 결과를 바꾸는 것은 recipe 코드만이 아니다.

- recipe 정의와 기본 delivery
- [motion token](./lecture-motion-tokens.md) 값
- [intent → recipe 연결표](./lecture-compiler.md)
- 내레이션 재생 시간 계산(`compiler/narration.ts`)

### 보존 기간

`SUPPORTED_RECIPE_REGISTRY_VERSIONS`의 버전은 그 버전을 가리키는 저장 시나리오가 남아 있는 동안 남긴다. 지우려면 다음 순서를 따른다.

1. 백엔드가 그 버전을 가리키는 시나리오 수를 센다.
2. 남은 시나리오는 `recipeRegistryVersion`만 새 버전으로 바꿔 다시 컴파일한다. 시나리오 모양은 같으므로 값 하나만 바뀐다. 연출은 새 버전의 것으로 바뀐다.
3. 0이 되면 목록, registry, 연결표에서 그 버전을 지우고 [동결 fixture](#동결-fixture)의 그 버전 디렉터리도 지운다.

### 첫 배포 전

버전 1은 아직 배포 전이라 고칠 수 있다. 첫 배포 때 아래 표에 날짜를 적고, 그때부터 버전 1의 결과를 바꾸는 변경은 버전 2에서 한다.

| 버전 | 첫 배포 |
| ---- | ------- |
| 1    | 배포 전 |

## 동결 fixture

`src/entities/lecture/model/compiler/legacy/recipe-v<버전>/<이름>/`에 시나리오, 트리, 기대 대본을 함께 둔다.

| 파일            | 내용                                     |
| --------------- | ---------------------------------------- |
| `scenario.json` | 그 버전으로 만든 시나리오. 고치지 않는다 |
| `tree.json`     | 시나리오가 전제하는 트리. 고치지 않는다  |
| `script.json`   | 기대 대본. 테스트가 만든다               |

`legacy.test.ts`가 시나리오를 지금 컴파일러로 컴파일해 `script.json`과 비교한다. 결과가 달라지면 실패한다.

- 배포된 버전의 `script.json`은 `-u`로 갱신하지 않는다. 실패하면 변경을 새 recipe 버전으로 옮긴다.
- 배포 전 버전은 의도한 변경이면 `-u`로 갱신한다.
- 시나리오 스키마를 올린 뒤에도 옛 시나리오 파일은 그대로 두고, 파싱 경계의 바꾸는 함수를 거쳐 컴파일되는지 확인한다.
- 디렉터리의 버전이 지원 목록에 없거나, 시나리오의 `recipeRegistryVersion`이 디렉터리 버전과 다르면 실패한다.

`scenario/fixtures/valid`의 fixture는 지금 계약의 예시라 계약을 바꿀 때 함께 고친다. 동결 fixture는 과거에 만든 강의를 대신하므로 고치지 않는다.

## 데모 대본

데모 강의는 시나리오 없이 대본으로 직접 쓴 것이다. `scriptSchema.test.ts`가 모든 데모 대본이 지금 대본 스키마를 통과하는지 검사한다. 대본 스키마를 바꿔 데모가 실패하면 데모 대본을 고친다. 저장된 대본이 아니므로 고쳐도 호환 문제가 없다.
