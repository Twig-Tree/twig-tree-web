# 강의 운영 추적

강의를 만들고 재생하다 생긴 문제를 시나리오의 cue까지 거슬러 찾기 위한 기록, 로그, 지표다. 상위 작업은 [#133](https://github.com/Twig-Tree/twig-tree-web/issues/133)이다.

코드는 `src/entities/lecture/model/telemetry`에 있다.

| 파일                | 내용                                                  |
| ------------------- | ----------------------------------------------------- |
| `compileMetrics.ts` | 컴파일 시간, fallback 비율, 잘못된 role 비율          |
| `issueLocation.ts`  | 시나리오 위치를 beat·cue·recipe·animation 위치로 풀기 |
| `logEvents.ts`      | 로그 이벤트 모양                                      |
| `logSink.ts`        | 로그를 보낼 곳                                        |

## 추적 기록

강의를 하나 만들 때마다 아래를 한 기록으로 남긴다. 저장은 백엔드가 맡는다([Twig-Tree/BE-twig-tree#124](https://github.com/Twig-Tree/BE-twig-tree/issues/124)).

| 값                 | 출처                                                              | 이유                                                         |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| 시나리오 원본      | 모델 응답을 [응답 처리](./lecture-generation.md#응답-처리)한 결과 | 강의의 [원본](./lecture-versioning.md#원본은-시나리오다)이다 |
| 두 버전            | 시나리오의 `scenarioSchemaVersion`, `recipeRegistryVersion`       | 같은 연출을 다시 만들 때 쓴다                                |
| 트리 ID, 만든 시각 | 생성 요청                                                         | 시나리오가 전제한 트리를 찾는다                              |
| 대본 ID            | 컴파일러의 `scriptId`                                             | 재생 로그의 `scriptId`로 이 기록을 찾는다                    |
| 대본, source map   | 컴파일 결과                                                       | 아래 설명                                                    |
| 생성 측정값        | `LectureGenerationMetrics`, 모델, 프롬프트 버전, repair 횟수      | 모델·프롬프트별 품질 비교                                    |
| 컴파일 측정값      | `LectureCompileMetrics`                                           | 아래 [지표](#지표)                                           |

대본과 source map은 시나리오와 트리에서 다시 만들 수 있지만, 트리는 강의를 만든 뒤에도 바뀐다. 노드가 지워지면 같은 시나리오가 더는 컴파일되지 않아 source map을 다시 얻을 수 없다. 그래서 만든 시점의 것을 추적용으로 함께 남긴다. 재생에 쓰는 대본은 여전히 [캐시](./lecture-versioning.md#원본은-시나리오다)다.

## 거슬러 찾기

로그 하나에서 시나리오의 cue까지 다음 순서로 잇는다.

```text
재생 로그    scriptId, beatId
               ↓ 추적 기록의 source map[beatId]
             animation 위치 → cue 순번, intent, recipe ID
               ↓ 추적 기록의 시나리오
             $.scenes[i].beats[j].cues[k]
```

```text
컴파일 로그  issue.path ($.scenes[i].beats[j].cues[k]...)
             sceneId, beatId, cueIndex, intent, recipeId   시나리오에서 풀어 둔다
             animationPaths                                컴파일에 성공했을 때만(warning)
```

beat ID는 시나리오 전체에서 고유하고 대본도 같은 값을 쓰므로([시나리오 계약](./lecture-scenario-contract.md)), 비트 순번이 아니라 beat ID로 찾는다.

재생 로그는 어느 동작에서 실패했는지 담지 않는다. 비트 애니메이션은 병렬 그룹으로 함께 실행되어 예외가 어느 동작에서 났는지 실행기가 구분하지 않는다. 비트의 cue가 여럿이면 source map이 가리키는 cue 모두가 후보다.

## 로그 이벤트

| `type`                     | `level`                                    | 남기는 곳                                                                            |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `lecture-compile`          | 실패 `error`, warning `warn`, 그 밖 `info` | `compileEditorLectureScenario`                                                       |
| `lecture-playback-failure` | `error`                                    | `useLecturePlayback`의 [비트 실패 처리](./lecture-player.md#강의-플레이어-운영-규칙) |

- `lecture-compile`은 대본 ID, 두 버전, 성공 여부, [측정값](#지표), 문제 목록을 담는다. 문제마다 위의 위치 값을 풀어 둔다. 스키마를 통과하지 못해도 버전은 시나리오에서 그대로 읽어 남긴다. 어느 버전에서 실패가 잦은지 보기 위해서다.
- `lecture-playback-failure`는 대본 ID, 장면·비트 순번과 ID, 예외 메시지를 담는다.
- 애니메이션 랩의 컴파일은 입력할 때마다 돌아 로그를 남기지 않는다.

## 보낼 곳

`setLectureLogSink`로 넣는다. 수집 서비스 연동은 이 작업의 범위 밖이다.

- 넣지 않으면 기본 sink가 콘솔에 찍는다. 개발 환경은 모든 이벤트를, 그 밖에서는 `error`만 찍는다. 수집이 없는 동안 오류까지 버리면 재생 실패를 알아챌 방법이 없다.
- sink가 예외를 던지거나 돌려준 Promise가 거부돼도 강의 흐름은 멈추지 않고, 실패는 `console.error`로 남긴다. 보내기를 기다리지 않는다.
- `setLectureLogSink(null)`은 기본 sink로 되돌린다. 테스트는 sink를 넣고 끝나면 되돌린다.

## 지표

컴파일마다 `LectureCompileMetrics`를 구한다. 스키마를 통과하지 못하면 cue를 믿을 수 없어 cue 단위 값은 `null`이다. cue가 없으면 비율도 `null`이다.

| 값                           | 정의                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `compileMs`                  | `compileLectureScenario` 한 번에 걸린 시간                             |
| `fallbackRate`               | delivery 필드를 하나라도 비워 intent 기본값을 쓴 cue / 전체 cue        |
| `defaultDeliveryFieldCounts` | 필드(`pace`, `intensity`, `tone`, `continuity`)별로 기본값을 쓴 cue 수 |
| `invalidRoleRate`            | `roles` 아래에 `node`나 `recipe` 문제가 하나라도 있는 cue / 전체 cue   |

- **fallback**: 컴파일러는 recipe를 대신 고르지 않는다. 기본값을 채우는 곳은 [delivery](./lecture-motion-tokens.md)뿐이라 이것을 fallback으로 센다. 비율이 높으면 모델이 전달 방식을 고르지 않고 있다는 뜻이고, 필드별 수가 어느 값을 빠뜨리는지 보여 준다.
- **잘못된 role**: `node`는 트리에 없는 노드, `recipe`는 트리와 맞지 않는 관계(자식이 아닌 노드 등)다. 한 cue에 문제가 여럿이어도 한 번만 센다. 스키마 단계의 role 문제는 시나리오 전체가 거부되므로 이 비율이 아니라 `lecture-compile`의 문제 목록에서 본다.
- 모델 응답 단위의 측정값(단계별 문제 수, 토큰)은 [생성 측정값](./lecture-generation.md#측정값)에 있다.
