# Animation Lab

강의 애니메이션을 시험하는 개발 전용 widget이다. route는 `app/(dev)/dev/animation-lab/page.tsx`이고 production에서는 `notFound()`로 막는다. 운영 기능은 이 모듈에 의존하지 않는다.

제품의 `nodeTypes`, `edgeTypes`, `useEditorLayout`, `useFocusNode`, `useNodeTransition`을 그대로 쓴다. 효과는 이 렌더러들이 애니메이션 store를 구독해 그리므로, 여기서 본 모습이 강의에서 보이는 모습과 같다.

트리는 `model/fixtureTree.ts`의 고정 데이터로 `useInitializeTree`를 거쳐 채운다. 서버에 조회나 저장을 하지 않으므로 인증 없이 열린다. 노드 제목 편집 UI는 제품 노드에 그대로 있어 눌러볼 수 있지만, 저장 요청은 실패하고 실제 트리에는 닿지 않는다. 트리 ID가 숫자가 아니기 때문이다.

## 모드

화면 위의 버튼으로 세 모드를 오간다. 재생·중단·초기화와 반복 재생(`ui/LabPlaybackControls.tsx`)은 모드가 함께 쓰고, 지금 모드의 애니메이션을 재생한다. 고쳐야 할 입력이 남아 있으면 재생을 막는다.

| 모드     | 입력                    | 보는 것                                   |
| -------- | ----------------------- | ----------------------------------------- |
| Atomic   | 단위 동작 타임라인      | 동작 하나하나의 값과 조합                 |
| Recipe   | recipe 하나와 노드 역할 | recipe가 만든 동작, 입력 위치별 실패 이유 |
| Scenario | 시나리오 JSON과 fixture | 컴파일 결과, cue별 문제, 대본 전체 재생   |

노드를 눌러 대상을 고르는 기능은 Atomic에서만 동작한다. Recipe와 Scenario의 대상은 JSON이 정한다.

## Atomic: 조합과 재생

타임라인은 단계 목록(`model/labTimeline.ts`)이고, 각 단계는 대본 계약의 단위 동작을 그대로 담는다. 노드는 고정 트리의 서버 ID로 가리킨다. `앞 단계와 동시에 시작`을 켠 단계끼리 병렬 그룹으로 묶이고, 그 묶음을 순서대로 이어 `beat.animation` 하나를 만든다. 재생은 제품과 같은 `runLectureAnimation`을 쓴다.

단위 동작은 카메라(`focus`), 노드(`highlight`, `dim`), 연결선(`trace`), 구조(`collapse`, `expand`), 흐름 제어(`wait`, `reset`)로 나뉜다. `highlight`는 스타일과 의미 색상을, `trace`는 동시·순차 진행과 정·역방향 및 유지 여부를 고를 수 있다. 프리셋은 동작을 직접 갖지 않고 [recipe](../../../docs/specs/lecture-recipes.md) 호출 목록(`recipeId`, 입력, delivery)만 갖는다. 랩은 고정 트리로 recipe의 트리 창구(`createLabRecipeTree`)를 만들어 recipe를 차례로 실행하고, 그 결과를 타임라인 단계로 바꾼다. 시간은 motion token에서 오므로 프리셋에 숫자를 적지 않는다. 새 연출이 필요하면 프리셋에 동작을 적지 말고 recipe를 추가한다.

프리셋을 불러온 뒤의 타임라인은 일반 단계라 자유롭게 고칠 수 있다. 고친 결과는 프리셋에 저장되지 않는다.

대본 계약은 그룹을 얼마든지 중첩할 수 있지만 타임라인은 "순차 안의 병렬"까지만 표현한다. JSON 편집기에 더 깊은 중첩을 넣으면 적용하지 않고 안내한다.

복사한 JSON의 노드 ID는 고정 트리의 ID이므로, 대본에 옮길 때는 `nodeIds.xxx`처럼 그 대본의 ID로 바꾼다.

## Recipe

recipe 하나를 고정 트리로 실행한다(`model/labRecipeRun.ts`). recipe를 고르면 `LAB_RECIPE_SAMPLE_INPUTS`의 예시 입력이 채워지고, delivery 네 가지를 고를 수 있다. 비운 값은 recipe 기본값을 쓴다. registry 버전은 프리셋과 같은 `LAB_RECIPE_REGISTRY_VERSION`이다.

실패하면 입력 안의 위치(예: trace-path의 `destination`)와 이유를 입력 칸 아래에 보여 준다. 성공하면 만들어진 단위 동작을 들여쓴 목록으로 보여 주고, `타임라인에서 고치기`로 Atomic 타임라인에 옮겨 값을 하나씩 바꿔 볼 수 있다.

recipe를 추가하면 `LAB_RECIPE_SAMPLE_INPUTS`가 `Record`라 타입 오류로 예시 입력이 빠졌음을 알린다. `labRecipeRun.test.ts`가 모든 예시 입력을 실행해 본다.

## Scenario

[시나리오 fixture](../../../docs/specs/lecture-scenario-contract.md#fixture)를 불러와 고치고 [컴파일러](../../../docs/specs/lecture-compiler.md)로 컴파일한다(`model/labScenarioRun.ts`). fixture 목록은 `entities/lecture`가 `LECTURE_SCENARIO_FIXTURES`로 공개한다.

### 트리

캔버스는 fixture가 전제하는 트리(`fixtures/trees/`)로 바뀐다. 트리 ID는 `animation-lab:<트리 이름>`이라 트리 ID가 바뀌면 `useInitializeTree`가 store를 새로 채우고, 다음 레이아웃이 끝나면 화면을 다시 맞춘다. 다른 모드로 가면 고정 트리로 돌아온다. 노드 ID가 트리마다 겹치기 때문이다. 처음 열 때의 접힘은 제품 편집기와 같이 기본 깊이를 따른다.

거부되는 fixture에는 트리 파일이 없어, 제목이 같은 통과 fixture의 트리를 쓴다. 시나리오를 고쳐도 트리는 바뀌지 않는다.

### 문제

컴파일 문제와 경고는 가장 가까운 cue → 비트 → 장면 → 시나리오 전체 단위로 묶는다. 묶음 제목은 `장면 asia › 비트 asia-1 › cue 1 (compare)`처럼 시나리오의 ID와 intent로 만들고, 그 아래에 단계(`schema`, `node`, `recipe`, `composition`, `duration`)와 묶음 안의 경로를 적는다. JSON을 읽지 못하면 단계는 `json`이다.

### 컴파일 결과

성공하면 [source map](../../../docs/specs/lecture-compiler.md#source-map)으로 장면 → 비트 → cue(`intent → recipe`) → 동작 트리를 펼친다(`model/labScenarioOutline.ts`). source map이 가리키는 위치에 동작이 없으면 컴파일러와 source map이 어긋난 버그이므로 예외로 알린다.

cue마다 실제로 쓴 delivery와 motion을 함께 보여 준다. 컴파일러와 같은 `getResolvedDelivery`, `getLectureMotion`으로 계산하고, cue가 직접 고른 값은 굵게, intent 기본값으로 채운 값은 흐리게 그린다.

### 재생

위의 재생 버튼은 대본 전체를 재생한다. 비트는 내레이션 시간(`fallbackDurationMs`)만큼은 머물고, 장면이 바뀌면 남은 효과를 지운다. 음성을 끈 강의 플레이어와 같은 흐름이다.

결과 트리의 비트와 cue 옆 버튼은 그 부분만 재생한다. 앞 비트가 남긴 유지 효과와 카메라 없이 시작하므로, 비트 사이의 이어짐은 전체 재생으로 본다.

### 복사

시나리오 편집기 아래에서 세 가지를 복사한다.

- 시나리오: 편집 중인 JSON. 고친 결과를 새 fixture로 옮길 때 쓴다.
- 대본: 컴파일한 `LectureScript`. 컴파일에 실패하면 버튼이 꺼진다.
- fixture 트리: `fixtures/trees/<이름>.json`과 같은 모양.

새 fixture를 추가하는 순서는 [시나리오 fixture](../../../docs/specs/lecture-scenario-contract.md#fixture)를 따르고, `fixtures/index.ts`의 목록에도 넣는다. 빠뜨리면 `fixtures/index.test.ts`가 실패한다.

## 새 효과 추가

새 효과는 타임라인 값만으로는 만들 수 없고, 렌더러와 계약에 코드를 더해야 한다. 계약과 registry, 실행기에 추가하는 순서는 [강의 대본 계약](../../../docs/specs/lecture-script-contract.md#새-동작-추가)을 따르고, 화면에서는 다음을 더한다.

1. `lectureAnimationStore`에 레이어와 판단 함수를 추가한다.
2. `CustomNode`나 `CustomEdge`가 판단 함수를 구독해 data 속성을 달고, `app/xy-theme.css`에서 모양을 정한다. 색은 테마 토큰을 쓴다.
3. 이 화면의 `model/labActions.ts`에 이름과 기본값을 채운다. 빠뜨리면 타입 오류가 난다.
4. 편집 필드가 필요하면 `LabStepEditor.tsx`에, 재생해도 변화가 없는 조건이 있으면 `validateLabStep.ts`에 추가하고 재생해 본다.

JSON 편집기는 대본 스키마(`lectureAnimationActionSchema`)로 동작을 검사하므로 따로 고치지 않는다. 대상 노드를 읽고 바꾸는 일도 registry의 필드 이름으로 처리한다.
