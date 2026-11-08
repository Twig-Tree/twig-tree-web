# 강의 motion token

시나리오의 delivery 단어(`pace`, `intensity`, `tone`, `continuity`)를 대본의 구체 값(시간, 스타일, 배율, 색)으로 바꾸는 표와 규칙이다. 레시피와 컴파일러는 값을 직접 적지 않고 이 표에서 읽는다.

```text
시나리오 cue (intent, delivery?)
    ↓ getResolvedDelivery      빠진 delivery를 intent 기본값으로 채운다
    ↓ getLectureMotion         토큰 표에서 구체 값을 고른다
레시피                         값을 atomic 동작에 넣는다 (lecture-recipes.md)
    ↓ getReducedMotionAnimation  동작 줄이기 사용자용 대본
대본 (LectureScript)
    ↓ 렌더러                   반복 애니메이션의 주기와 곡선은 CSS 변수가 정한다
```

코드는 모두 `src/entities/lecture/model`에 있다.

| 파일               | 내용                     |
| ------------------ | ------------------------ |
| `motionTokens.ts`  | 토큰 표                  |
| `lectureMotion.ts` | intent 기본값과 resolver |
| `reducedMotion.ts` | 동작 줄이기 정책         |

## 토큰 표

값은 랩 프리셋과 데모 강의에서 쓰던 값의 분포를 기준으로 정했다. `normal`은 가장 흔한 값, `quick`과 `slow`는 그 양쪽이다.

### 시간 (`LECTURE_DURATION_TOKENS`, ms)

같은 `pace`라도 시간을 쓰는 자리마다 알맞은 길이가 달라 자리별로 나눈다.

| 자리           | 쓰는 곳                               | quick | normal | slow |
| -------------- | ------------------------------------- | ----- | ------ | ---- |
| `camera`       | `focus`가 화면을 옮기는 시간          | 600   | 700    | 900  |
| `emphasis`     | 강조·흐림·동시 추적이 보이는 시간     | 800   | 1200   | 1800 |
| `pause`        | `wait`                                | 300   | 450    | 700  |
| `traceSegment` | 순차 추적이 연결선 하나를 그리는 시간 | 450   | 650    | 900  |
| `layoutHold`   | 접기·펼치기 뒤 다음 동작까지 대기     | 800   | 850    | 1050 |

`layoutHold`는 편집기의 노드 전환 시간(800ms)보다 짧으면 전환 도중에 다음 동작이 시작한다.

### 곡선 (`LECTURE_EASING_TOKENS`)

| 이름    | 값            | 쓰는 곳                   |
| ------- | ------------- | ------------------------- |
| `enter` | `ease-out`    | 나타날 때                 |
| `move`  | `ease-in-out` | 자리를 옮기거나 반복할 때 |
| `exit`  | `ease-in`     | 사라질 때                 |

### 강도 (`LECTURE_INTENSITY_TOKENS`)

| 강도     | 강조 스타일 | focus 배율 |
| -------- | ----------- | ---------- |
| `subtle` | `steady`    | 1          |
| `medium` | `pulse`     | 1.2        |
| `strong` | `pop`       | 1.4        |

`bounce`와 `shake`는 강도가 아니라 의미(주의, 오답)를 나타내므로 레시피가 직접 고른다.

### 분위기 (`LECTURE_TONE_TOKENS`)

| 시나리오 `tone` | 대본 highlight `tone` |
| --------------- | --------------------- |
| `neutral`       | 없음 (`null`)         |
| `accent`        | `accent`              |
| `positive`      | `success`             |
| `warning`       | `warning`             |
| `danger`        | `danger`              |

`neutral`은 강조 색을 쓰지 않는다는 뜻이다. 레시피는 이때 강조 대신 흐림처럼 색이 없는 동작을 고른다. 색 값 자체는 CSS가 테마 토큰으로 정한다.

## Intent 기본값

모델이 delivery를 비우면 intent마다 정한 값을 쓴다(`LECTURE_INTENT_DELIVERY_DEFAULTS`). 같은 단어라도 의도에 따라 알맞은 분위기가 달라 스키마가 아니라 여기서 채운다. `continuity`는 모두 `transient`다.

| intent                                                 | pace     | intensity | tone       |
| ------------------------------------------------------ | -------- | --------- | ---------- |
| `introduce`, `compare`, `decompose`, `trace`, `reveal` | `normal` | `medium`  | `accent`   |
| `emphasize`                                            | `normal` | `strong`  | `accent`   |
| `warn`                                                 | `normal` | `strong`  | `warning`  |
| `correct`                                              | `normal` | `medium`  | `positive` |
| `incorrect`                                            | `normal` | `strong`  | `danger`   |
| `transition`                                           | `quick`  | `subtle`  | `neutral`  |
| `recap`                                                | `quick`  | `subtle`  | `accent`   |
| `summarize`                                            | `slow`   | `medium`  | `accent`   |

모델이 고른 값은 필드마다 기본값보다 우선한다. intent를 추가하고 기본값을 빠뜨리면 타입 오류가 난다.

## 동작 줄이기

`getReducedMotionAnimation`은 동작 줄이기를 켠 사용자에게 보낼 대본을 만든다. 무엇을 바꿀지는 [atomic effect registry](./lecture-script-contract.md#atomic-effect-registry)의 `motion`과 `durationMeaning` 값이 정한다.

| `motion`     | 동작                 | 바꾸는 것                                            |
| ------------ | -------------------- | ---------------------------------------------------- |
| `camera`     | `focus`              | `durationMs`를 0으로. 바로 도착한다                  |
| `camera`     | `reset`              | 없음. 시간 필드가 없다                               |
| `layout`     | `collapse`, `expand` | 없음. `durationMs`는 전환 시간이 아니라 hold다       |
| `decoration` | `highlight`          | 움직이는 `style`을 `steady`로                        |
| `decoration` | `trace`              | `progressive`를 `simultaneous`로. 전체 시간은 그대로 |
| `decoration` | `dim`                | 없음. 흐림 자체가 내용이다                           |
| `none`       | `wait`               | 없음. 쉬는 시간은 움직임이 아니라 말의 호흡이다      |

그룹의 순서와 병렬 구조는 바꾸지 않는다.

`collapse`·`expand`의 `durationMs`는 다음 동작까지 기다리는 시간이다. 노드가 실제로 움직이는 시간은 대본에 없고 편집기의 `useNodeTransition`이 정하므로, 노드 전환을 줄이는 일은 대본이 아니라 런타임이 맡는다. 이 정책은 그 처리에 기댄다. hold를 0으로 바꾸면 런타임이 전환을 줄이지 않는 경우 전환 도중에 다음 동작이 시작되므로 바꾸지 않는다.

[컴파일러](./lecture-compiler.md#결정성)는 이 정책을 적용하지 않는다. 동작 줄이기는 사용자 설정이라 같은 시나리오에서 두 가지 대본이 필요하므로, 컴파일 결과에 부르는 쪽이 적용한다.

### 런타임 적용

강의 재생기(`useLecturePlayback`)는 비트를 시작할 때마다 `prefersReducedMotion()`을 읽고, 켜져 있으면 그 비트의 애니메이션에 이 함수를 적용해 실행한다. 강의 도중 설정을 바꾸면 다음 비트부터 반영된다. 비트를 옮길 때 되감는 상태(`getLectureSeekState`)도 같은 설정으로 줄인 대본을 따라간다. 줄인 대본은 꾸밈 모양과 순차 추적의 유지 시점이 달라, 다른 대본으로 되감으면 옮긴 화면과 재생 화면이 어긋난다.

대본은 서버 ID(`nodeId`)를, 재생기는 편집기 ID(`clientId`)를 쓰므로 이 함수는 동작 종류와 바꿀 필드만 보고 두 모양을 함께 받는다.

대본을 줄여도 아래 런타임 처리는 그대로 둔다. 대본이 아닌 경로(검색 포커스, 접기)도 같은 설정을 따라야 하기 때문이다.

- 카메라: `useCameraMove`가 `getMotionDuration`으로 이동 시간을 0으로 만든다.
- 노드 전환: `useNodeTransition`이 같은 함수를 쓴다. 대본에는 전환 시간이 없어 이 처리만 노드 전환을 줄인다.
- 꾸밈: `app/xy-theme.css`의 `@media (prefers-reduced-motion: reduce)`가 반복 애니메이션을 끈다.

### 정보 의미 보존

`reducedMotion.test.ts`가 모든 유효 시나리오 fixture의 컴파일 결과와 데모 대본을 줄여, 비트마다 바꿔도 되는 필드(`focus`의 `durationMs`, `highlight`의 `style`, `trace`의 `mode`)를 뺀 나머지가 원래 대본과 같은지 검사한다. 그룹 구조, 동작 순서, 대상 노드, 유지 여부, 톤, 쉬는 시간이 남는다. 줄인 대본도 대본 스키마를 통과해야 한다.

## CSS 변수

반복 애니메이션의 주기, 곡선, 흐림 투명도는 `app/xy-theme.css`의 `.react-flow` 블록에 `--lecture-*` 변수로 둔다. 대본의 `durationMs`는 효과가 보이는 전체 시간이고, 이 변수는 그 안에서 한 번 움직이는 주기다.

| 변수                         | 값            | 쓰는 곳                       |
| ---------------------------- | ------------- | ----------------------------- |
| `--lecture-ease-enter`       | `ease-out`    | 나타나는 전환, pop            |
| `--lecture-ease-move`        | `ease-in-out` | pulse, bounce, shake          |
| `--lecture-fade-duration`    | 240ms         | 강조·흐림이 켜지는 전환       |
| `--lecture-current-duration` | 260ms         | 현재 장면 노드 표시 전환      |
| `--lecture-pulse-cycle`      | 900ms         | pulse 한 번                   |
| `--lecture-pop-duration`     | 650ms         | pop                           |
| `--lecture-bounce-cycle`     | 800ms         | bounce 한 번                  |
| `--lecture-shake-cycle`      | 550ms         | shake 한 번                   |
| `--lecture-trace-cycle`      | 520ms         | 추적 점선이 한 칸 흐르는 시간 |
| `--lecture-dim-opacity`      | 0.22          | 흐린 노드의 투명도            |

추적 점선은 끊김 없이 흐르려면 등속이어야 해서 곡선을 변수로 두지 않고 `linear`로 고정한다.

### 같은 값을 두 곳에 둔 자리

- **bounce·shake 주기**: `getLectureHighlightMotionStyle`의 `MOTION_CYCLE_MS`가 표시 시간을 주기로 나눠 노드에 `--lecture-highlight-cycle`을 넣는다. 이 값이 있으면 CSS 변수보다 우선한다. 두 곳의 기준값이 다르면 반복 횟수 계산이 어긋나므로 함께 고친다.
- **곡선 이름**: CSS 변수 이름과 `LECTURE_EASING_TOKENS`의 이름을 맞춘다.

## 값을 바꿀 때

토큰 표나 intent 기본값을 바꾸면 같은 시나리오가 다른 연출로 컴파일된다. [`recipeRegistryVersion`](./lecture-scenario-contract.md#버전)은 같은 시나리오와 같은 버전이 항상 같은 연출을 만든다고 약속하므로, 이미 배포된 레시피 버전이 쓰는 값은 고치지 않고 새 레시피 버전에서 바꾼다. 레시피 버전 1은 아직 배포 전이라 지금은 바꿀 수 있다([recipe registry](./lecture-recipes.md#registry)).

표가 바뀌면 `motionTokens.test.ts`와 `lectureMotion.test.ts`의 스냅샷이 실패한다. 의도한 변경이면 `-u`로 갱신한다.

## 테마별 값으로 나누기

지금은 모든 테마가 같은 시간과 곡선을 쓴다. 쓰는 곳이 하나인 동안 미리 나누지 않는다([테마 규칙](../conventions/theming.md#css로-정할-수-없는-값)).

테마마다 다른 움직임이 필요해지면 다음 순서로 나눈다.

1. **CSS만 다른 경우** (반복 주기, 곡선, 흐림 투명도): `xy-theme.css`의 `--lecture-*`를 `--theme-lecture-*`에 잇고, 각 테마 파일에서 값을 정한다. 색 토큰과 같은 방식이다.
2. **대본 값이 다른 경우** (`durationMs`, 배율): 대본은 테마를 모르고 서버에 저장되므로 토큰 표를 테마별로 나누지 않는다. 테마를 바꿀 때마다 같은 강의의 길이가 달라지기 때문이다. 대신 렌더러가 테마별 배율을 곱하는 방식을 먼저 검토한다.
3. bounce·shake 주기를 테마별로 나누면 `MOTION_CYCLE_MS`도 `useTheme`으로 테마별 값을 읽게 바꾼다.
