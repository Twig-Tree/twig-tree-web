# 강의 생성 입력 계약

외부 모델이 [`LectureScenario`](./lecture-scenario-contract.md)를 만들 때 받는 입력을 정리한다. 상위 작업은 [#137](https://github.com/Twig-Tree/twig-tree-web/issues/137)이다.

```text
트리 outline + 어휘 + 사용자 요청 → 프롬프트(백엔드) → 외부 모델 → LectureScenario → 컴파일러
```

프롬프트 작성, 모델 호출, 재시도는 백엔드가 맡는다. 프론트엔드는 모델에 넘길 재료와 그 형식을 정하고, 백엔드는 이 문서의 형식대로 프롬프트에 싣는다.

## 트리 outline

모델은 노드를 대괄호 안의 서버 노드 ID로 가리킨다. 한 줄에 노드 하나이고, 깊이마다 두 칸씩 들여 쓴다.

```text
- [1] HTTP 요청 흐름
  - [2] 브라우저
    - [3] DNS 조회
  - [4] 서버
```

| 규칙             | 내용                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| 형제 순서        | 노드 목록 순서. 컴파일러 트리와 같은 기준이다                            |
| 제목             | 줄바꿈과 연속 공백을 공백 하나로 합친다. 비어 있으면 `(제목 없음)`       |
| 목록에 없는 부모 | 그 노드를 루트로 둔다. 컴파일러가 노드로 인정하므로 모델도 볼 수 있다    |
| 저장 전 노드     | 서버 ID가 없어 시나리오가 가리킬 수 없으므로 뺀다. 그 자식은 루트가 된다 |
| 메모, 태그, 위치 | 넣지 않는다. 필요해지면 형식을 바꾸고 이 문서를 갱신한다                 |

만드는 함수는 두 가지다.

| 함수                          | 위치                                                                | 입력                       |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------- |
| `getLectureTreeOutline`       | `src/entities/lecture/model/generation/treeOutline.ts`              | `{ id, parentId, name }[]` |
| `getEditorLectureTreeOutline` | `src/features/tree-editor/lib/lecture/getEditorLectureTreeNodes.ts` | 편집기 노드와 엣지         |

편집기 쪽은 `getEditorLectureTreeNodes`로 서버 ID 트리를 만든 뒤 outline을 만든다. 컴파일러 트리(`createEditorLectureCompilerTree`)도 같은 함수를 거치므로, 모델이 본 노드와 컴파일러가 인정하는 노드가 같다.

## 어휘

모델이 고를 수 있는 intent, role, delivery 값과 그 뜻은 [lecture-generation-vocabulary.json](./lecture-generation-vocabulary.json)이다. `getLectureGenerationVocabulary`가 만든 파일이므로 직접 고치지 않는다.

| 필드                     | 내용                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `scenarioSchemaVersion`  | 시나리오의 `scenarioSchemaVersion`에 쓸 값                    |
| `recipeRegistryVersions` | 시나리오의 `recipeRegistryVersion`에 쓸 수 있는 값            |
| `intents`                | intent마다 뜻과 role 목록. role은 이름, 개수, 필수 여부, 설명 |
| `delivery`               | delivery 필드마다 뜻과 값 목록                                |
| `rules`                  | JSON Schema로 표현할 수 없거나 모델이 자주 틀리는 규칙        |

role의 개수(`one`은 ID 하나, `many`는 비어 있지 않은 ID 배열)와 필수 여부는 [JSON Schema](./lecture-scenario.schema.json)의 `Cue`에서 읽는다. 뜻과 설명만 `vocabulary.ts`에 손으로 적고, 타입 검사가 intent·role·delivery 값의 빈자리를 알려 준다.

어휘를 바꾼 뒤에는 파일을 다시 만든다. 파일이 낡으면 테스트가 실패한다.

```bash
pnpm exec vitest run src/entities/lecture/model/generation/vocabulary.test.ts -u
```

## 넣지 않는 것

모델은 "무엇을 가르칠지"만 고른다([책임 경계](./lecture-scenario-contract.md#책임-경계)). 그래서 outline과 어휘에는 다음이 없다.

- atomic 동작 이름(`highlight`, `focus`, `dim` 등). `trace`는 intent 이름이기도 해서 intent로만 나온다.
- 시간(`durationMs`, `fallbackDurationMs`, `300ms` 같은 값)
- easing, 색, 투명도 같은 CSS 값

`vocabulary.test.ts`가 어휘의 모든 문자열에서 이 값을 찾아 실패시킨다.

## 백엔드가 할 일

- outline, 어휘, 사용자 요청을 프롬프트에 싣는다. 어휘 파일은 이 저장소의 파일을 그대로 읽거나 복사한다.
- 모델 응답을 그대로 프론트엔드에 넘긴다. 시나리오 검사와 컴파일은 프론트엔드가 한다.

## 출력 스키마

모델 출력은 OpenAI structured output의 strict 모드(`response_format: { type: "json_schema", json_schema: { strict: true, ... } }`)로 받는다. strict 모드는 JSON Schema의 일부만 받으므로, 이 모드에 넘길 스키마는 [lecture-scenario.strict.schema.json](./lecture-scenario.strict.schema.json)으로 따로 둔다. `getLectureScenarioStrictJsonSchema`가 [시나리오 JSON Schema](./lecture-scenario.schema.json)를 옮겨 만든 파일이므로 직접 고치지 않는다.

[OpenAI 문서의 Supported schemas](https://developers.openai.com/api/docs/guides/structured-outputs)를 2026-11에 확인한 기준이다.

| 시나리오 JSON Schema | strict 스키마                   | 이유                            |
| -------------------- | ------------------------------- | ------------------------------- |
| 선택 필드            | `required`에 넣고 `null`을 허용 | 모든 필드가 `required`여야 한다 |
| `oneOf` (cue)        | `anyOf`                         | 지원 목록에 `anyOf`만 있다      |
| `const`              | 값 하나짜리 `enum`              | 문서에 `const` 지원이 없다      |
| `minLength`          | 뺀다                            | 문자열 지원 목록에 없다         |
| `$schema`            | 뺀다                            | 문서에 없다                     |

`pattern`, `minItems`, `$defs`와 `$ref`는 그대로 둔다. 루트는 `anyOf`가 아닌 객체이고, 모든 객체에 `additionalProperties: false`가 있다. 시나리오 스키마에 확인하지 않은 키워드가 생기면 변환이 실패한다. 지원 여부를 확인한 뒤 `STRICT_JSON_SCHEMA_KEYWORDS`에 더한다.

strict 모드 응답은 빠진 필드를 `null`로 채워 온다. `getLectureScenarioWithoutNulls`가 객체의 `null` 필드를 빼서 시나리오 계약의 모양으로 되돌린 뒤, `lectureScenarioSchema`로 다시 검사한다. 이 검사가 strict 스키마에서 빠진 빈 문자열, 노드 중복, ID 중복을 잡는다.

`strictJsonSchema.test.ts`는 모든 valid fixture를 strict 응답 모양으로 바꿨다가 되돌려, 원래 시나리오와 같고 스키마를 통과하는지 확인한다.

시나리오 스키마를 바꾼 뒤에는 두 파일을 함께 다시 만든다.

```bash
pnpm exec vitest run src/entities/lecture/model/scenario/jsonSchema.test.ts src/entities/lecture/model/generation/strictJsonSchema.test.ts -u
```

## 응답 처리

`getLectureGenerationResult`가 모델 응답 문자열을 세 단계로 처리한다. 결과의 `failedStep`이 멈춘 단계를 알려 주고, 로그와 평가는 이 값으로 실패를 나눈다.

```text
응답 문자열 ─json→ JSON ─schema→ getLectureScenarioWithoutNulls, lectureScenarioSchema ─compile→ 대본
```

| 단계      | 실패의 뜻                                        | 대응                    |
| --------- | ------------------------------------------------ | ----------------------- |
| `json`    | 응답이 잘렸거나 모델이 거절했다                  | 같은 요청을 다시 보낸다 |
| `schema`  | strict 스키마가 못 막는 규칙을 어겼다            | repair                  |
| `compile` | 없는 노드, 트리와 맞지 않는 role, 조합·시간 문제 | repair                  |

문제(`issues`)는 컴파일러의 문제 형식에 `json` 단계를 더한 것이다. `json` 단계 문제는 시나리오 위치가 없어 `path`가 빈 배열이다.

### 측정값

성공과 실패 모두 `metrics`를 담는다.

| 필드                                  | 내용                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| `issueCountByStage`                   | 단계별 문제 수(error와 warning). 문제가 없는 단계도 0으로 둔다 |
| `sceneCount`, `beatCount`, `cueCount` | 시나리오 크기. 스키마를 통과하지 못하면 `null`                 |
| `usage`                               | `{ inputTokens, outputTokens }`. 백엔드가 담아 준 값           |

토큰 사용량은 프론트엔드가 셀 수 없으므로 백엔드가 모델 응답의 `usage`를 생성 응답에 함께 담아 준다. 받지 못하면 `null`이다.

## Repair

컴파일까지 가지 못한 시나리오는 문제를 알려 주고 한 번 고쳐 받는다. `getLectureRepairRequest`가 정책에 맞을 때만 요청을 만든다.

| 정책           | 값                                                                       |
| -------------- | ------------------------------------------------------------------------ |
| 대상 단계      | `schema`, `compile`. `json`은 고칠 시나리오가 없어 다시 요청한다         |
| 대상 문제      | error만. warning은 대본을 만들 수 있다                                   |
| 최대 횟수      | `MAX_LECTURE_REPAIR_ATTEMPTS` = 1                                        |
| 요청당 문제 수 | `MAX_LECTURE_REPAIR_ISSUES` = 20. 넘는 수는 `omittedIssueCount`로 알린다 |

요청 형식은 다음과 같다.

```json
{
  "attempt": 1,
  "previousResponseText": "{\"scenarioSchemaVersion\":1, ...}",
  "issues": [
    {
      "stage": "node",
      "path": "$.scenes[0].beats[0].cues[0].roles.subject",
      "message": "트리에 없는 노드(999)입니다."
    }
  ],
  "omittedIssueCount": 0
}
```

`path`는 `$`로 시작하는 경로다. 배열 순번은 대괄호, 필드는 점으로 잇는다. 직전 응답을 함께 보내 백엔드가 요청 사이에 상태를 갖지 않게 한다. 백엔드는 처음 요청의 outline, 어휘와 함께 이 내용을 프롬프트에 싣고, 같은 strict 스키마로 다시 받는다.

## 다음 단계

아래는 #137의 다음 단계에서 정한다.

- 대표 요청과 기대 속성을 담은 평가 fixture, 저장한 응답을 채점하는 오프라인 실행기
- 백엔드 엔드포인트 요청·응답 형식
